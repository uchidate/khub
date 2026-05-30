import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { logCronRun } from '@/lib/services/cron-execution-service'
import { logSystemEvent } from '@/lib/services/system-event-service'
import { getTMDBProductionDiscoveryService, type PeriodPreviewItem } from '@/lib/services/tmdb-production-discovery-service'
import { getProductionCastService } from '@/lib/services/production-cast-service'
import prisma from '@/lib/prisma'

export const maxDuration = 300

const log = createLogger('CRON-REFRESH-PRODUCTIONS')

type ProductionType = 'tv' | 'movie'

interface Candidate extends PeriodPreviewItem {
  type: ProductionType
  monthKey: string
  score: number
}

function verifyToken(request: NextRequest): boolean {
  const authToken =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.nextUrl.searchParams.get('token')
  const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
  if (!expectedToken || !authToken) return false
  if (authToken.length !== expectedToken.length) return false
  try {
    return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
  } catch {
    return false
  }
}

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function monthWindows(monthsBack: number, monthsAhead: number): Array<{ year: number; month: number; key: string }> {
  const now = new Date()
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const windows: Array<{ year: number; month: number; key: string }> = []

  for (let offset = -monthsBack; offset <= monthsAhead; offset++) {
    const d = new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + offset, 1))
    const year = d.getUTCFullYear()
    const month = d.getUTCMonth() + 1
    windows.push({ year, month, key: `${year}-${String(month).padStart(2, '0')}` })
  }

  return windows
}

function candidateScore(item: PeriodPreviewItem, monthKey: string): number {
  const dateScore = item.date ? new Date(item.date).getTime() / 86_400_000 : 0
  const voteScore = Math.min(item.voteCount ?? 0, 1000) / 10
  const ratingScore = (item.voteAverage ?? 0) * 5
  // Recent/future date remains the main signal; popularity proxies are secondary.
  return dateScore + voteScore + ratingScore + Number(monthKey.replace('-', '')) / 100
}

async function discoverCandidates(params: {
  types: ProductionType[]
  monthsBack: number
  monthsAhead: number
  pagesPerMonth: number
}): Promise<Candidate[]> {
  const svc = getTMDBProductionDiscoveryService()
  const windows = monthWindows(params.monthsBack, params.monthsAhead)
  const byKey = new Map<string, Candidate>()

  for (const type of params.types) {
    const dateSort = type === 'tv' ? 'first_air_date.desc' : 'release_date.desc'
    const sortModes = ['popularity.desc', dateSort]

    for (const window of windows) {
      for (const sortBy of sortModes) {
        for (let page = 1; page <= params.pagesPerMonth; page++) {
          const preview = await svc.previewByPeriod({
            type,
            year: window.year,
            month: window.month,
            page,
            sortBy,
          })

          if (preview.results.length === 0) break

          for (const item of preview.results) {
            const key = `${type}:${item.tmdbId}`
            const candidate: Candidate = {
              ...item,
              type,
              monthKey: window.key,
              score: candidateScore(item, window.key),
            }
            const existing = byKey.get(key)
            if (!existing || candidate.score > existing.score) {
              byKey.set(key, candidate)
            }
          }

          if (page >= preview.totalPages) break
        }
      }
    }
  }

  return [...byKey.values()].sort((a, b) => b.score - a.score)
}

async function refreshExistingProduction(productionId: string, tmdbId: number, type: ProductionType): Promise<boolean> {
  const svc = getTMDBProductionDiscoveryService()
  const prod = await svc.getFullProductionData(tmdbId, type)
  if (!prod) return false

  await prisma.production.update({
    where: { id: productionId },
    data: {
      tmdbType: prod.tmdbType,
      releaseDate: prod.releaseDate,
      year: prod.releaseDate ? prod.releaseDate.getUTCFullYear() : undefined,
      runtime: prod.tmdbType === 'movie' ? prod.runtime : undefined,
      episodeRuntime: prod.tmdbType === 'tv' ? (prod.episodeRuntime ?? prod.runtime) : undefined,
      voteAverage: prod.voteAverage,
      tagline: prod.tagline,
      imageUrl: prod.imageUrl ?? undefined,
      backdropUrl: prod.backdropUrl ?? undefined,
      galleryUrls: prod.galleryUrls.length > 0 ? prod.galleryUrls : undefined,
      trailerUrl: prod.trailerUrl ?? undefined,
      ageRating: prod.ageRating ?? undefined,
      episodeCount: prod.episodeCount,
      seasonCount: prod.seasonCount,
      network: prod.network,
      productionStatus: prod.productionStatus,
      tags: prod.tags.length > 0 ? prod.tags : undefined,
    },
  })

  return true
}

