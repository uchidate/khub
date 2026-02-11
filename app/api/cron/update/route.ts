import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const maxDuration = 300; // 5 minutos máximo para o cron

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
            productions: { updated: 0, errors: [] as string[] },
            filmography: { synced: 0, errors: [] as string[] },
            trending: { updated: 0, errors: [] as string[] },
        };

        // 2.1. Gerar novos artistas (quantidade reduzida para cron frequente)
        // NOVA ESTRATÉGIA: Dados 100% reais do TMDB
        try {
            console.log('[CRON] Discovering real artists from TMDB...');
            const { ArtistGeneratorV2 } = require('@/lib/ai/generators/artist-generator-v2');

            const artistGenerator = new ArtistGeneratorV2(prisma);
            const existingArtists = await prisma.artist.findMany({
                select: { nameRomanized: true }
            });
            const excludeArtists = existingArtists.map(a => a.nameRomanized);

            // Gerar 2 artistas reais do TMDB por execução (cron 15min = ~8 artistas/hora)
            const artists = await artistGenerator.generateMultipleArtists(2, {
                excludeList: excludeArtists
            });

            for (const artist of artists) {
                try {
                    // Validar dados básicos
                    if (!artist.nameRomanized || artist.nameRomanized.trim().length === 0) {
                        continue;
                    }

                    // Salvar artista real do TMDB
                    // Preferir tmdbId como chave (mais confiável que nome)
                    const artistUpsertKey = artist.tmdbId
                        ? { tmdbId: String(artist.tmdbId) }
                        : { nameRomanized: artist.nameRomanized };

                    await prisma.artist.upsert({
                        where: artistUpsertKey,
                        update: {
                            nameRomanized: artist.nameRomanized,
                            nameHangul: artist.nameHangul || null,
                            birthDate: artist.birthDate || null,
                            roles: artist.roles || [],
                            bio: artist.bio || null,
                            primaryImageUrl: artist.primaryImageUrl || null,
                            tmdbId: artist.tmdbId ? String(artist.tmdbId) : undefined,
                        },
                        create: {
                            nameRomanized: artist.nameRomanized,
                            nameHangul: artist.nameHangul || null,
                            birthDate: artist.birthDate || null,
                            roles: artist.roles || [],
                            bio: artist.bio || null,
                            primaryImageUrl: artist.primaryImageUrl || null,
                            tmdbId: artist.tmdbId ? String(artist.tmdbId) : undefined,
                        },
                    });

                    results.artists.updated++;
                    console.log(`[CRON] ✅ Saved real artist: ${artist.nameRomanized} (TMDB:${artist.tmdbId})`);
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
        // NOVA ESTRATÉGIA: Notícias 100% reais de RSS feeds (AllKpop, Soompi, Koreaboo)
        try {
            console.log('[CRON] Fetching real news from RSS feeds...');
            const { NewsGeneratorV2 } = require('@/lib/ai/generators/news-generator-v2');
            const { getNewsArtistExtractionService } = require('@/lib/services/news-artist-extraction-service');

            const newsGenerator = new NewsGeneratorV2();
            const extractionService = getNewsArtistExtractionService(prisma);
            const existingNews = await prisma.news.findMany({
                select: { sourceUrl: true }
            });
            const excludeNews = existingNews.map(n => n.sourceUrl);

            // Quantidade de notícias por ambiente
            // Staging: 2 notícias (testes rápidos)
            // Production: 5 notícias (cron 15min = ~20 notícias/hora)
            const isStaging = process.env.DEPLOY_ENV === 'staging';
            const newsCount = isStaging ? 2 : 5;

            console.log(`[CRON] Fetching ${newsCount} news items (env: ${process.env.DEPLOY_ENV || 'production'})`);

            const newsItems = await newsGenerator.generateMultipleNews(newsCount, {
                excludeList: excludeNews
            });

            for (const news of newsItems) {
                try {
                    // Validar
                    if (!news.title || !news.contentMd || news.contentMd.length < 20) {
                        continue;
                    }

                    const savedNews = await prisma.news.upsert({
                        where: { sourceUrl: news.sourceUrl },
                        update: {
                            title: news.title,
                            contentMd: news.contentMd,
                            imageUrl: news.imageUrl || null,
                            tags: news.tags || null,
                            publishedAt: news.publishedAt,
                        },
                        create: {
                            title: news.title,
                            sourceUrl: news.sourceUrl,
                            contentMd: news.contentMd,
                            imageUrl: news.imageUrl || null,
                            tags: news.tags || null,
                            publishedAt: news.publishedAt,
                        },
                    });

                    // Extrair artistas mencionados e criar relações (falha graciosamente)
                    let isNewNews = false;
                    try {
                        // Verificar se a notícia foi criada agora (diff < 10s)
                        const newsAge = Date.now() - new Date(savedNews.createdAt).getTime();
                        isNewNews = newsAge < 10000; // 10 segundos

                        const artistMentions = await extractionService.extractArtists(
                            news.title,
                            news.contentMd
                        );

                        for (const mention of artistMentions) {
                            await prisma.newsArtist.upsert({
                                where: {
                                    newsId_artistId: {
                                        newsId: savedNews.id,
                                        artistId: mention.artistId,
                                    }
                                },
                                update: {},
                                create: {
                                    newsId: savedNews.id,
                                    artistId: mention.artistId,
                                },
                            });
                        }

                        if (artistMentions.length > 0) {
                            console.log(`[CRON]    Artists linked: ${artistMentions.map((m: { name: string }) => m.name).join(', ')}`);
                        }

                        // Enviar notificações apenas se for notícia nova
                        if (isNewNews && artistMentions.length > 0) {
                            try {
                                const { getNewsNotificationService } = await import('@/lib/services/news-notification-service');
                                const notificationService = getNewsNotificationService();
                                await notificationService.notifyUsersAboutNews(savedNews.id);
                            } catch (notifError: any) {
                                console.warn(`[CRON] ⚠️  Notification failed (non-blocking): ${notifError.message}`);
                            }
                        }
                    } catch (extractError: any) {
                        console.warn(`[CRON] ⚠️  Artist extraction failed (non-blocking): ${extractError.message}`);
                    }

                    results.news.updated++;
                    console.log(`[CRON] ✅ Saved real news: ${news.title}`);
                } catch (error: any) {
                    console.error(`[CRON] ❌ Failed to save news: ${error.message}`);
                    results.news.errors.push(error.message);
                }
            }
        } catch (error: any) {
            console.error(`[CRON] ❌ News generation failed: ${error.message}`);
            results.news.errors.push(error.message);
        }

        // 2.3. Descobrir K-dramas e filmes coreanos do TMDB
        try {
            console.log('[CRON] Discovering Korean productions from TMDB...');
            const { getTMDBProductionDiscoveryService } = require('@/lib/services/tmdb-production-discovery-service');

            const productionDiscovery = getTMDBProductionDiscoveryService();

            // Get existing productions to avoid duplicates
            const existingProductions = await prisma.production.findMany({
                where: { tmdbId: { not: null } },
                select: { tmdbId: true }
            });
            const existingTmdbIds = new Set(existingProductions.map(p => p.tmdbId));

            // Discover 2 K-dramas and 1 movie per execution
            const [kdramas, movies] = await Promise.all([
                productionDiscovery.discoverKDramas(2),
                productionDiscovery.discoverKoreanMovies(1)
            ]);

            const allProductions = [...kdramas, ...movies];

            for (const production of allProductions) {
                try {
                    // Skip if already exists
                    if (existingTmdbIds.has(String(production.tmdbId))) {
                        continue;
                    }

                    // Create production
                    await prisma.production.create({
                        data: {
                            titlePt: production.titlePt,
                            titleKr: production.titleKr,
                            type: production.tmdbType === 'tv' ? 'K-Drama' : 'Filme',
                            year: production.releaseDate ? production.releaseDate.getFullYear() : null,
                            synopsis: production.synopsis,
                            imageUrl: production.imageUrl,
                            backdropUrl: production.backdropUrl,
                            galleryUrls: production.galleryUrls,
                            tmdbId: String(production.tmdbId),
                            tmdbType: production.tmdbType,
                            releaseDate: production.releaseDate,
                            runtime: production.runtime,
                            voteAverage: production.voteAverage,
                            trailerUrl: production.trailerUrl,
                            tags: production.tags,
                            streamingPlatforms: [], // Can be filled later
                            sourceUrls: [], // Can be filled later
                        }
                    });

                    results.productions.updated++;
                    console.log(`[CRON] ✅ Saved production: ${production.titlePt} (TMDB:${production.tmdbId})`);
                } catch (error: any) {
                    console.error(`[CRON] ❌ Failed to save production: ${error.message}`);
                    results.productions.errors.push(error.message);
                }
            }
        } catch (error: any) {
            console.error(`[CRON] ❌ Production discovery failed: ${error.message}`);
            results.productions.errors.push(error.message);
        }

        // 2.4. Atualizar filmografias (2-3 artistas por execução)
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

        // 2.5. Atualizar trending scores
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
        const totalUpdates = results.artists.updated + results.news.updated + results.productions.updated + results.filmography.synced;
        const totalErrors = results.artists.errors.length + results.news.errors.length +
                           results.productions.errors.length + results.filmography.errors.length + results.trending.errors.length;

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
