import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Cron job endpoint para atualização automática de conteúdo
 *
 * Este endpoint deve ser chamado periodicamente (ex: a cada 15 minutos) por:
 * - Vercel Cron (configurado em vercel.json)
 * - GitHub Actions (workflow schedule)
 * - Serviço externo de cron (cron-job.org, etc.)
 *
 * Segurança: Requer token de autenticação via header ou query param
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    console.log('[CRON] Starting scheduled update job...');

    try {
        // 1. Verificar autenticação
        const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                         request.nextUrl.searchParams.get('token');
        const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

        if (!expectedToken) {
            console.error('[CRON] ❌ CRON_SECRET not configured');
            return NextResponse.json({
                success: false,
                error: 'Cron secret not configured'
            }, { status: 500 });
        }

        if (authToken !== expectedToken) {
            console.warn('[CRON] ⚠️  Unauthorized access attempt');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // 2. Executar atualizações
        const results = {
            artists: { updated: 0, errors: [] as string[] },
            news: { updated: 0, errors: [] as string[] },
            filmography: { synced: 0, errors: [] as string[] },
            trending: { updated: 0, errors: [] as string[] },
        };

        // 2.1. Gerar novos artistas (quantidade reduzida para cron frequente)
        try {
            console.log('[CRON] Generating artists...');
            const { AIOrchestrator } = require('@/lib/ai/orchestrator');
            const { ArtistGenerator } = require('@/lib/ai/generators/artist-generator');

            const orchestrator = new AIOrchestrator({
                geminiApiKey: process.env.GEMINI_API_KEY,
                openaiApiKey: process.env.OPENAI_API_KEY,
                claudeApiKey: process.env.ANTHROPIC_API_KEY,
                ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
                maxRetries: 2,
            });

            if (orchestrator.getAvailableProviders().length === 0) {
                throw new Error('No AI providers available');
            }

            // Preferir Ollama se disponível (gratuito)
            const preferredProvider = process.env.CRON_AI_PROVIDER ||
                                    (orchestrator.getAvailableProviders().includes('ollama') ? 'ollama' : undefined);

            const artistGenerator = new ArtistGenerator(orchestrator);
            const existingArtists = await prisma.artist.findMany({
                select: { nameRomanized: true }
            });
            const excludeArtists = existingArtists.map(a => a.nameRomanized);

            // Gerar 1-2 artistas por execução (para cron de 15min, isso dá ~6-8 artistas/hora)
            const artists = await artistGenerator.generateMultipleArtists(2, {
                excludeList: excludeArtists,
                preferredProvider
            });

            for (const artist of artists) {
                try {
                    // Validar e sanitizar
                    if (!artist.nameRomanized || artist.nameRomanized.trim().length === 0) {
                        continue;
                    }

                    // Converter roles string para array se necessário
                    if (artist.roles && typeof artist.roles === 'string') {
                        artist.roles = artist.roles.split(',')
                            .map((r: string) => r.trim())
                            .filter((r: string) => r.length > 0);
                    }

                    // Criar/encontrar agência
                    let agencyId: string | null = null;
                    if (artist.agencyName && typeof artist.agencyName === 'string' && artist.agencyName.trim().length > 0) {
                        let agency = await prisma.agency.findUnique({
                            where: { name: artist.agencyName },
                        });

                        if (!agency) {
                            agency = await prisma.agency.create({
                                data: {
                                    name: artist.agencyName,
                                    website: `https://${artist.agencyName.toLowerCase().replace(/\s+/g, '')}.com`,
                                    socials: {},
                                },
                            });
                        }
                        agencyId = agency.id;
                    }

                    await prisma.artist.upsert({
                        where: { nameRomanized: artist.nameRomanized },
                        update: {
                            nameHangul: artist.nameHangul || null,
                            birthDate: artist.birthDate || null,
                            roles: artist.roles || null,
                            bio: artist.bio || null,
                            primaryImageUrl: artist.primaryImageUrl || null,
                            agencyId,
                        },
                        create: {
                            nameRomanized: artist.nameRomanized,
                            nameHangul: artist.nameHangul || null,
                            birthDate: artist.birthDate || null,
                            roles: artist.roles || null,
                            bio: artist.bio || null,
                            primaryImageUrl: artist.primaryImageUrl || null,
                            agencyId,
                        },
                    });

                    results.artists.updated++;
                    console.log(`[CRON] ✅ Saved artist: ${artist.nameRomanized}`);
                } catch (error: any) {
                    console.error(`[CRON] ❌ Failed to save artist: ${error.message}`);
                    results.artists.errors.push(error.message);
                }
            }
        } catch (error: any) {
            console.error(`[CRON] ❌ Artist generation failed: ${error.message}`);
            results.artists.errors.push(error.message);
        }

        // 2.2. Gerar notícias
        try {
            console.log('[CRON] Generating news...');
            const { AIOrchestrator } = require('@/lib/ai/orchestrator');
            const { NewsGenerator } = require('@/lib/ai/generators/news-generator');

            const orchestrator = new AIOrchestrator({
                geminiApiKey: process.env.GEMINI_API_KEY,
                openaiApiKey: process.env.OPENAI_API_KEY,
                claudeApiKey: process.env.ANTHROPIC_API_KEY,
                ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
                maxRetries: 2,
            });

            const preferredProvider = process.env.CRON_AI_PROVIDER ||
                                    (orchestrator.getAvailableProviders().includes('ollama') ? 'ollama' : undefined);

            const newsGenerator = new NewsGenerator(orchestrator);
            const existingNews = await prisma.news.findMany({
                select: { title: true }
            });
            const excludeNews = existingNews.map(n => n.title);

            // Gerar 1-2 notícias por execução
            const newsItems = await newsGenerator.generateMultipleNews(2, {
                excludeList: excludeNews,
                preferredProvider
            });

            for (const news of newsItems) {
                try {
                    // Validar
                    if (!news.title || !news.contentMd || news.contentMd.length < 20) {
                        continue;
                    }

                    await prisma.news.upsert({
                        where: { title: news.title },
                        update: {
                            contentMd: news.contentMd,
                            sourceUrl: news.sourceUrl,
                            tags: news.tags,
                            publishedAt: news.publishedAt,
                        },
                        create: news,
                    });

                    results.news.updated++;
                    console.log(`[CRON] ✅ Saved news: ${news.title}`);
                } catch (error: any) {
                    console.error(`[CRON] ❌ Failed to save news: ${error.message}`);
                    results.news.errors.push(error.message);
                }
            }
        } catch (error: any) {
            console.error(`[CRON] ❌ News generation failed: ${error.message}`);
            results.news.errors.push(error.message);
        }

        // 2.3. Atualizar filmografias (2-3 artistas por execução)
        try {
            console.log('[CRON] Syncing filmographies...');
            const { getFilmographySyncService } = require('@/lib/services/filmography-sync-service');
            const filmographyService = getFilmographySyncService();

            const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias

            const artistsToUpdate = await prisma.artist.findMany({
                where: {
                    OR: [
                        { tmdbLastSync: { lt: cutoffDate } },
                        { tmdbLastSync: null, tmdbSyncStatus: { not: 'NOT_FOUND' } },
                        { productions: { none: {} } }
                    ]
                },
                take: 3,
                orderBy: [
                    { tmdbLastSync: { sort: 'asc', nulls: 'first' } }
                ],
                select: { id: true, nameRomanized: true }
            });

            if (artistsToUpdate.length > 0) {
                const result = await filmographyService.syncMultipleArtists(
                    artistsToUpdate.map(a => a.id),
                    2, // concurrency
                    'INCREMENTAL'
                );

                results.filmography.synced = result.successCount;
                console.log(`[CRON] ✅ Synced ${result.successCount} filmographies`);
            }
        } catch (error: any) {
            console.error(`[CRON] ❌ Filmography sync failed: ${error.message}`);
            results.filmography.errors.push(error.message);
        }

        // 2.4. Atualizar trending scores
        try {
            console.log('[CRON] Updating trending scores...');
            const { TrendingService } = require('@/lib/services/trending-service');
            const trendingService = TrendingService.getInstance();

            await trendingService.updateAllTrendingScores();
            results.trending.updated = 1; // Flag de sucesso
            console.log('[CRON] ✅ Trending scores updated');
        } catch (error: any) {
            console.error(`[CRON] ❌ Trending update failed: ${error.message}`);
            results.trending.errors.push(error.message);
        }

        // 3. Calcular métricas
        const duration = Date.now() - startTime;
        const totalUpdates = results.artists.updated + results.news.updated + results.filmography.synced;
        const totalErrors = results.artists.errors.length + results.news.errors.length +
                           results.filmography.errors.length + results.trending.errors.length;

        console.log(`[CRON] ✅ Job completed in ${(duration / 1000).toFixed(1)}s`);
        console.log(`[CRON] Updates: ${totalUpdates}, Errors: ${totalErrors}`);

        // 4. Enviar notificação Slack se configurado
        if (totalUpdates > 0 || totalErrors > 0) {
            try {
                const { getSlackService } = require('@/lib/services/slack-notification-service');
                const slackService = getSlackService();

                if (slackService.isEnabled()) {
                    await slackService.notifyCronJobComplete({
                        duration,
                        updates: totalUpdates,
                        errors: totalErrors,
                        details: results
                    });
                }
            } catch (error: any) {
                console.error(`[CRON] ⚠️  Slack notification failed: ${error.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            duration,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error('[CRON] ❌ Fatal error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            duration,
            timestamp: new Date().toISOString()
        }, { status: 500 });

    } finally {
        await prisma.$disconnect();
    }
}

// POST também suportado para compatibilidade
export async function POST(request: NextRequest) {
    return GET(request);
}
