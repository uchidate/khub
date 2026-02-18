import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';

/**
 * Cron Job - Backfill News Images
 *
 * For news articles without imageUrl, fetches og:image from the source article page.
 * Supports Koreaboo, Allkpop, Soompi, and any standard HTML page with og:image.
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via Authorization: Bearer ou ?token=
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * POST /api/cron/backfill-images         → process 20 articles
 * POST /api/cron/backfill-images?limit=N → process N articles (max 100)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-backfill-images-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (message: string, context?: any) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_BACKFILL_IMAGES',
                message,
                requestId,
                ...context,
            }));
        },
        error: (message: string, context?: any) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_BACKFILL_IMAGES',
                message,
                requestId,
                ...context,
            }));
        },
    };

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

    const rawLimit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const limit = Math.min(Math.max(1, rawLimit), 100);

    log.info('Starting image backfill job in background', { limit });

    runBackfill(limit, requestId, log).catch(err => {
        log.error('Unhandled error in background image backfill', {
            error: err instanceof Error ? err.message : String(err),
        });
    });

    return NextResponse.json({
        status: 'accepted',
        message: 'Image backfill started in background',
        requestId,
        limit,
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function extractOgImage(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0; +https://hallyuhub.com.br)',
                'Accept': 'text/html',
            },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) return null;

        const html = await response.text();

        // og:image (attribute order variations)
        const ogMatch =
            html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogMatch?.[1]) return ogMatch[1]

        // twitter:image
        const twitterMatch =
            html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        if (twitterMatch?.[1]) return twitterMatch[1]

        return null;
    } catch {
        return null;
    }
}

async function runBackfill(
    limit: number,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    const articles = await prisma.news.findMany({
        where: { imageUrl: null, sourceUrl: { not: '' } },
        select: { id: true, sourceUrl: true, title: true },
        take: limit,
        orderBy: { publishedAt: 'desc' },
    });

    log.info('Found articles without images', { count: articles.length });

    let updated = 0;
    let failed = 0;

    for (const article of articles) {
        if (!article.sourceUrl) continue;

        const imageUrl = await extractOgImage(article.sourceUrl);

        if (imageUrl) {
            await prisma.news.update({
                where: { id: article.id },
                data: { imageUrl },
            });
            updated++;
            console.log(`✅ Image found for "${article.title.slice(0, 50)}": ${imageUrl}`);
        } else {
            failed++;
            console.log(`ℹ️  No image found for "${article.title.slice(0, 50)}" (${article.sourceUrl})`);
        }

        // Small delay between requests to be polite
        await new Promise(r => setTimeout(r, 300));
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    log.info('Image backfill job completed', {
        result: { processed: articles.length, updated, failed },
        duration_s: duration,
    });
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/backfill-images?limit=20',
    }, { status: 405 });
}
