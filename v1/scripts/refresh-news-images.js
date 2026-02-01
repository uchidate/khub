const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findNewsImage(title) {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
    console.log(`🔍 Searching image for: ${title}`);

    if (unsplashKey) {
        try {
            const encodedQuery = encodeURIComponent(`${title} news`);
            const url = `https://api.unsplash.com/search/photos?query=${encodedQuery}&per_page=1&orientation=landscape`;
            const response = await fetch(url, { headers: { 'Authorization': `Client-ID ${unsplashKey}` } });
            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    return data.results[0].urls.regular;
                }
            }
        } catch (e) {
            console.error('Unsplash Error:', e.message);
        }
    }

    // Fallback placeholder
    return `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=800&fit=crop`;
}

async function start() {
    const news = await prisma.news.findMany({
        where: { OR: [{ imageUrl: null }, { imageUrl: '' }] }
    });

    console.log(`Found ${news.length} items to update.`);

    for (const item of news) {
        console.log(`Updating: ${item.title}`);
        const url = await findNewsImage(item.title);
        await prisma.news.update({
            where: { id: item.id },
            data: { imageUrl: url }
        });
        console.log(`✅ Done: ${url}`);
    }
}

start()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
