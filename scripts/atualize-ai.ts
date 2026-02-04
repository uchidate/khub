import { PrismaClient } from '@prisma/client';
const { AIOrchestrator } = require('../lib/ai/orchestrator');
const { NewsGenerator } = require('../lib/ai/generators/news-generator');
const { ArtistGenerator } = require('../lib/ai/generators/artist-generator');
const { ProductionGenerator } = require('../lib/ai/generators/production-generator');
const { getSlackService } = require('../lib/services/slack-notification-service');
const { getFilmographySyncService } = require('../lib/services/filmography-sync-service');
const { TrendingService } = require('../lib/services/trending-service');

const prisma = new PrismaClient();
const slackService = getSlackService();

// Track saved content for Slack summary
const savedCounts = { artists: 0, news: 0, productions: 0 };

interface CliOptions {
    news?: number;
    artists?: number;
    productions?: number;
    provider?: 'gemini' | 'openai' | 'claude' | 'ollama';
    dryRun?: boolean;
    refreshFilmography?: boolean;
    updateTrending?: boolean;
}

function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        news: 0,
        artists: 3,
        productions: 2,
        dryRun: false,
        refreshFilmography: true, // Default to true
        updateTrending: true, // Default to true
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--news=')) {
            options.news = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--artists=')) {
            options.artists = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--productions=')) {
            options.productions = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--provider=')) {
            options.provider = arg.split('=')[1] as any;
        } else if (arg === '--dry-run') {
            options.dryRun = true;
        } else if (arg.startsWith('--refresh-filmography=')) {
            options.refreshFilmography = arg.split('=')[1] === 'true';
        } else if (arg.startsWith('--update-trending=')) {
            options.updateTrending = arg.split('=')[1] === 'true';
        }
    }

    return options;
}

function validateNews(news: any): news is { title: string; contentMd: string; sourceUrl: string; tags: string; publishedAt: Date } {
    if (!news.title || typeof news.title !== 'string' || news.title.trim().length === 0) return false;
    if (!news.contentMd || typeof news.contentMd !== 'string' || news.contentMd.trim().length < 20) return false;
    if (!news.sourceUrl || typeof news.sourceUrl !== 'string') return false;
    return true;
}

function validateArtist(artist: any): boolean {
    if (!artist.nameRomanized || typeof artist.nameRomanized !== 'string' || artist.nameRomanized.trim().length === 0) return false;
    return true;
}

function sanitizeArtist(artist: any): any {
    // birthDate pode vir como string inválida do AI — setar null se não parsear
    if (artist.birthDate instanceof Date && isNaN(artist.birthDate.getTime())) {
        artist.birthDate = null;
    }
    // roles pode vir como string separado por vírgula — converter para array
    if (artist.roles && typeof artist.roles === 'string') {
        artist.roles = artist.roles.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0);
    }
    return artist;
}

function validateAndNormalizeProduction(prod: any): any | null {
    if (!prod.titlePt || typeof prod.titlePt !== 'string' || prod.titlePt.trim().length === 0) return null;
    if (!prod.synopsis || typeof prod.synopsis !== 'string' || prod.synopsis.trim().length < 10) return null;
    // Normalizar type para lowercase (seed usa 'serie'/'filme', AI retorna 'SERIE'/'FILME')
    if (prod.type && typeof prod.type === 'string') {
        prod.type = prod.type.toLowerCase();
    }
    // Garantir year como number
    if (prod.year && typeof prod.year === 'string') {
        prod.year = parseInt(prod.year, 10);
    }
    // streamingPlatforms pode vir como string separado por vírgula — converter para array
    if (prod.streamingPlatforms && typeof prod.streamingPlatforms === 'string') {
        prod.streamingPlatforms = prod.streamingPlatforms.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    }
    return prod;
}

