import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service';
import { createLogger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/utils/error';
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter';
import { TrendingService } from '@/lib/services/trending-service';

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
        const lockId = await acquireCronLock();
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
        runCronProcessing(lockId).catch(err => {
            log.error('Unhandled error in background processing', { error: getErrorMessage(err) });
        });

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
        const [artistsResult, newsResult, productionsResult] = await Promise.allSettled([
            // 2.1. Gerar novos artistas (TMDB)
            (async () => {
                const t = makeTimer();
                log.info('Discovering real artists from TMDB...');
                const { ArtistGeneratorV2 } = require('@/lib/ai/generators/artist-generator-v2');

                const artistGenerator = new ArtistGeneratorV2(prisma);
                const existingArtists = await prisma.artist.findMany({
                    select: { nameRomanized: true }
                });
                const excludeArtists = existingArtists.map((a: { nameRomanized: string }) => a.nameRomanized);

                const artists = await artistGenerator.generateMultipleArtists(5, {
                    excludeList: excludeArtists
                });

                for (const artist of artists) {
                    if (!artist.nameRomanized || artist.nameRomanized.trim().length === 0) {
                        continue;
                    }

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
                    log.info(`Saved real artist: ${artist.nameRomanized}`, { tmdbId: artist.tmdbId });
                }
                perf.artists_ms = t();
            })(),

            // 2.2. Gerar notícias (RSS feeds)
            (async () => {
                const t = makeTimer();
                log.info('Fetching real news from RSS feeds...');
                const { NewsGeneratorV2 } = require('@/lib/ai/generators/news-generator-v2');
                const { getNewsArtistExtractionService } = require('@/lib/services/news-artist-extraction-service');

                const newsGenerator = new NewsGeneratorV2();
                const extractionService = getNewsArtistExtractionService(prisma);
                const existingNews = await prisma.news.findMany({
                    select: { sourceUrl: true }
                });
                const excludeNews = existingNews.map((n: { sourceUrl: string }) => n.sourceUrl);

                const isStaging = process.env.DEPLOY_ENV === 'staging';
                const newsCount = isStaging ? 1 : 2;

                log.info(`Fetching ${newsCount} news items`, { env: process.env.DEPLOY_ENV || 'production' });

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
                        // (a notícia pode já estar traduzida pelo NewsTranslationService)
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
                            translationStatus: 'pending',
                        },
                    });

                    // Extrair artistas mencionados e criar relações (falha graciosamente)
                    let isNewNews = false;
                    try {
                        const newsAge = Date.now() - new Date(savedNews.createdAt).getTime();
                        isNewNews = newsAge < 10000;

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
                            log.debug(`Artists linked: ${artistMentions.map((m: { name: string }) => m.name).join(', ')}`);
                        }

                        if (isNewNews && artistMentions.length > 0) {
                            try {
                                const { getNewsNotificationService } = await import('@/lib/services/news-notification-service');
                                const notificationService = getNewsNotificationService();
                                await notificationService.notifyUsersAboutNews(savedNews.id);
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

            // 2.3. Descobrir K-dramas e filmes coreanos do TMDB
            (async () => {
                const t = makeTimer();
                log.info('Discovering Korean productions from TMDB...');
                const { getTMDBProductionDiscoveryService } = require('@/lib/services/tmdb-production-discovery-service');

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

        // ================================================================
        // FASE 2: Etapas dependentes (sequencial)
        // ================================================================

        // 2.4. Atualizar filmografias (2-3 artistas por execução)
        const filmographyTimer = makeTimer();
        try {
            log.info('Syncing filmographies...');
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
                log.info(`Synced ${result.successCount} filmographies`);
            }
        } catch (error: unknown) {
            log.error('Filmography sync failed', { error: getErrorMessage(error) });
            results.filmography.errors.push(getErrorMessage(error));
        }
        perf.filmography_ms = filmographyTimer();

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
                const { getTMDBDiscoveryService } = require('@/lib/services/tmdb-discovery-service');
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
                    const { getTMDBProductionDiscoveryService } = require('@/lib/services/tmdb-production-discovery-service');
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

            // Prioridade 3: Artistas com bio em inglês → traduzir para PT-BR (usa Ollama)
            if (normalizedCount < 2) {
                const artistWithEnglishBio = await prisma.artist.findFirst({
                    where: { bio: { not: null } },
                    orderBy: { updatedAt: 'asc' }
                });

                if (artistWithEnglishBio?.bio && isLikelyEnglish(artistWithEnglishBio.bio)) {
                    const { getOrchestrator: getOrc } = require('@/lib/ai/orchestrator-factory');
                    const orchestrator = getOrc();
                    const result: any = await orchestrator.generateStructured(
                        `Traduza a seguinte biografia para português brasileiro de forma natural e profissional. Mantenha 2-3 frases, tom acessível:\n\n${artistWithEnglishBio.bio}`,
                        '{ "bio": "string (biografia em português brasileiro)" }',
                        { preferredProvider: 'ollama', maxTokens: 200 }
                    );
                    if (result?.bio && result.bio.length > 20 && !isLikelyEnglish(result.bio)) {
                        await prisma.artist.update({
                            where: { id: artistWithEnglishBio.id },
                            data: { bio: result.bio }
                        });
                        normalizedCount++;
                        log.info(`Fixed English bio: ${artistWithEnglishBio.nameRomanized}`);
                    }
                }
            }

            // Prioridade 4: Produções com synopsis em inglês → traduzir para PT-BR
            if (normalizedCount < 2) {
                const productionWithEnglishSynopsis = await prisma.production.findFirst({
                    where: { synopsis: { not: null } },
                    orderBy: { updatedAt: 'asc' }
                });

                if (productionWithEnglishSynopsis?.synopsis && isLikelyEnglish(productionWithEnglishSynopsis.synopsis)) {
                    const { getOrchestrator: getOrc2 } = require('@/lib/ai/orchestrator-factory');
                    const orchestrator = getOrc2();
                    const result: any = await orchestrator.generateStructured(
                        `Traduza a seguinte sinopse para português brasileiro de forma natural. Mantenha 2-3 frases, sem spoilers:\n\n${productionWithEnglishSynopsis.synopsis}`,
                        '{ "synopsis": "string (sinopse em português brasileiro)" }',
                        { preferredProvider: 'ollama', maxTokens: 200 }
                    );
                    if (result?.synopsis && result.synopsis.length > 20 && !isLikelyEnglish(result.synopsis)) {
                        await prisma.production.update({
                            where: { id: productionWithEnglishSynopsis.id },
                            data: { synopsis: result.synopsis }
                        });
                        normalizedCount++;
                        log.info(`Fixed English synopsis: ${productionWithEnglishSynopsis.titlePt}`);
                    }
                }
            }

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

                    const { getOrchestrator: getOrc3 } = require('@/lib/ai/orchestrator-factory');
                    const orchestrator = getOrc3();

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
                        { preferredProvider: 'ollama', maxTokens: 500 }
                    );

                    if (result?.content && result.content.length > 50) {
                        // Extrair tags se não existirem
                        let tags = oldNewsWithoutMarkdown.tags || [];
                        if (tags.length === 0) {
                            const tagResult: any = await orchestrator.generateStructured(
                                `Extraia 3-5 tags relevantes desta notícia:\n\nTítulo: ${oldNewsWithoutMarkdown.title}\n\nConteúdo: ${result.content}\n\nRetorne tags como array de strings.`,
                                '{ "tags": ["string"] }',
                                { preferredProvider: 'ollama', maxTokens: 100 }
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
            enrich_ollama_s: Math.round((perf.enrich_ms ?? 0) / 1000),
            trending_s: Math.round((perf.trending_ms ?? 0) / 1000),
        });

        log.info(`Job completed`, { duration: Math.round(duration / 1000), totalUpdates, totalErrors });

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
            } catch (error: unknown) {
                log.warn('Slack notification failed', { error: getErrorMessage(error) });
            }
        }

    } catch (error: unknown) {
        const duration = Date.now() - startTime;
        log.error('Fatal error in background processing', { error: getErrorMessage(error), duration: Math.round(duration / 1000) });
    } finally {
        await releaseCronLock(lockId);
    }
}

// POST também suportado para compatibilidade
export async function POST(request: NextRequest) {
    return GET(request);
}
