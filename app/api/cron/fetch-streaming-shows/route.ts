/**
 * POST /api/cron/fetch-streaming-shows
 *
 * Sincroniza o catálogo de shows populares nos streamings (StreamingShow).
 * Separado do fetch-streaming-signals (artist-centric para trendingScore).
 *
 * Fontes: TMDB /trending/tv/day (global) + /discover/tv por plataforma
 * Frequência: 1x por dia
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { syncStreamingShows } from '@/lib/services/streaming-show-service'
import { logSystemEvent } from '@/lib/services/system-event-service'
import { logCronRun } from '@/lib/services/cron-execution-service'

export const maxDuration = 120

const log = createLogger('CRON-STREAMING-SHOWS')

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

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = `streaming-shows-${Date.now()}`
    log.info('Fetch streaming shows started', { requestId })

    syncStreamingShows()
        .then(results => {
            const failed = results.filter(result => result.error)
            log.info('Fetch streaming shows completed', {
                requestId,
                sources: results.map(r => ({ source: r.source, upserted: r.upserted, error: r.error })),
            })
            const totalUpserted = results.reduce((sum, result) => sum + result.upserted, 0)
            logCronRun(
                'fetch-streaming-shows',
                failed.length > 0 ? 'partial' : 'success',
                `${totalUpserted} show(s) atualizado(s), ${failed.length} fonte(s) com erro`,
                { requestId, totalUpserted, failedSources: failed.length },
            ).catch(() => {})
            if (failed.length > 0) {
                logSystemEvent('ERROR', 'cron-fetch-streaming-shows', `Top shows concluído com falhas em ${failed.length} fonte(s)`, {
                    requestId,
                    sources: failed.map(result => result.source),
                }).catch(() => {})
            }
        })
        .catch(err => {
            logCronRun('fetch-streaming-shows', 'failed', 'Atualização de top shows falhou', { requestId }).catch(() => {})
            onCronError(log, 'cron-fetch-streaming-shows', 'Fetch streaming shows failed')(err)
        })

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