async function importProduction(tmdbId: number, type: ProductionType): Promise<{ created: boolean; castSynced: number }> {
  const svc = getTMDBProductionDiscoveryService()
  const castSvc = getProductionCastService()
  const prod = await svc.getFullProductionData(tmdbId, type)
  if (!prod) return { created: false, castSynced: 0 }

  const releaseYear = prod.releaseDate ? prod.releaseDate.getUTCFullYear() : null
  const hasPtSynopsis = !!prod.synopsis && prod.synopsisSource === 'tmdb_pt'

  const created = await prisma.production.create({
    data: {
      titlePt: prod.titlePt,
      titleKr: prod.titleKr,
      type: prod.type,
      year: releaseYear,
      synopsis: prod.synopsis || null,
      synopsisSource: prod.synopsis ? prod.synopsisSource : null,
      tagline: prod.tagline,
      imageUrl: prod.imageUrl,
      backdropUrl: prod.backdropUrl,
      galleryUrls: prod.galleryUrls,
      releaseDate: prod.releaseDate,
      runtime: prod.tmdbType === 'movie' ? prod.runtime : null,
      episodeRuntime: prod.tmdbType === 'tv' ? (prod.episodeRuntime ?? prod.runtime) : null,
      voteAverage: prod.voteAverage,
      trailerUrl: prod.trailerUrl,
      tags: prod.tags,
      ageRating: prod.ageRating,
      tmdbId: String(prod.tmdbId),
      tmdbType: prod.tmdbType,
      episodeCount: prod.episodeCount,
      seasonCount: prod.seasonCount,
      network: prod.network,
      productionStatus: prod.productionStatus,
      translationStatus: hasPtSynopsis ? 'completed' : 'pending',
      translatedAt: hasPtSynopsis ? new Date() : null,
      needsCuration: true,
      isHidden: true,
    },
  })

  try {
    const cast = await castSvc.syncProductionCast(created.id)
    return { created: true, castSynced: cast.synced }
  } catch {
    return { created: true, castSynced: 0 }
  }
}

async function runRefresh(params: {
  monthsBack: number
  monthsAhead: number
  pagesPerMonth: number
  maxImports: number
  maxRefreshes: number
  types: ProductionType[]
  dryRun: boolean
}) {
  const candidates = await discoverCandidates(params)
  const tmdbIds = candidates.map(candidate => String(candidate.tmdbId))
  const existingRows = tmdbIds.length > 0
    ? await prisma.production.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: { id: true, tmdbId: true, titlePt: true },
    })
    : []
  const existingByTmdbId = new Map(existingRows.map(row => [row.tmdbId, row]))

  let imported = 0
  let refreshed = 0
  let skipped = 0
  let errors = 0
  let castSynced = 0

  for (const candidate of candidates) {
    const existing = existingByTmdbId.get(String(candidate.tmdbId))

    if (existing) {
      if (refreshed >= params.maxRefreshes) {
        skipped++
        continue
      }
      if (!params.dryRun) {
        try {
          const ok = await refreshExistingProduction(existing.id, candidate.tmdbId, candidate.type)
          if (!ok) {
            errors++
            continue
          }
        } catch (err) {
          log.warn('Existing production refresh failed', { tmdbId: candidate.tmdbId, error: err instanceof Error ? err.message : String(err) })
          errors++
          continue
        }
      }
      refreshed++
      continue
    }

    if (imported >= params.maxImports) {
      skipped++
      continue
    }

    if (!params.dryRun) {
      try {
        const result = await importProduction(candidate.tmdbId, candidate.type)
        if (!result.created) {
          errors++
          continue
        }
        castSynced += result.castSynced
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('Unique constraint') || message.includes('unique constraint')) {
          skipped++
          continue
        }
        log.warn('Production import failed', { tmdbId: candidate.tmdbId, error: message })
        errors++
        continue
      }
    }
    imported++
  }

  return {
    discovered: candidates.length,
    existing: existingRows.length,
    imported,
    refreshed,
    skipped,
    errors,
    castSynced,
  }
}

export async function POST(request: NextRequest) {
  if (!verifyToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const monthsBack = clampInt(sp.get('months_back'), 2, 0, 12)
  const monthsAhead = clampInt(sp.get('months_ahead'), 4, 0, 12)
  const pagesPerMonth = clampInt(sp.get('pages'), 2, 1, 5)
  const maxImports = clampInt(sp.get('max_imports'), 20, 0, 100)
  const maxRefreshes = clampInt(sp.get('max_refreshes'), 30, 0, 150)
  const dryRun = sp.get('dry_run') === 'true'
  const requestedTypes = (sp.get('types') ?? 'tv,movie')
    .split(',')
    .filter((type): type is ProductionType => type === 'tv' || type === 'movie')
  const types: ProductionType[] = requestedTypes.length > 0 ? requestedTypes : ['tv', 'movie']
  const requestId = `refresh-productions-${Date.now()}`

  const lockId = await acquireCronLock('cron-refresh-productions')
  if (!lockId) {
    return NextResponse.json({ skipped: true, reason: 'already_running' }, { status: 409 })
  }

  const params = { monthsBack, monthsAhead, pagesPerMonth, maxImports, maxRefreshes, types, dryRun }
  log.info('Production refresh started', { requestId, ...params })

  runRefresh(params)
    .then(result => {
      log.info('Production refresh completed', { requestId, ...result })
      return logCronRun(
        'refresh-productions',
        result.errors > 0 ? 'partial' : 'success',
        `${result.imported} produção(ões) importada(s), ${result.refreshed} atualizada(s)`,
        { requestId, ...result },
      )
    })
    .then(() => releaseCronLock('cron-refresh-productions', lockId))
    .catch(async err => {
      await logCronRun('refresh-productions', 'failed', 'Atualização de produções falhou', { requestId }).catch(() => {})
      await logSystemEvent('ERROR', 'cron-refresh-productions', 'Atualização de produções falhou', {
        requestId,
        error: err instanceof Error ? err.message : String(err),
      }).catch(() => {})
      await releaseCronLock('cron-refresh-productions', lockId).catch(() => {})
      onCronError(log, 'cron-refresh-productions', 'Production refresh failed')(err)
    })

  return NextResponse.json({
    success: true,
    status: 'accepted',
    requestId,
    params,
  }, { status: 202 })
}

export async function GET(request: NextRequest) {
  return POST(request)
}
