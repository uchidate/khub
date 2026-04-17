import { NextRequest, NextResponse } from 'next/server';
import { onCronError } from '@/lib/utils/cron-logger'
import { timingSafeEqual } from 'crypto';
import { getDiscographySyncService } from '@/lib/services/discography-sync-service';
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service';

/**
 * Cron Job - Sync Artist Discography
 *
 * Syncs discography for artists that don't have data or have stale data (30+ days).
 * Uses MusicBrainz as primary source, AI (Gemini) as fallback.
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * POST /api/cron/sync-discography         → sync 5 artists
 * POST /api/cron/sync-discography?limit=N → sync N artists (max 20)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-discography-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_SYNC_DISCOGRAPHY',
                message,
                requestId,
                ...context,
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_SYNC_DISCOGRAPHY',
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

    log.info('Starting discography sync job in background', { limit });

    // Lock — evita encavalar execuções simultâneas
    const lockId = await acquireCronLock('cron-sync-discography');
    if (!lockId) {
        return NextResponse.json({
            success: false,
            skipped: true,
            reason: 'already_running',
            message: 'Discography sync já está em execução. Esta chamada foi ignorada.',
        }, { status: 409 });
    }

    // Fire-and-forget background processing
    runDiscographySync(limit, lockId, log).catch(onCronError(log, 'cron-sync-discography', 'Unhandled error in background job'));

    return NextResponse.json({
        status: 'accepted',
        message: 'Discography sync started in background',
        requestId,
        limit,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function runDiscographySync(
    limit: number,
    lockId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const service = getDiscographySyncService();
        const result = await service.syncPendingArtistDiscographies(limit);
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('Discography sync job completed', { result, duration_s: duration });
    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Discography sync job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration,
        });
    } finally {
        await releaseCronLock('cron-sync-discography', lockId);
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/sync-discography?limit=5',
    }, { status: 405 });
}
