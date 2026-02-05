import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
