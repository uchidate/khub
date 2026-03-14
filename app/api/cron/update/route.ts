import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service';
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger';
import { getErrorMessage } from '@/lib/utils/error';
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter';
import { TrendingService } from '@/lib/services/trending-service';
import { syncStreamingShows } from '@/lib/services/streaming-show-service';
import { NewsGeneratorV2 } from '@/lib/ai/generators/news-generator-v2';
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service';
import { getTMDBProductionDiscoveryService } from '@/lib/services/tmdb-production-discovery-service';
import { getFilmographySyncService } from '@/lib/services/filmography-sync-service';
import { getProductionCastService } from '@/lib/services/production-cast-service';
import { getSocialLinksSyncService } from '@/lib/services/social-links-sync-service';
import { getTMDBDiscoveryService } from '@/lib/services/tmdb-discovery-service';
import { getOrchestrator } from '@/lib/ai/orchestrator-factory';
import { getSlackService } from '@/lib/services/slack-notification-service';
import { getNewsNotificationService } from '@/lib/services/news-notification-service';
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks';
import { cleanContentBySource } from '@/lib/utils/content-cleaner';
// import { getArtistTranslationService } from '@/lib/services/artist-translation-service'
// import { getProductionTranslationService } from '@/lib/services/production-translation-service'

const log = createLogger('CRON');

export const maxDuration = 300; // 5 minutos máximo para o cron

/**
 * Cron job endpoint para atualização automática de conteúdo
 *
 * Este endpoint deve ser chamado periodicamente (ex: a cada 15 minutos) por:
 * - Vercel Cron (configurado em vercel.json)
 * - GitHub Actions (workflow schedule)
 * - Serviço externo de cron (cron-job.org, etc.)
 *
 * Segurança: Requer token de autenticação via header ou query param
 *
 * Resposta: 202 Accepted imediatamente. O processamento continua em background
 * (Ollama no CPU leva 2-5min por execução, ultrapassando o timeout do nginx de 60s)
 */
