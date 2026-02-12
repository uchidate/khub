import prisma from '../lib/prisma';
import { ImageSearchService } from '../lib/services/image-search-service';
const imageSearch = new ImageSearchService();

async function main() {
    console.log('🎬 Refreshing Production Posters using TMDB...');

    const productions = await prisma.production.findMany({
        select: { id: true, titlePt: true, titleKr: true, type: true, imageUrl: true }
    });

    console.log(`Found ${productions.length} productions in database.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const prod of productions) {
        console.log(`\n🔍 Processing: ${prod.titlePt} (${prod.titleKr || 'no Korean title'})...`);

        try {
            const imageResult = await imageSearch.findProductionImage(prod.titlePt, prod.titleKr, prod.type);

            if (imageResult && imageResult.url !== prod.imageUrl) {
                await prisma.production.update({
                    where: { id: prod.id },
                    data: { imageUrl: imageResult.url }
                });
                console.log(`✅ Updated poster for ${prod.titlePt}`);
                console.log(`   Source: ${imageResult.source} (${imageResult.attribution})`);
                console.log(`   URL: ${imageResult.url}`);
                updatedCount++;
            } else {
                console.log(`⏭️  No update needed (same URL or no result)`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to find poster for ${prod.titlePt}:`, error.message);
            failedCount++;
        }

        // Small delay to be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✨ Production Poster Refresh Complete!');
    console.log(`Updated: ${updatedCount}`);
    console.log(`Failed/Skipped: ${failedCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
