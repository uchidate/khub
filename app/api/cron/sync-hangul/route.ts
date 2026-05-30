import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { logCronRun } from '@/lib/services/cron-execution-service'
import { createLogger } from '@/lib/utils/logger'
import prisma from '@/lib/prisma'

const log = createLogger('CRON_SYNC_HANGUL')

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const KOREAN_REGEX = /[가-힯ㄱ-ㅎㅏ-ㅣ]/

/**
 * POST /api/cron/sync-hangul
 *
 * Preenche nameHangul para artistas coreanos sem nome em hangul.
 * Busca also_known_as do TMDB e extrai o nome em Hangul.
 *
 * Prioriza artistas com tmdbId, sem nameHangul, que nunca foram tentados
 * (hangulSyncAt IS NULL). Após tentativa, marca hangulSyncAt independente
 * do resultado para evitar reprocessamento.
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

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB_API_KEY not configured' }, { status: 500 })
  }

  const lockId = await acquireCronLock('cron-sync-hangul')
  if (!lockId) {
    return NextResponse.json({ skipped: true, reason: 'lock_active' })
  }

  const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '100'), 500)

  try {
    // Prioridade 1: sem hangul, nunca tentado
    const candidates = await prisma.artist.findMany({
      where: {
        nameHangul: null,
        tmdbId: { not: null },
        hangulSyncAt: null,
      },
      select: { id: true, tmdbId: true, nameRomanized: true },
      take: limit,
      orderBy: { trendingScore: 'desc' }, // artistas mais relevantes primeiro
    })

    let filled = 0
    let notFound = 0
    let errors = 0

    for (const artist of candidates) {
      try {
        const res = await fetch(
          `${TMDB_BASE_URL}/person/${artist.tmdbId}?api_key=${TMDB_API_KEY}&language=en-US`,
          { signal: AbortSignal.timeout(8000) }
        )

        const hangulSyncAt = new Date()

        if (!res.ok) {
          await prisma.artist.update({ where: { id: artist.id }, data: { hangulSyncAt } })
          notFound++
          continue
        }

        const data = await res.json()
        const alsoKnownAs: string[] = data.also_known_as || []
        const hangul = alsoKnownAs.find(n => KOREAN_REGEX.test(n)) ?? null

        await prisma.artist.update({
          where: { id: artist.id },
          data: {
            nameHangul: hangul,
            hangulSyncAt,
            ...(hangul ? { flaggedAsNonKorean: false } : {}), // hangul = confirmado coreano
          },
        })

        if (hangul) filled++
        else notFound++
      } catch {
        errors++
        await prisma.artist.update({
          where: { id: artist.id },
          data: { hangulSyncAt: new Date() },
        }).catch(() => {})
      }
    }

    log.info('Sync hangul completed', { candidates: candidates.length, filled, notFound, errors })
    await logCronRun(
      'sync-hangul',
      'success',
      `${filled} hangul preenchido(s) de ${candidates.length} candidatos`,
      { filled, notFound, errors },
    )

    return NextResponse.json({ ok: true, filled, notFound, errors, candidates: candidates.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Sync hangul failed', { error: message })
    await logCronRun('sync-hangul', 'failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await releaseCronLock('cron-sync-hangul', lockId)
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'POST para sincronizar nameHangul via TMDB also_known_as',
    hint: 'POST /api/cron/sync-hangul?limit=100',
  })
}
