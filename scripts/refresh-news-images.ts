import { PrismaClient } from '@prisma/client';
import { ImageSearchService } from '../lib/services/image-search-service';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging' }); // Default to staging for safety

const prisma = new PrismaClient();
const imageService = new ImageSearchService();

async function refreshNewsImages() {
    console.log('🚀 Starting News Image Refresh...');

    const newsItems = await prisma.news.findMany({
        where: {
            OR: [
                { imageUrl: null },
                { imageUrl: '' }
            ]
        }
    });

    console.log(`🔍 Found ${newsItems.length} news items without images.`);

    for (const item of newsItems) {
        console.log(`\nProcessing: "${item.title}"`);
        try {
            const imageResult = await imageService.findNewsImage(item.title);
            if (imageResult && imageResult.url) {
                await prisma.news.update({
                    where: { id: item.id },
                    data: { imageUrl: imageResult.url }
                });
                console.log(`✅ Updated with: ${imageResult.url}`);
            } else {
                console.log(`⚠️  No image found for this item.`);
            }
        } catch (error: any) {
            console.error(`❌ Error processing "${item.title}": ${error.message}`);
        }
    }

    console.log('\n✨ Finished News Image Refresh.');
}

refreshNewsImages()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
