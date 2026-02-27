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
import { getErrorMessage } from '@/lib/utils/error'
import { syncStreamingShows } from '@/lib/services/streaming-show-service'

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
        .then(results => log.info('Fetch streaming shows completed', {
            requestId,
            sources: results.map(r => ({ source: r.source, upserted: r.upserted, error: r.error })),
        }))
        .catch(err => log.error('Fetch streaming shows failed', { requestId, error: getErrorMessage(err) }))

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
