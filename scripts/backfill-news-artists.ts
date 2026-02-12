/**
 * Script de Backfill: Associar artistas a notícias existentes
 *
 * Uso:
 *   npx tsx scripts/backfill-news-artists.ts              # Todas as notícias
 *   npx tsx scripts/backfill-news-artists.ts --limit=50   # Limitar a 50
 *   npx tsx scripts/backfill-news-artists.ts --dry-run    # Simular sem salvar
 */

import prisma from '../lib/prisma';
import { NewsArtistExtractionService } from '../lib/services/news-artist-extraction-service';

async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;

    console.log('🚀 Backfill: Associando artistas a notícias existentes...');
    console.log(`   Dry run: ${isDryRun}`);
    console.log(`   Limit:   ${limit ?? 'unlimited'}`);
    console.log('');

    // Buscar notícias sem artistas associados
    const news = await prisma.news.findMany({
        where: {
            artists: { none: {} }
        },
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, contentMd: true },
    });

    console.log(`📊 Found ${news.length} news without artists\n`);

    if (news.length === 0) {
        console.log('✅ Nada para processar.');
        return;
    }

    const extractionService = new NewsArtistExtractionService(prisma);
    let processed = 0;
    let totalLinked = 0;
    let errors = 0;

    for (const item of news) {
        processed++;
        const preview = item.title.substring(0, 60);
        process.stdout.write(`[${processed}/${news.length}] ${preview}...\n`);

        try {
            const mentions = await extractionService.extractArtists(item.title, item.contentMd);
            console.log(`   Found ${mentions.length} artist(s)${mentions.length > 0 ? ': ' + mentions.map(m => m.name).join(', ') : ''}`);

            if (!isDryRun && mentions.length > 0) {
                for (const mention of mentions) {
                    await prisma.newsArtist.upsert({
                        where: {
                            newsId_artistId: {
                                newsId: item.id,
                                artistId: mention.artistId,
                            }
                        },
                        update: {},
                        create: {
                            newsId: item.id,
                            artistId: mention.artistId,
                        },
                    });
                }
                console.log(`   ✅ Saved ${mentions.length} relation(s)`);
            } else if (isDryRun && mentions.length > 0) {
                console.log(`   🔍 Would save ${mentions.length} relation(s) (dry run)`);
            }

            totalLinked += mentions.length;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`   ❌ Error: ${msg}`);
            errors++;
        }

        // Rate limiting leve para não sobrecarregar o banco
        if (processed % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log('\n=============================');
    console.log('✅ Backfill completo!');
    console.log(`   Processed:      ${processed}`);
    console.log(`   Artists linked: ${totalLinked}`);
    console.log(`   Errors:         ${errors}`);
    if (isDryRun) console.log('   (dry run — nada foi salvo)');
}

main()
    .catch(err => {
        console.error('Fatal:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
