import { NextRequest, NextResponse } from 'next/server';
import { onCronError } from '@/lib/utils/cron-logger'
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service';

/**
 * Cron Job - Reprocessar artistas em notícias existentes
 *
 * Reprocessa notícias existentes para associar artistas usando o algoritmo
 * de extração melhorado (MusicalGroup, nameHangul, originalContent).
 * Útil após melhorias na extração para corrigir dados históricos.
 *
 * AUTENTICAÇÃO: Requer CRON_SECRET via header Authorization: Bearer ou ?token=
 *
 * RETORNO: 202 Accepted imediatamente — processamento continua em background.
 *
 * PARÂMETROS:
 * - ?limit=200   Notícias por execução (default: 200, máx: 1000)
 * - ?offset=0    Offset para paginar (default: 0)
 * - ?mode=all    Reprocessa TODAS (default). mode=missing: apenas sem artistas.
 */
export async function POST(request: NextRequest) {
    const requestId = `relink-artists-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const log = {
        info: (msg: string, ctx?: any) => console.log(JSON.stringify({
            timestamp: new Date().toISOString(), level: 'info',
            service: 'RELINK_NEWS_ARTISTS', message: msg, requestId, ...ctx
        })),
        error: (msg: string, ctx?: any) => console.error(JSON.stringify({
            timestamp: new Date().toISOString(), level: 'error',
            service: 'RELINK_NEWS_ARTISTS', message: msg, requestId, ...ctx
        })),
    };

    // Autenticação
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '')
        || request.nextUrl.searchParams.get('token');
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

    const limit = Math.min(1000, Math.max(1, parseInt(request.nextUrl.searchParams.get('limit') || '200')));
    const offset = Math.max(0, parseInt(request.nextUrl.searchParams.get('offset') || '0'));
    const mode = request.nextUrl.searchParams.get('mode') || 'all'; // 'all' | 'missing'

    log.info('Starting news artist relink job', { limit, offset, mode });

    runRelinkJob(prisma, limit, offset, mode, requestId, log).catch(onCronError(log, 'cron-relink-news-artists', 'Unhandled error in background job'));

    return NextResponse.json({
        status: 'accepted',
        message: 'News artist relink started in background',
        requestId,
        params: { limit, offset, mode },
        timestamp: new Date().toISOString(),
    }, { status: 202 });
}

async function runRelinkJob(
    prismaClient: typeof prisma,
    limit: number,
    offset: number,
    mode: string,
    requestId: string,
    log: { info: (msg: string, ctx?: any) => void; error: (msg: string, ctx?: any) => void }
) {
    const startTime = Date.now();

    try {
        const extractionService = getNewsArtistExtractionService(prismaClient);

        // Buscar lote de notícias
        const news = await prismaClient.news.findMany({
            where: mode === 'missing' ? { artists: { none: {} } } : {},
            take: limit,
            skip: offset,
            orderBy: { publishedAt: 'desc' },
            select: { id: true, title: true, contentMd: true, originalContent: true },
        });

        log.info(`Processing ${news.length} news articles`, { limit, offset, mode });

        let processed = 0;
        let linked = 0;
        let skipped = 0;
        let errors = 0;

        for (const item of news) {
            try {
                // Usar conteúdo original (mais fiel aos nomes reais dos artistas)
                const content = item.originalContent || item.contentMd;
                const mentions = await extractionService.extractArtists(item.title, content);

                if (mentions.length > 0) {
                    for (const mention of mentions) {
                        await prismaClient.newsArtist.upsert({
                            where: { newsId_artistId: { newsId: item.id, artistId: mention.artistId } },
                            update: {},
                            create: { newsId: item.id, artistId: mention.artistId },
                        });
                    }
                    linked += mentions.length;
                } else {
                    skipped++;
                }
                processed++;
            } catch (err: any) {
                log.error('Error processing news item', { newsId: item.id, error: err.message });
                errors++;
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000);

        log.info('News artist relink completed', {
            processed,
            linked,
            skipped,
            errors,
            duration_s: duration,
            nextOffset: offset + limit,
            hasMore: news.length === limit,
        });

    } catch (error: any) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        log.error('Relink job failed', { error: error.message, stack: error.stack, duration_s: duration });
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/relink-news-artists?limit=200&offset=0&mode=all'
    }, { status: 405 });
}
