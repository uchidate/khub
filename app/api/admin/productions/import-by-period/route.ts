import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getTMDBProductionDiscoveryService } from '@/lib/services/tmdb-production-discovery-service'
import { getErrorMessage } from '@/lib/utils/error'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/import-by-period
 *
 * Preview productions from TMDB for a given type + year/month.
 * Returns TMDB results enriched with { exists: boolean } based on tmdbId presence in DB.
 *
 * Query params: type (tv|movie), year, month? (1-12), page? (default 1), sortBy?
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const params = request.nextUrl.searchParams
  const type = params.get('type') as 'tv' | 'movie' | null
  const yearStr = params.get('year')
  const monthStr = params.get('month')
  const pageStr = params.get('page')
  const sortBy = params.get('sortBy') ?? 'popularity.desc'

  if (!type || (type !== 'tv' && type !== 'movie')) {
    return NextResponse.json({ error: 'type deve ser "tv" ou "movie"' }, { status: 400 })
  }
  if (!yearStr || isNaN(parseInt(yearStr))) {
    return NextResponse.json({ error: 'year é obrigatório e deve ser um número' }, { status: 400 })
  }

  const year = parseInt(yearStr)
  const month = monthStr ? parseInt(monthStr) : undefined
  const page = pageStr ? parseInt(pageStr) : 1

  try {
    const svc = getTMDBProductionDiscoveryService()
    const preview = await svc.previewByPeriod({ type, year, month, page, sortBy })

    if (preview.results.length === 0) {
      return NextResponse.json({ ...preview, results: [] })
    }

    // Check which tmdbIds already exist in DB (single query)
    const tmdbIds = preview.results.map((r) => String(r.tmdbId))
    const existing = await prisma.production.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: { tmdbId: true, id: true, titlePt: true },
    })
    const existingMap = new Map(existing.map((p) => [p.tmdbId!, { id: p.id, titlePt: p.titlePt }]))

    const results = preview.results.map((item) => ({
      ...item,
      exists: existingMap.has(String(item.tmdbId)),
      existingId: existingMap.get(String(item.tmdbId))?.id ?? null,
    }))

    return NextResponse.json({ ...preview, results })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

const importSchema = z.object({
  items: z.array(
    z.object({
      tmdbId: z.number().int().positive(),
      type: z.enum(['tv', 'movie']),
    })
  ).min(1).max(50),
})

/**
 * POST /api/admin/productions/import-by-period
 *
 * Import selected TMDB productions with full metadata:
 * title, synopsis, images, trailer, episodes, network, age rating, etc.
 *
 * Body: { items: Array<{ tmdbId: number, type: 'tv' | 'movie' }> }
 * Returns: { created, skipped, errors, details[] }
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { items } = parsed.data

  const svc = getTMDBProductionDiscoveryService()
  let created = 0
  let skipped = 0
  let errors = 0
  const details: Array<{ tmdbId: number; status: 'created' | 'skipped' | 'error'; title?: string; reason?: string }> = []

  for (const item of items) {
    try {
      // Check if already exists
      const existingByTmdbId = await prisma.production.findFirst({
        where: { tmdbId: String(item.tmdbId) },
        select: { id: true, titlePt: true },
      })
      if (existingByTmdbId) {
        skipped++
        details.push({ tmdbId: item.tmdbId, status: 'skipped', title: existingByTmdbId.titlePt, reason: 'já existe (tmdbId)' })
        continue
      }

      // Fetch full production data from TMDB (details + age rating)
      const prod = await svc.getFullProductionData(item.tmdbId, item.type)
      if (!prod) {
        errors++
        details.push({ tmdbId: item.tmdbId, status: 'error', reason: 'não encontrado no TMDB' })
        continue
      }

      // Create production with all available fields
      const year = prod.releaseDate ? prod.releaseDate.getUTCFullYear() : null

      await prisma.production.create({
        data: {
          titlePt: prod.titlePt,
          titleKr: prod.titleKr,
          type: prod.type,
          year,
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
        },
      })

      created++
      details.push({ tmdbId: item.tmdbId, status: 'created', title: prod.titlePt })
    } catch (err) {
      const msg = getErrorMessage(err)
      // Unique constraint on titlePt
      if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
        skipped++
        details.push({ tmdbId: item.tmdbId, status: 'skipped', reason: 'título já existe no banco' })
      } else {
        errors++
        details.push({ tmdbId: item.tmdbId, status: 'error', reason: msg })
      }
    }
  }

  return NextResponse.json({ ok: true, created, skipped, errors, total: items.length, details })
}