export async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.CRON);
    if (limited) return limited;

    log.info('Starting scheduled update job...');

    try {
        // 1. Verificar autenticação
        const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
                         request.nextUrl.searchParams.get('token');
        const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET;

        if (!expectedToken) {
            log.error('CRON_SECRET not configured');
            return NextResponse.json({
                success: false,
                error: 'Cron secret not configured'
            }, { status: 500 });
        }

        // Timing-safe comparison to prevent timing attacks
        const tokenValid = authToken !== null
            && authToken.length === expectedToken.length
            && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken));

        if (!tokenValid) {
            log.warn('Unauthorized access attempt');
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 });
        }

        // 1.5. Lock de execução — evita encavalar (duas execuções simultâneas)
        const lockId = await acquireCronLock('cron-update');
        if (!lockId) {
            return NextResponse.json({
                success: false,
                skipped: true,
                reason: 'already_running',
                message: 'Cron já está em execução. Esta chamada foi ignorada para evitar sobreposição.'
            }, { status: 409 });
        }

        // 2. Disparar processamento em background (fire-and-forget)
        // O Node.js standalone mantém o processo vivo, então a Promise executa até o fim
        runCronProcessing(lockId).catch(onCronError(log, 'cron-update', 'Unhandled error in background processing'));

        // 3. Retornar 202 imediatamente (antes do timeout do nginx de 60s)
        return NextResponse.json({
            success: true,
            status: 'accepted',
            message: 'Cron job started in background',
            requestId: lockId,
            timestamp: new Date().toISOString()
        }, { status: 202 });

    } catch (error: unknown) {
        log.error('Fatal error during cron setup', { error: getErrorMessage(error) });
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

/**
 * Processamento assíncrono em background.
 * Executa todas as atualizações (TMDB, RSS, Ollama, etc.) sem bloquear a resposta HTTP.
 */
/** Timer utilitário para medir duração de fases */
function makeTimer() {
    const t = Date.now();
    return () => Date.now() - t;
}

async function runCronProcessing(lockId: string) {
    const startTime = Date.now();
    log.info('Background processing started', { requestId: lockId });

    // Métricas de performance por fase (ms)
    const perf: Record<string, number> = {};

    try {
        const results = {
            artists: { updated: 0, errors: [] as string[] },
            news: { updated: 0, errors: [] as string[] },
            productions: { updated: 0, errors: [] as string[] },
            filmography: { synced: 0, errors: [] as string[] },
            trending: { updated: 0, errors: [] as string[] },
        };

        // ================================================================
        // FASE 1: Etapas independentes em paralelo (artists, news, productions)
        // ================================================================
        const fase1Timer = makeTimer();
        const [artistsResult, newsResult, productionsResult, streamingShowsResult] = await Promise.allSettled([
            // 2.1. Geração automática de artistas desativada — artistas são adicionados manualmente
            Promise.resolve(),

            // 2.2. Gerar notícias (RSS feeds)
            (async () => {
                const t = makeTimer();
                log.info('Fetching real news from RSS feeds...');
                const newsGenerator = new NewsGeneratorV2();
                const extractionService = getNewsArtistExtractionService(prisma);
                // Limitar a 90 dias: RSS feeds nunca têm artigos mais antigos que isso,
                // e carregar TODOS os sourceUrls cresce indefinidamente com o banco
                const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                const existingNews = await prisma.news.findMany({
                    select: { sourceUrl: true },
                    where: { createdAt: { gte: since90d } },
                });
                const excludeNews = existingNews.map((n: { sourceUrl: string }) => n.sourceUrl);

                // Processar todos os itens novos de todos os feeds (máx ~75: 5 feeds × 15 itens)
                // Sem limite global para garantir que fontes menos frequentes (Dramabeans, Asian Junkie)
                // não sejam suprimidas por fontes mais ativas (Soompi, Koreaboo)
                const newsCount = 200;

                log.info(`Fetching all new news items from all feeds`, { env: process.env.DEPLOY_ENV || 'production' });

                const newsItems = await newsGenerator.generateMultipleNews(newsCount, {
                    excludeList: excludeNews
                });

                for (const news of newsItems) {
                    if (!news.title || !news.sourceUrl) {
                        continue;
                    }

                    const savedNews = await prisma.news.upsert({
                        where: { sourceUrl: news.sourceUrl },
                        // Ao atualizar: NÃO sobrescreve title/contentMd/translationStatus
                        // (tags podem já estar enriquecidas pelo NewsTaggingService)
                        update: {
                            imageUrl: news.imageUrl || null,
                            tags: news.tags && news.tags.length > 0 ? news.tags : undefined,
                            publishedAt: news.publishedAt,
                        },
                        create: {
                            title: news.title,
                            contentMd: news.originalContent || news.contentMd,
                            sourceUrl: news.sourceUrl,
                            originalTitle: news.originalTitle,
                            originalContent: news.originalContent,
                            imageUrl: news.imageUrl || null,
                            tags: news.tags || [],
                            publishedAt: news.publishedAt,
                            source: news.source || null,
                            translationStatus: 'pending',
                            status: 'draft',
                            blocks: markdownToBlocks(cleanContentBySource(news.originalContent || news.contentMd || '', news.source ?? undefined)) as object[],
                        },
                    });

                    // Extrair artistas mencionados e criar relações (falha graciosamente)
                    let isNewNews = false;
                    try {
                        const newsAge = Date.now() - new Date(savedNews.createdAt).getTime();
                        isNewNews = newsAge < 10000;

                        // Usar conteúdo original para extração (mais fiel aos nomes reais)
                        const extractionContent = news.originalContent || news.contentMd;
                        const artistMentions = await extractionService.extractArtists(
                            news.title,
                            extractionContent
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
                            log.debug(`Artists linked: ${artistMentions.map((m: { name: string }) => m.name).join(', ')}`);
                        }

                        if (isNewNews && artistMentions.length > 0) {
                            try {
                                const notificationService = getNewsNotificationService();
                                await notificationService.notifyUsersAboutNews(savedNews.id);
                                void notificationService.notifyInAppForNews(savedNews.id).catch(
                                    (e: Error) => log.warn(`IN_APP notification failed (non-blocking): ${e.message}`)
                                );
                            } catch (notifError: any) {
                                log.warn(`Notification failed (non-blocking): ${notifError.message}`);
                            }
                        }
                    } catch (extractError: any) {
                        log.warn(`Artist extraction failed (non-blocking): ${extractError.message}`);
                    }

                    results.news.updated++;
                    log.info(`Saved real news: ${news.title}`);
                }
                perf.news_ms = t();
            })(),

            // 2.2b. Sincronizar catálogo de shows nos streamings (StreamingShow)
            (async () => {
                const t = makeTimer();
                log.info('Syncing streaming show catalog...');
                try {
                    const results = await syncStreamingShows();
                    const total = results.reduce((s, r) => s + r.upserted, 0);
                    log.info(`Streaming shows synced: ${total} shows across ${results.length} sources`);
                } catch (err) {
                    log.error('Streaming show sync failed (non-blocking)', { error: getErrorMessage(err) });
                }
                perf.streaming_shows_ms = t();
            })(),

            // 2.3. Descobrir K-dramas e filmes coreanos do TMDB
            (async () => {
                const t = makeTimer();
                log.info('Discovering Korean productions from TMDB...');
                const productionDiscovery = getTMDBProductionDiscoveryService();

                const existingProductions = await prisma.production.findMany({
                    where: { tmdbId: { not: null } },
                    select: { tmdbId: true }
                });
                const existingTmdbIds = new Set(existingProductions.map((p: { tmdbId: string | null }) => p.tmdbId));

                const [kdramas, movies] = await Promise.all([
                    productionDiscovery.discoverKDramas(2),
                    productionDiscovery.discoverKoreanMovies(1)
                ]);

                const allProductions = [...kdramas, ...movies];

                for (const production of allProductions) {
                    if (existingTmdbIds.has(String(production.tmdbId))) {
                        continue;
                    }

                    await prisma.production.create({
                        data: {
                            titlePt: production.titlePt,
                            titleKr: production.titleKr,
                            type: production.tmdbType === 'tv' ? 'K-Drama' : 'Filme',
                            year: production.releaseDate ? production.releaseDate.getFullYear() : null,
                            synopsis: production.synopsis,
                            tagline: production.tagline ?? null,
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
                            ageRating: production.ageRating ?? null,
                            streamingPlatforms: [],
                            sourceUrls: [],
                        }
                    });

                    results.productions.updated++;
                    log.info(`Saved production: ${production.titlePt}`, { tmdbId: production.tmdbId });
                }
                perf.productions_ms = t();
            })(),
        ]);
        perf.fase1_parallel_ms = fase1Timer();

        // Log resultados da fase paralela
        if (artistsResult.status === 'rejected') {
            log.error(`Artist generation failed: ${artistsResult.reason?.message || artistsResult.reason}`);
            results.artists.errors.push(artistsResult.reason?.message || 'Unknown error');
        }
        if (newsResult.status === 'rejected') {
            log.error(`News generation failed: ${newsResult.reason?.message || newsResult.reason}`);
            results.news.errors.push(newsResult.reason?.message || 'Unknown error');
        }
        if (productionsResult.status === 'rejected') {
            log.error(`Production discovery failed: ${productionsResult.reason?.message || productionsResult.reason}`);
            results.productions.errors.push(productionsResult.reason?.message || 'Unknown error');
        }
        if (streamingShowsResult.status === 'rejected') {
            log.error(`Streaming show sync failed: ${streamingShowsResult.reason?.message || streamingShowsResult.reason}`);
        }

        // ================================================================
        // FASE 2: Etapas dependentes (sequencial)
        // ================================================================

        // 2.4. Atualizar filmografias (2-3 artistas por execução)
        const filmographyTimer = makeTimer();
        try {
            log.info('Syncing filmographies...');
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
                log.info(`Synced ${result.successCount} filmographies`);
            }
        } catch (error: unknown) {
            log.error('Filmography sync failed', { error: getErrorMessage(error) });
            results.filmography.errors.push(getErrorMessage(error));
        }
        perf.filmography_ms = filmographyTimer();

        // 2.4b. Sincronizar elenco de produções (2 produções por hora)
        // Direção: Produção → busca top 5 atores no TMDB → salva como Artist + ArtistProduction
        const castTimer = makeTimer();
        try {
            log.info('Syncing production cast...');
            const castService = getProductionCastService();
            const castResult = await castService.syncPendingProductionCasts(2);
            log.info(`Cast sync: ${castResult.processed} productions, ${castResult.totalSynced} actors synced`);
        } catch (error: unknown) {
            log.error('Production cast sync failed', { error: getErrorMessage(error) });
        }
        perf.cast_ms = castTimer();

        // 2.4c. Sincronizar redes sociais de artistas (3 artistas por hora)
        // Busca TMDB /person/{tmdbId}/external_ids → instagram, twitter, facebook, youtube, tiktok
        const socialLinksTimer = makeTimer();
        try {
            log.info('Syncing artist social links...');
            const socialLinksService = getSocialLinksSyncService();
            const socialResult = await socialLinksService.syncPendingArtistSocialLinks(3);
            log.info(`Social links sync: ${socialResult.processed} artists, ${socialResult.withLinks} with links`);
        } catch (error: unknown) {
            log.error('Social links sync failed', { error: getErrorMessage(error) });
        }
        perf.social_links_ms = socialLinksTimer();

        // 2.5. Normalizar conteúdo existente fora do padrão (1-2 itens por execução)
        // Prioridade: fotos faltantes (rápido, TMDB) > conteúdo em inglês (lento, Ollama)
        const enrichTimer = makeTimer();
        try {
            log.info('Checking for out-of-standard content...');

            // Heurística simples para detectar conteúdo em inglês:
            // Texto PT-BR tem ~10-20% de chars acentuados por palavra.
            // Se menos de 3%, provavelmente está em inglês.
            const isLikelyEnglish = (text: string): boolean => {
                if (!text || text.length < 30) return false;
                const accented = (text.match(/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g) || []).length;
                const words = text.trim().split(/\s+/).length;
                return words > 8 && accented / words < 0.03;
            };

            let normalizedCount = 0;

            // Prioridade 1: Artistas sem foto mas com tmdbId (rápido — apenas TMDB, sem AI)
            const artistWithoutPhoto = await prisma.artist.findFirst({
                where: {
                    tmdbId: { not: null },
                    OR: [{ primaryImageUrl: null }, { primaryImageUrl: '' }]
                },
                orderBy: { createdAt: 'asc' }
            });

            if (artistWithoutPhoto?.tmdbId) {
                const tmdbService = getTMDBDiscoveryService();
                const photo = await tmdbService.fetchPersonPhoto(Number(artistWithoutPhoto.tmdbId));
                if (photo) {
                    await prisma.artist.update({
                        where: { id: artistWithoutPhoto.id },
                        data: { primaryImageUrl: photo }
                    });
                    normalizedCount++;
                    log.info(`Fixed missing photo: ${artistWithoutPhoto.nameRomanized}`);
                }
            }

            // Prioridade 2: Produções sem foto mas com tmdbId (rápido — apenas TMDB, sem AI)
            if (normalizedCount < 2) {
                const productionWithoutPhoto = await prisma.production.findFirst({
                    where: {
                        tmdbId: { not: null },
                        tmdbType: { not: null },
                        OR: [{ imageUrl: null }, { imageUrl: '' }]
                    },
                    orderBy: { createdAt: 'asc' }
                });

                if (productionWithoutPhoto?.tmdbId && productionWithoutPhoto?.tmdbType) {
                    const tmdbService = getTMDBProductionDiscoveryService();
                    const images = await tmdbService.fetchProductionImages(
                        Number(productionWithoutPhoto.tmdbId),
                        productionWithoutPhoto.tmdbType as 'movie' | 'tv'
                    );
                    if (images.imageUrl || images.backdropUrl) {
                        await prisma.production.update({
                            where: { id: productionWithoutPhoto.id },
                            data: {
                                imageUrl: images.imageUrl || undefined,
                                backdropUrl: images.backdropUrl || undefined,
                            }
                        });
                        normalizedCount++;
                        log.info(`Fixed missing image: ${productionWithoutPhoto.titlePt}`);
                    }
                }
            }

            // Prioridade 3 e 4: Tradução de bios e sinopses
            // ⚠️ Desativado no cron — tradução consome tokens e deve ser acionada
            // manualmente pelo admin em /admin/translations.
            // Os serviços ArtistTranslationService e ProductionTranslationService
            // estão disponíveis via POST /api/admin/translations/run.
            //
            // Para reativar, descomente o bloco abaixo:
            //
            // if (normalizedCount < 2) {
            //     const artistService = getArtistTranslationService(prisma)
            //     const artistResult = await artistService.translatePendingArtists(1)
            //     if (artistResult.translated > 0 || artistResult.skipped > 0) {
            //         normalizedCount++
            //         log.info(`Translated artist bio (translated: ${artistResult.translated}, skipped: ${artistResult.skipped})`)
            //     }
            // }
            //
            // if (normalizedCount < 2) {
            //     const productionService = getProductionTranslationService(prisma)
            //     const prodResult = await productionService.translatePendingProductions(1)
            //     if (prodResult.translated > 0 || prodResult.skipped > 0) {
            //         normalizedCount++
            //         log.info(`Translated production synopsis (translated: ${prodResult.translated}, skipped: ${prodResult.skipped})`)
            //     }
            // }

            // Prioridade 5: Notícias antigas sem markdown ou em inglês → reformatar e traduzir
            if (normalizedCount < 2) {
                // Detectar notícias sem formatação markdown (sem **, ##, -, >)
                const hasMarkdownFormatting = (text: string): boolean => {
                    if (!text) return false;
                    return /(\*\*|##|^- |^> )/m.test(text);
                };

                const oldNewsWithoutMarkdown = await prisma.news.findFirst({
                    orderBy: { updatedAt: 'asc' }
                });

                // Verificar se precisa de normalização (em inglês OU sem markdown)
                if (oldNewsWithoutMarkdown?.contentMd &&
                    (isLikelyEnglish(oldNewsWithoutMarkdown.contentMd) ||
                     !hasMarkdownFormatting(oldNewsWithoutMarkdown.contentMd))) {

                    const orchestrator = getOrchestrator();

                    const prompt = `Reformate e traduza a seguinte notícia sobre K-pop/K-drama para português brasileiro:

Título: ${oldNewsWithoutMarkdown.title}

Conteúdo:
${oldNewsWithoutMarkdown.contentMd}

Requisitos:
- Tradução natural e fluente em português brasileiro (se em inglês)
- Manter nomes próprios (artistas, grupos, programas) no original
- Formato markdown com parágrafos bem estruturados
- Use **negrito** para destaques importantes (nomes, títulos, datas)
- 3-5 parágrafos informativos
- Tom jornalístico mas acessível
- Se conteúdo muito curto, expanda com contexto relevante`;

                    const result: any = await orchestrator.generateStructured(
                        prompt,
                        '{ "content": "string (notícia em português com markdown)" }',
                        { maxTokens: 500 }
                    );

                    if (result?.content && result.content.length > 50) {
                        // Extrair tags se não existirem
                        let tags = oldNewsWithoutMarkdown.tags || [];
                        if (tags.length === 0) {
                            const tagResult: any = await orchestrator.generateStructured(
                                `Extraia 3-5 tags relevantes desta notícia:\n\nTítulo: ${oldNewsWithoutMarkdown.title}\n\nConteúdo: ${result.content}\n\nRetorne tags como array de strings.`,
                                '{ "tags": ["string"] }',
                                { maxTokens: 100 }
                            );
                            tags = tagResult?.tags || [];
                        }

                        await prisma.news.update({
                            where: { id: oldNewsWithoutMarkdown.id },
                            data: {
                                contentMd: result.content,
                                tags: tags.length > 0 ? tags : undefined,
                            }
                        });
                        normalizedCount++;
                        log.info(`Fixed old news: ${oldNewsWithoutMarkdown.title}`);
                    }
                }
            }

            if (normalizedCount > 0) {
                log.info(`Normalized ${normalizedCount} out-of-standard items`);
            } else {
                log.debug('No out-of-standard content found');
            }
        } catch (error: unknown) {
            log.warn('Normalization failed (non-blocking)', { error: getErrorMessage(error) });
        }
        perf.enrich_ms = enrichTimer();

        // 2.6. Atualizar trending scores
        const trendingTimer = makeTimer();
        try {
            log.info('Updating trending scores...');
            const trendingService = TrendingService.getInstance();

            await trendingService.updateAllTrendingScores();
            results.trending.updated = 1; // Flag de sucesso
            log.info('Trending scores updated');
        } catch (error: unknown) {
            log.error('Trending update failed', { error: getErrorMessage(error) });
            results.trending.errors.push(getErrorMessage(error));
        }
        perf.trending_ms = trendingTimer();

        // 3. Calcular métricas
        const duration = Date.now() - startTime;
        const totalUpdates = results.artists.updated + results.news.updated + results.productions.updated + results.filmography.synced;
        const totalErrors = results.artists.errors.length + results.news.errors.length +
                           results.productions.errors.length + results.filmography.errors.length + results.trending.errors.length;

        // Log de performance por fase (para identificar gargalos)
        log.info('Performance breakdown', {
            total_s: Math.round(duration / 1000),
            fase1_parallel_s: Math.round((perf.fase1_parallel_ms ?? 0) / 1000),
            artists_s: Math.round((perf.artists_ms ?? 0) / 1000),
            news_s: Math.round((perf.news_ms ?? 0) / 1000),
            productions_s: Math.round((perf.productions_ms ?? 0) / 1000),
            filmography_s: Math.round((perf.filmography_ms ?? 0) / 1000),
            cast_s: Math.round((perf.cast_ms ?? 0) / 1000),
            social_links_s: Math.round((perf.social_links_ms ?? 0) / 1000),
            enrich_ollama_s: Math.round((perf.enrich_ms ?? 0) / 1000),
            trending_s: Math.round((perf.trending_ms ?? 0) / 1000),
        });

        log.info(`Job completed`, { duration: Math.round(duration / 1000), totalUpdates, totalErrors });

        // 4. Enviar notificação Slack apenas em caso de erros
        if (totalErrors > 0) {
            try {
                const slackService = getSlackService();

                if (slackService.isEnabled()) {
                    await slackService.notifyCronJobComplete({
                        duration,
                        updates: totalUpdates,
                        errors: totalErrors,
                        details: results
                    });
                }
            } catch (error: unknown) {
                log.warn('Slack notification failed', { error: getErrorMessage(error) });
            }
        }

    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        log.error('Fatal error in background processing', { error: getErrorMessage(error), duration: Math.round(duration / 1000) });
    } finally {
        await releaseCronLock('cron-update', lockId);
    }
}

// POST também suportado para compatibilidade
export async function POST(request: NextRequest) {
    return GET(request);
}
