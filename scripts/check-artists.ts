import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log('🔍 Checking recent artists...');
    const artists = await prisma.artist.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            nameRomanized: true,
            primaryImageUrl: true,
            tmdbId: true,
            createdAt: true
        }
    });

    console.table(artists);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
