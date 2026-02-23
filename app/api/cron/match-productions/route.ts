import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getTmdbProductionMatchService } from '@/lib/services/tmdb-production-match-service';

/**
 * Cron Job - Match Productions to TMDB
 *
 * Searches TMDB by title to find and link tmdbId for productions that don't have one.
 * After matching, enriches with: backdropUrl, runtime, voteAverage, releaseDate,
 * trailerUrl, synopsis (if missing), imageUrl (if missing).
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * POST /api/cron/match-productions         → process 5 productions
 * POST /api/cron/match-productions?limit=N → process N (max 20)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-match-productions-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_MATCH_PRODUCTIONS',
                message,
                requestId,
                ...context,
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_MATCH_PRODUCTIONS',
                message,
                requestId,
                ...context,
            }));
        },
    };

    // Authentication
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                     request.nextUrl.searchParams.get('token');
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

    if (!expectedToken) {
        log.error('CRON_SECRET not configured');
        return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 });
    }

    const tokenValid = authToken !== null
        && authToken.length === expectedToken.length
        && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken));

    if (!tokenValid) {
        log.error('Unauthorized access attempt');
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '5');
    const limit = Math.min(Math.max(1, rawLimit), 50);
    const mode = request.nextUrl.searchParams.get('mode') || 'match';

    log.info('Starting production TMDB match job in background', { limit, mode });

    if (mode === 'backfill-tv') {
        runBackfillTvSeries(limit, requestId, log).catch(err => {
            log.error('Unhandled error in background TV backfill', {
                error: err instanceof Error ? err.message : String(err),
            });
        });
    } else {
        runMatchProductions(limit, requestId, log).catch(err => {
            log.error('Unhandled error in background production match', {
                error: err instanceof Error ? err.message : String(err),
            });
        });
    }

    return NextResponse.json({
        status: 'accepted',
        message: mode === 'backfill-tv'
            ? 'TV series backfill started in background'
            : 'Production TMDB match started in background',
        requestId,
        limit,
        mode,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function runMatchProductions(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const service = getTmdbProductionMatchService();
        const result = await service.matchPendingProductions(limit);
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('Production match job completed', { result, duration_s: duration });
    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Production match job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration,
        });
    }
}

async function runBackfillTvSeries(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();
    try {
        const service = getTmdbProductionMatchService();
        const result = await service.backfillTvSeriesFields(limit);
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.info('TV series backfill completed', { result, duration_s: duration });
    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('TV series backfill failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration,
        });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/match-productions?limit=5 | POST /api/cron/match-productions?mode=backfill-tv&limit=20',
    }, { status: 405 });
}
