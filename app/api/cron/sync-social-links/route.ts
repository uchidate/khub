import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSocialLinksSyncService } from '@/lib/services/social-links-sync-service';

/**
 * Cron Job - Sync Artist Social Links
 *
 * Fetches social media external IDs from TMDB for artists that don't have
 * social links yet (or haven't been updated in 30+ days).
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * POST /api/cron/sync-social-links         → sync 10 artists
 * POST /api/cron/sync-social-links?limit=N → sync N artists (max 50)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-social-links-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_SYNC_SOCIAL_LINKS',
                message,
                requestId,
                ...context,
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_SYNC_SOCIAL_LINKS',
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

    const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const limit = Math.min(Math.max(1, rawLimit), 50);

    log.info('Starting social links sync job in background', { limit });

    // Fire-and-forget background processing
    runSocialLinksSync(limit, requestId, log).catch(err => {
        log.error('Unhandled error in background social links sync', {
            error: err instanceof Error ? err.message : String(err),
        });
    });

    return NextResponse.json({
        status: 'accepted',
        message: 'Social links sync started in background',
        requestId,
        limit,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function runSocialLinksSync(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const service = getSocialLinksSyncService();
        const result = await service.syncPendingArtistSocialLinks(limit);
        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('Social links sync job completed', { result, duration_s: duration });
    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Social links sync job failed', {
            error: error.message,
            stack: error.stack,
            duration_s: duration,
        });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/sync-social-links?limit=10',
    }, { status: 405 });
}
