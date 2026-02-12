import prisma from '../lib/prisma';
import { ImageSearchService } from '../lib/services/image-search-service';
const imageSearch = new ImageSearchService();

async function main() {
    console.log('🖼️  Refreshing Artist Images using Unsplash/Wikipedia...');

    // Fetch all artists with aliases
    const artists = await prisma.artist.findMany({
        select: { id: true, nameRomanized: true, nameHangul: true, stageNames: true, primaryImageUrl: true }
    });

    console.log(`Found ${artists.length} artists in database.`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const artist of artists) {
        const aliases = [];
        if (artist.nameHangul) aliases.push(artist.nameHangul);
        if (artist.stageNames) aliases.push(...artist.stageNames.split(',').map(s => s.trim()));

        console.log(`\n🔍 Processing: ${artist.nameRomanized} (Aliases: ${aliases.join(', ')})...`);

        try {
            const imageResult = await imageSearch.findArtistImage(artist.nameRomanized, aliases);

            if (imageResult && imageResult.url !== artist.primaryImageUrl) {
                await prisma.artist.update({
                    where: { id: artist.id },
                    data: { primaryImageUrl: imageResult.url }
                });
                console.log(`✅ Updated image for ${artist.nameRomanized}`);
                console.log(`   Source: ${imageResult.source} (${imageResult.attribution})`);
                console.log(`   URL: ${imageResult.url}`);
                updatedCount++;
            } else {
                console.log(`⏭️  No update needed (same URL or no result)`);
            }
        } catch (error: any) {
            console.error(`❌ Failed to find image for ${artist.nameRomanized}:`, error.message);
            failedCount++;
        }

        // Small delay to be nice to APIs
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✨ Image Refresh Complete!');
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
