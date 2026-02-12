import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log('📊 HallyuHub Database Statistics\n');
    console.log('='.repeat(60));

    // Contar registros
    const [newsCount, artistCount, productionCount, agencyCount] = await Promise.all([
        prisma.news.count(),
        prisma.artist.count(),
        prisma.production.count(),
        prisma.agency.count(),
    ]);

    console.log('\n📈 Total Records:');
    console.log(`   News: ${newsCount}`);
    console.log(`   Artists: ${artistCount}`);
    console.log(`   Productions: ${productionCount}`);
    console.log(`   Agencies: ${agencyCount}`);

    // Últimas notícias
    console.log('\n\n📰 Latest News (5 most recent):');
    const latestNews = await prisma.news.findMany({
        take: 5,
        orderBy: { publishedAt: 'desc' },
        select: { title: true, publishedAt: true },
    });

    for (const news of latestNews) {
        const date = news.publishedAt.toISOString().split('T')[0];
        console.log(`   • [${date}] ${news.title}`);
    }

    // Últimos artistas
    console.log('\n\n🎤 Latest Artists (5 most recent):');
    const latestArtists = await prisma.artist.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { nameRomanized: true, nameHangul: true, roles: true },
    });

    for (const artist of latestArtists) {
        console.log(`   • ${artist.nameRomanized} (${artist.nameHangul}) - ${artist.roles}`);
    }

    // Últimas produções
    console.log('\n\n🎬 Latest Productions (5 most recent):');
    const latestProductions = await prisma.production.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { titlePt: true, titleKr: true, type: true, year: true },
    });

    for (const prod of latestProductions) {
        console.log(`   • ${prod.titlePt} (${prod.titleKr}) - ${prod.type} ${prod.year}`);
    }

    // Agências com mais artistas
    console.log('\n\n🏢 Top Agencies by Artist Count:');
    const agencies = await prisma.agency.findMany({
        include: {
            _count: {
                select: { artists: true },
            },
        },
        orderBy: {
            artists: {
                _count: 'desc',
            },
        },
        take: 5,
    });

    for (const agency of agencies) {
        console.log(`   • ${agency.name}: ${agency._count.artists} artists`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✨ Statistics complete!\n');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
