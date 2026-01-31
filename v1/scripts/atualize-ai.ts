const { PrismaClient } = require('@prisma/client');
const { AIOrchestrator } = require('../lib/ai/orchestrator');
const { NewsGenerator } = require('../lib/ai/generators/news-generator');
const { ArtistGenerator } = require('../lib/ai/generators/artist-generator');
const { ProductionGenerator } = require('../lib/ai/generators/production-generator');

const prisma = new PrismaClient();

interface CliOptions {
    news?: number;
    artists?: number;
    productions?: number;
    provider?: 'gemini' | 'openai' | 'claude';
    dryRun?: boolean;
}

function parseArgs(): CliOptions {
    const args = process.argv.slice(2);
    const options: CliOptions = {
        news: 5,
        artists: 3,
        productions: 2,
        dryRun: false,
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
        }
    }

    return options;
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
        maxRetries: 3,
    });

    console.log(`\n📊 Configuration:`);
    console.log(`   News to generate: ${options.news}`);
    console.log(`   Artists to generate: ${options.artists}`);
    console.log(`   Productions to generate: ${options.productions}`);
    if (options.provider) {
        console.log(`   Preferred provider: ${options.provider}`);
    }
    console.log(`   Available providers: ${orchestrator.getAvailableProviders().join(', ')}`);
    console.log('='.repeat(60));

    const genOptions = options.provider ? { preferredProvider: options.provider } : undefined;

    // Gerar notícias
    if (options.news && options.news > 0) {
        console.log('\n\n📰 GENERATING NEWS\n');
        const newsGenerator = new NewsGenerator(orchestrator);
        const newsItems = await newsGenerator.generateMultipleNews(options.news, genOptions);

        if (!options.dryRun) {
            console.log('\n💾 Saving news to database...');
            for (const news of newsItems) {
                try {
                    await prisma.news.upsert({
                        where: { title: news.title },
                        update: {},
                        create: news,
                    });
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
        const artistGenerator = new ArtistGenerator(orchestrator);
        const artists = await artistGenerator.generateMultipleArtists(options.artists, genOptions);

        if (!options.dryRun) {
            console.log('\n💾 Saving artists to database...');
            for (const artist of artists) {
                try {
                    // Verificar/criar agência
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

                    await prisma.artist.upsert({
                        where: { nameRomanized: artist.nameRomanized },
                        update: {},
                        create: {
                            nameRomanized: artist.nameRomanized,
                            nameHangul: artist.nameHangul,
                            birthDate: artist.birthDate,
                            roles: artist.roles,
                            bio: artist.bio,
                            primaryImageUrl: artist.primaryImageUrl,
                            agencyId: agency.id,
                        },
                    });
                    console.log(`   ✅ Saved: ${artist.nameRomanized}`);
                } catch (error: any) {
                    console.error(`   ❌ Failed to save: ${error.message}`);
                }
            }
        }
    }

    // Gerar produções
    if (options.productions && options.productions > 0) {
        console.log('\n\n🎬 GENERATING PRODUCTIONS\n');
        const productionGenerator = new ProductionGenerator(orchestrator);
        const productions = await productionGenerator.generateMultipleProductions(options.productions, genOptions);

        if (!options.dryRun) {
            console.log('\n💾 Saving productions to database...');
            for (const production of productions) {
                try {
                    await prisma.production.upsert({
                        where: { titlePt: production.titlePt },
                        update: {},
                        create: production,
                    });
                    console.log(`   ✅ Saved: ${production.titlePt}`);
                } catch (error: any) {
                    console.error(`   ❌ Failed to save: ${error.message}`);
                }
            }
        }
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
        if (providerStats.requests > 0) {
            console.log(`  ${provider}:`);
            console.log(`    Requests: ${providerStats.requests}`);
            console.log(`    Failures: ${providerStats.failures}`);
            console.log(`    Tokens: ${providerStats.tokensUsed}`);
            console.log(`    Cost: $${providerStats.cost.toFixed(6)}`);
        }
    }
    console.log('='.repeat(60));

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
