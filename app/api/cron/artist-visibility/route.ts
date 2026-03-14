import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getArtistVisibilityService } from '@/lib/services/artist-visibility-service'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('CRON_ARTIST_VISIBILITY')

/**
 * POST /api/cron/artist-visibility
 *
 * Reconcilia a visibilidade de todos os artistas com base nas suas produções:
 * - Oculta artistas sem produções visíveis
 * - Mostra artistas auto-ocultos que passaram a ter produções visíveis
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 */
export async function POST(request: NextRequest) {
  // Autenticação
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') || new URL(request.url).searchParams.get('token') || ''

  try {
    const secretBuf = Buffer.from(cronSecret)
    const tokenBuf = Buffer.from(token)
    const valid = secretBuf.length === tokenBuf.length && timingSafeEqual(secretBuf, tokenBuf)
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lockKey = 'cron:artist-visibility'
  const requestId = await acquireCronLock(lockKey)
  if (!requestId) {
    log.warn('Artist visibility reconciliation already running, skipping')
    return NextResponse.json({ skipped: true, reason: 'lock_active' })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '500'), 2000)

  try {
    log.info(`Starting artist visibility reconciliation (limit: ${limit})`)
    const result = await getArtistVisibilityService().reconcileAll(limit)
    log.info('Artist visibility reconciliation complete', result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    log.error('Artist visibility reconciliation failed', { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await releaseCronLock(lockKey, requestId)
  }
}
