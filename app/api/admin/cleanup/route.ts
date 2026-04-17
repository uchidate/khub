/**
 * GET  /api/admin/cleanup   → relatório de conteúdo não-relevante (somente leitura)
 * POST /api/admin/cleanup   → executa o backfill (flaga/exclui não-relevantes)
 *
 * Auth: Admin only
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-CLEANUP')

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

async function fetchTMDB<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${TMDB_API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function isKoreanOrigin(data: {
  origin_country?: string[]
  production_countries?: Array<{ iso_3166_1: string }>
}): boolean {
  if (data.origin_country?.includes('KR')) return true
  if (data.production_countries?.some(c => c.iso_3166_1 === 'KR')) return true
  return false
}

// ============================================================================
// GET — relatório somente leitura
// ============================================================================
export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const [
      totalProductions,
      flaggedProductions,
      productionsWithoutTmdb,
      totalArtists,
      flaggedArtists,
    ] = await Promise.all([
      prisma.production.count(),
      prisma.production.count({ where: { flaggedAsNonKorean: true } }),
      prisma.production.count({ where: { tmdbId: null, flaggedAsNonKorean: false } }),
      prisma.artist.count(),
      prisma.artist.count({ where: { flaggedAsNonKorean: true } }),
    ])

    // Amostras dos flagrados
    const flaggedProductionSamples = await prisma.production.findMany({
      where: { flaggedAsNonKorean: true },
      select: { titlePt: true, flaggedAt: true },
      take: 20,
      orderBy: { flaggedAt: 'desc' },
    })

    const flaggedArtistSamples = await prisma.artist.findMany({
      where: { flaggedAsNonKorean: true },
      select: { nameRomanized: true, placeOfBirth: true, flaggedAt: true },
      take: 20,
      orderBy: { flaggedAt: 'desc' },
    })

    const withoutTmdbSamples = await prisma.production.findMany({
      where: { tmdbId: null, flaggedAsNonKorean: false },
      select: { titlePt: true, titleKr: true, year: true, type: true },
      take: 20,
    })

    return NextResponse.json({
      productions: {
        total: totalProductions,
        visible: totalProductions - flaggedProductions,
        flagged: flaggedProductions,
        withoutTmdbId: productionsWithoutTmdb,
        flaggedSamples: flaggedProductionSamples,
        withoutTmdbSamples,
      },
      artists: {
        total: totalArtists,
        visible: totalArtists - flaggedArtists,
        flagged: flaggedArtists,
        flaggedSamples: flaggedArtistSamples,
      },
    })
  } catch (error) {
    log.error('Cleanup stats error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST — executa limpeza
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json() as { dryRun?: boolean }
    const isDryRun = body.dryRun !== false // default: dry-run por segurança

    log.info(`Cleanup iniciado (dryRun=${isDryRun})`)

    const results = {
      productions: { deleted: 0, flagged: 0, skipped: 0 },
      artists: { flagged: 0, skipped: 0 },
      dryRun: isDryRun,
    }

    // ── Produções sem tmdbId ──────────────────────────────────────────────────
    const withoutTmdb = await prisma.production.findMany({
      where: { flaggedAsNonKorean: false, tmdbId: null },
      select: { id: true, titlePt: true },
    })

    log.info(`Produções sem tmdbId: ${withoutTmdb.length}`)
    for (const p of withoutTmdb) {
      log.info(`  Excluindo: "${p.titlePt}"`)
    }

    if (!isDryRun && withoutTmdb.length > 0) {
      const ids = withoutTmdb.map(p => p.id)
      await prisma.artistProduction.deleteMany({ where: { productionId: { in: ids } } })
      await prisma.production.deleteMany({ where: { id: { in: ids } } })
    }
    results.productions.deleted = withoutTmdb.length

    // ── Produções com tmdbId — verificar origem ───────────────────────────────
    const prodsWithTmdb = await prisma.production.findMany({
      where: { flaggedAsNonKorean: false, tmdbId: { not: null } },
      select: { id: true, titlePt: true, tmdbId: true, tmdbType: true },
    })

    for (const prod of prodsWithTmdb) {
      const endpoint = prod.tmdbType === 'movie'
        ? `/movie/${prod.tmdbId}`
        : `/tv/${prod.tmdbId}`

      const details = await fetchTMDB<{
        origin_country?: string[]
        production_countries?: Array<{ iso_3166_1: string }>
      }>(endpoint)

      if (!details) continue

      if (!isKoreanOrigin(details)) {
        log.info(`  Flagrando produção: "${prod.titlePt}"`)
        if (!isDryRun) {
          await prisma.production.update({
            where: { id: prod.id },
            data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
          })
        }
        results.productions.flagged++
      } else {
        results.productions.skipped++
      }

      // Respeitar rate limit TMDB
      await new Promise(r => setTimeout(r, 60))
    }

    // ── Artistas — verificar por placeOfBirth ─────────────────────────────────
    const artists = await prisma.artist.findMany({
      where: { flaggedAsNonKorean: false },
      select: { id: true, nameRomanized: true, nameHangul: true, placeOfBirth: true },
    })

    for (const artist of artists) {
      // Tem nome em Hangul → manter
      if (artist.nameHangul && /[\uAC00-\uD7AF]/.test(artist.nameHangul)) {
        results.artists.skipped++
        continue
      }

      // Nasceu na Coreia → manter
      const birth = artist.placeOfBirth?.toLowerCase() || ''
      const isKoreanBirth = birth.includes('korea') || birth.includes('seoul') ||
        birth.includes('busan') || birth.includes('incheon')
      if (isKoreanBirth) {
        results.artists.skipped++
        continue
      }

      // Tem birthplace de outro país → flagar
      if (artist.placeOfBirth && !isKoreanBirth) {
        log.info(`  Flagrando artista: "${artist.nameRomanized}" (${artist.placeOfBirth})`)
        if (!isDryRun) {
          await prisma.artist.update({
            where: { id: artist.id },
            data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
          })
        }
        results.artists.flagged++
        continue
      }

      // Sem dados suficientes → manter (benefício da dúvida)
      results.artists.skipped++
    }

    log.info('Cleanup concluído', results)
    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    log.error('Cleanup error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
