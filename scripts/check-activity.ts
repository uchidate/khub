import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentActivity() {
    console.log('--- Resumo de Atividade Recente (Database) ---');

    // 1. Artistas mais recentes
    const recentArtists = await prisma.artist.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
            nameRomanized: true,
            tmdbSyncStatus: true,
            tmdbLastAttempt: true,
            createdAt: true,
            _count: {
                select: { productions: true, albums: true }
            }
        }
    });

    console.log('\nÚltimos 5 Artistas Adicionados:');
    recentArtists.forEach(a => {
        console.log(`- ${a.nameRomanized}: Status=${a.tmdbSyncStatus}, Prod=${a._count.productions}, Alb=${a._count.albums}, Adicionado=${a.createdAt.toISOString()}`);
    });

    // 2. Últimas atualizações de música/filme
    const artistsWithData = await prisma.artist.findMany({
        where: {
            OR: [
                { productions: { some: {} } },
                { albums: { some: {} } }
            ]
        },
        take: 5,
        orderBy: { tmdbLastAttempt: 'desc' },
        select: {
            nameRomanized: true,
            tmdbLastAttempt: true,
            _count: {
                select: { productions: true, albums: true }
            }
        }
    });

    console.log('\nÚltimos Artistas Atualizados (com dados):');
    artistsWithData.forEach(a => {
        console.log(`- ${a.nameRomanized}: Prod=${a._count.productions}, Alb=${a._count.albums}, Última Tentativa=${a.tmdbLastAttempt?.toISOString()}`);
    });

    await prisma.$disconnect();
}

checkRecentActivity().catch(console.error);
