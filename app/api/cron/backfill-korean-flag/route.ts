import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { logCronRun } from '@/lib/services/cron-execution-service'
import { createLogger } from '@/lib/utils/logger'
import { isRelevantToKoreanCulture } from '@/lib/utils/korean-validation'
import prisma from '@/lib/prisma'

const log = createLogger('CRON_BACKFILL_KOREAN_FLAG')

/**
 * POST /api/cron/backfill-korean-flag
 *
 * Avalia artistas antigos que ainda não foram classificados quanto à
 * relevância cultural coreana (flaggedAsNonKorean=false por padrão, nunca revisados).
 *
 * Critério seguro: só marca flaggedAsNonKorean=true se houver evidência POSITIVA
 * de origem não-coreana (placeOfBirth não vazio + não contém Coreia) E o artista
 * não tiver nameHangul (que é sinal forte de vínculo com a indústria coreana).
 *
 * Artistas sem dados (placeOfBirth=null e nameHangul=null) são pulados —
 * aguardam o sync-hangul ou resync TMDB para ter dados suficientes.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })

  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
    new URL(request.url).searchParams.get('token') || ''

  try {
    const valid = Buffer.from(cronSecret).length === Buffer.from(token).length &&
      timingSafeEqual(Buffer.from(cronSecret), Buffer.from(token))
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lockId = await acquireCronLock('cron-backfill-korean-flag')
  if (!lockId) {
    return NextResponse.json({ skipped: true, reason: 'lock_active' })
  }

  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '500'), 2000)

  try {
    // Candidatos: flaggedAsNonKorean=false, sem nameHangul, com placeOfBirth preenchido
    // → temos dados suficientes para avaliar sem chamar a API do TMDB
    const candidates = await prisma.artist.findMany({
      where: {
        flaggedAsNonKorean: false,
        nameHangul: null,
        placeOfBirth: { not: null },
        memberships: { none: {} }, // membros de grupo K-Pop sempre relevantes
      },
      select: {
        id: true,
        placeOfBirth: true,
        bio: true,
        trendingScore: true,
      },
      take: limit,
    })

    let flagged = 0
    let kept = 0
    let skipped = 0
    const toFlag: string[] = []

    for (const artist of candidates) {
      const relevant = isRelevantToKoreanCulture({
        place_of_birth: artist.placeOfBirth,
        biography: artist.bio ?? undefined,
        popularity: artist.trendingScore ?? 5,
        also_known_as: [], // sem nameHangul já filtrado acima
      })

      if (!relevant) {
        toFlag.push(artist.id)
      } else {
        kept++
      }
    }

    if (toFlag.length > 0) {
      const r = await prisma.artist.updateMany({
        where: { id: { in: toFlag }, flaggedAsNonKorean: false },
        data: { flaggedAsNonKorean: true, flaggedAt: new Date() },
      })
      flagged = r.count
    }

    skipped = candidates.length - flagged - kept

    log.info('Backfill Korean flag completed', { candidates: candidates.length, flagged, kept, skipped })
    await logCronRun(
      'backfill-korean-flag',
      'success',
      `${flagged} marcado(s) não-coreano, ${kept} mantido(s) relevante`,
      { flagged, kept, skipped },
    )

    return NextResponse.json({ ok: true, flagged, kept, skipped, candidates: candidates.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Backfill Korean flag failed', { error: message })
    await logCronRun('backfill-korean-flag', 'failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await releaseCronLock('cron-backfill-korean-flag', lockId)
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'POST para executar backfill de flaggedAsNonKorean',
    hint: 'POST /api/cron/backfill-korean-flag?limit=500',
  })
}