async function main() {
    console.log('🤖 HallyuHub AI Data Generator\n');
    console.log('='.repeat(60));

    const options = parseArgs();

    if (options.dryRun) {
        console.log('🔍 DRY RUN MODE - Data will not be saved to database\n');
    }

    // Inicializar orquestrador
    const orchestrator = new AIOrchestrator({
        geminiApiKey: process.env.GEMINI_API_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY,
        claudeApiKey: process.env.ANTHROPIC_API_KEY,
        ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
        maxRetries: 3,
    });

    console.log(`\n📊 Configuration:`);
    console.log(`   News to generate: ${options.news}`);
    console.log(`   Artists to generate: ${options.artists}`);
    console.log(`   Productions to generate: ${options.productions}`);
    console.log(`   Refresh filmography: ${options.refreshFilmography ? 'Yes' : 'No'}`);
    console.log(`   Update trending scores: ${options.updateTrending ? 'Yes' : 'No'}`);
    if (options.provider) {
        console.log(`   Preferred provider: ${options.provider}`);
    }
    console.log(`   Available providers: ${orchestrator.getAvailableProviders().join(', ')}`);
    console.log('='.repeat(60));

    const genOptions = options.provider ? { preferredProvider: options.provider } : undefined;

    // Gerar notícias
    if (options.news && options.news > 0) {
        console.log('\n\n📰 GENERATING NEWS\n');

        // Buscar notícias existentes para evitar duplicatas
        const existingNews = await prisma.news.findMany({ select: { title: true } });
        const excludeNews = existingNews.map(n => n.title);

        const newsGenerator = new NewsGenerator(orchestrator);
        const newsItems = await newsGenerator.generateMultipleNews(options.news, {
            ...genOptions,
            excludeList: excludeNews
        });

        if (!options.dryRun) {
            console.log('\n💾 Saving news to database...');
            for (const news of newsItems) {
                if (!validateNews(news)) {
                    console.warn(`   ⚠️  Skipped invalid news: "${news.title || '(sem título)'}"`);
                    continue;
                }
                try {
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
                    savedCounts.news++;
                    console.log(`   ✅ Saved: "${news.title}"`);
                } catch (error: any) {
                    console.error(`   ❌ Failed to save: ${error.message}`);
                }
            }
        }
    }

    // Gerar artistas
    if (options.artists && options.artists > 0) {
        console.log('\n\n🎤 GENERATING ARTISTS\n');

        // Buscar artistas existentes para evitar duplicatas
        const existingArtists = await prisma.artist.findMany({ select: { nameRomanized: true } });
        const excludeArtists = existingArtists.map(a => a.nameRomanized);

        const artistGenerator = new ArtistGenerator(orchestrator);
        const artists = await artistGenerator.generateMultipleArtists(options.artists, {
            ...genOptions,
            excludeList: excludeArtists
        });

        if (!options.dryRun) {
            console.log('\n💾 Saving artists to database...');
            for (let artist of artists) {
                if (!validateArtist(artist)) {
                    console.warn(`   ⚠️  Skipped invalid artist: "${artist.nameRomanized || '(sem nome)'}"`);
                    continue;
                }
                artist = sanitizeArtist(artist);
                try {
                    // Verificar/criar agência (opcional)
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
                                    socials: JSON.stringify({}),
                                },
                            });
                            console.log(`   🏢 Created agency: ${artist.agencyName}`);
                        }
                        agencyId = agency.id;
                    }

                    const savedArtist = await prisma.artist.upsert({
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
                    savedCounts.artists++;
                    console.log(`   ✅ Saved: ${artist.nameRomanized}`);

                    // Auto-fetch filmography for new artist (non-blocking)
                    if (process.env.FILMOGRAPHY_SYNC_ON_CREATE !== 'false') {
                        console.log(`   🎬 Fetching filmography...`);
                        const filmographyService = getFilmographySyncService();
                        filmographyService.syncSingleArtist(savedArtist.id, 'SMART_MERGE')
                            .then(result => {
                                if (result.success) {
                                    console.log(`   ✅ Filmography: ${result.addedCount} added, ${result.updatedCount} updated`);
                                } else {
                                    console.log(`   ⚠️ Filmography sync failed: ${result.errors.join(', ')}`);
                                }
                            })
                            .catch(err => {
                                console.error(`   ❌ Filmography sync error: ${err.message}`);
                            });
                    }
                } catch (error: any) {
                    console.error(`   ❌ Failed to save: ${error.message}`);
                }
            }
        }
    }

    // Gerar produções
    if (options.productions && options.productions > 0) {
        console.log('\n\n🎬 GENERATING PRODUCTIONS\n');

        // Buscar produções existentes para evitar duplicatas
        const existingProductions = await prisma.production.findMany({ select: { titlePt: true } });
        const excludeProductions = existingProductions.map(p => p.titlePt);

        const productionGenerator = new ProductionGenerator(orchestrator);
        const productions = await productionGenerator.generateMultipleProductions(options.productions, {
            ...genOptions,
            excludeList: excludeProductions
        });

        if (!options.dryRun) {
            console.log('\n💾 Saving productions to database...');
            for (let production of productions) {
                production = validateAndNormalizeProduction(production);
                if (!production) {
                    console.warn(`   ⚠️  Skipped invalid production`);
                    continue;
                }
                try {
                    await prisma.production.upsert({
                        where: { titlePt: production.titlePt },
                        update: {
                            titleKr: production.titleKr,
                            type: production.type,
                            year: production.year,
                            synopsis: production.synopsis,
                            streamingPlatforms: production.streamingPlatforms,
                        },
                        create: production,
                    });
                    savedCounts.productions++;
                    console.log(`   ✅ Saved: ${production.titlePt}`);
                } catch (error: any) {
                    console.error(`   ❌ Failed to save: ${error.message}`);
                }
            }
        }
    }

    // Periodic filmography refresh
    if (options.refreshFilmography && !options.dryRun) {
        console.log('\n\n🎬 REFRESHING FILMOGRAPHIES\n');
        console.log('='.repeat(60));

        const filmographyService = getFilmographySyncService();

        // Strategy: Update 10 artists per run
        // Priority: artists without filmography or outdated (>7 days)
        const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const artistsToUpdate = await prisma.artist.findMany({
            where: {
                OR: [
                    { tmdbLastSync: { lt: cutoffDate } },
                    { tmdbLastSync: null, tmdbSyncStatus: { not: 'NOT_FOUND' } },
                    { productions: { none: {} } }
                ]
            },
            take: 10,
            orderBy: [
                { tmdbLastSync: { sort: 'asc', nulls: 'first' } }
            ],
            select: { id: true, nameRomanized: true }
        });

        if (artistsToUpdate.length === 0) {
            console.log('✅ All filmographies are up to date!');
        } else {
            console.log(`Found ${artistsToUpdate.length} artists needing update:`);
            artistsToUpdate.forEach((a, i) => {
                console.log(`  ${i + 1}. ${a.nameRomanized}`);
            });

            console.log('\nSyncing filmographies (3 concurrent workers)...');

            const result = await filmographyService.syncMultipleArtists(
                artistsToUpdate.map(a => a.id),
                3, // concurrency
                'INCREMENTAL' // Only add new productions
            );

            console.log(`\n✅ Filmography refresh complete:`);
            console.log(`   Success: ${result.successCount}/${result.total}`);
            console.log(`   Failures: ${result.failureCount}`);
            console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);

            const totalAdded = result.results.reduce((sum, r) => sum + r.addedCount, 0);
            const totalUpdated = result.results.reduce((sum, r) => sum + r.updatedCount, 0);
            console.log(`   Productions added: ${totalAdded}`);
            console.log(`   Productions updated: ${totalUpdated}`);

            // Send Slack notification if significant updates
            if (slackService.isEnabled() && (totalAdded > 0 || totalUpdated > 0)) {
                await filmographyService.notifyBatchSyncComplete(result);
            }
        }
        console.log('='.repeat(60));
    }

    // Update trending scores
    if (options.updateTrending !== false && !options.dryRun) {
        console.log('\n\n📈 UPDATING TRENDING SCORES\n');
        console.log('='.repeat(60));

        const trendingService = TrendingService.getInstance();
        await trendingService.updateAllTrendingScores();

        console.log('='.repeat(60));
    }

    // Exibir estatísticas
    console.log('\n\n📊 STATISTICS\n');
    console.log('='.repeat(60));
    const stats = orchestrator.getStats();
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests}`);
    console.log(`Failed: ${stats.failedRequests}`);
    console.log(`Total cost: $${stats.totalCost.toFixed(6)}`);
    console.log('\nPer provider:');
    for (const [provider, providerStats] of Object.entries(stats.providerStats)) {
        const stats = providerStats as any;
        if (stats.requests > 0) {
            console.log(`  ${provider}:`);
            console.log(`    Requests: ${stats.requests}`);
            console.log(`    Failures: ${stats.failures}`);
            console.log(`    Tokens: ${stats.tokensUsed}`);
            console.log(`    Cost: $${stats.cost.toFixed(6)}`);
        }
    }
    console.log('='.repeat(60));

    // Send Slack summary notification
    if (!options.dryRun && slackService.isEnabled()) {
        const totalSaved = savedCounts.artists + savedCounts.news + savedCounts.productions;
        if (totalSaved > 0) {
            console.log('\n📤 Sending Slack notification...');
            await slackService.notifyContentBatchSummary({
                artists: savedCounts.artists,
                news: savedCounts.news,
                productions: savedCounts.productions,
                provider: orchestrator.getAvailableProviders()[0] || 'unknown',
            });
            console.log('   ✅ Slack notification sent');
        }
    }

    console.log('\n✨ Generation complete!\n');
}

main()
    .catch((e) => {
        console.error('\n❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
