import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getProductionCastService } from '@/lib/services/production-cast-service';

/**
 * Cron Job - Sync Production Cast
 *
 * Fetches top 5 cast members from TMDB for each production that hasn't had
 * its cast synced yet (or is stale), creating/updating Artist records and
 * linking them via ArtistProduction.
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * POST /api/cron/sync-cast         → sync 5 productions
 * POST /api/cron/sync-cast?limit=N → sync N productions (max 20)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-cast-sync-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_SYNC_CAST',
                message,
                requestId,
                ...context,
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_SYNC_CAST',
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
    const limit = Math.min(Math.max(1, rawLimit), 20);

    log.info('Starting cast sync job in background', { limit });

    // Fire-and-forget background processing
    runCastSync(limit, requestId, log).catch(err => {
        log.error('Unhandled error in background cast sync', {
            error: err instanceof Error ? err.message : String(err),
        });
    });

    return NextResponse.json({
        status: 'accepted',
        message: 'Cast sync started in background',
        requestId,
        limit,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function runCastSync(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const service = getProductionCastService();
        const result = await service.syncPendingProductionCasts(limit);
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('Cast sync job completed', { result, duration_s: duration });
    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Cast sync job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration,
        });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/sync-cast?limit=5',
    }, { status: 405 });
}
