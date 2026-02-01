const { PrismaClient } = require("./node_modules/.prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Inclusão de Agências...");
    const agencies = [
        { name: "LLOUD", website: "https://lloud.co" },
        { name: "Namoo Actors", website: "http://www.namooactors.com" },
        { name: "9ato Entertainment", website: "http://9ato.com" },
        { name: "Fantagio", website: "http://www.fantagio.kr" },
    ];

    for (const agency of agencies) {
        await prisma.agency.upsert({
            where: { name: agency.name },
            update: {},
            create: agency,
        });
    }

    console.log("🎬 Inclusão de Produções...");
    const productions = [
        {
            titlePt: "My Demon",
            titleKr: "마이 데몬",
            type: "SERIE",
            year: 2023,
            synopsis: "Um demônio implacável perde seus poderes após se envolver com uma herdeira arrogante, mas o destino os une em um contrato de casamento.",
            streamingPlatforms: "Netflix"
        },
        {
            titlePt: "A Criatura de Gyeongseong",
            titleKr: "경성크리처",
            type: "SERIE",
            year: 2023,
            synopsis: "Em 1945, na sombria era colonial de Seul, um empresário e uma investigadora lutam pela sobrevivência enquanto enfrentam um monstro nascido da ganância humana.",
            streamingPlatforms: "Netflix"
        },
        {
            titlePt: "Wonderful World",
            titleKr: "원더풀 월드",
            type: "SERIE",
            year: 2024,
            synopsis: "Uma professora de psicologia busca justiça após perder o filho, cruzando o caminho de um jovem misterioso que vive em uma realidade brutal.",
            streamingPlatforms: "Disney+"
        },
        {
            titlePt: "My Name",
            titleKr: "마이 네임",
            type: "SERIE",
            year: 2021,
            synopsis: "Após o assassinato de seu pai, uma mulher movida pela vingança entra para uma rede de crime organizado e se infiltra na polícia.",
            streamingPlatforms: "Netflix"
        }
    ];

    for (const prod of productions) {
        await prisma.production.upsert({
            where: { titlePt: prod.titlePt },
            update: {},
            create: prod,
        });
    }

    console.log("⭐ Inclusão de Artistas Reais...");
    const artists = [
        {
            nameRomanized: 'Lisa',
            nameHangul: '리사',
            birthDate: new Date('1997-03-27'),
            roles: 'CANTORA, RAPPER, DANÇARINA, CEO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
            agency: { connect: { name: 'LLOUD' } }
        },
        {
            nameRomanized: 'Felix',
            nameHangul: '필릭스',
            birthDate: new Date('2000-09-15'),
            roles: 'CANTOR, RAPPER, DANÇARINO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
        },
        {
            nameRomanized: 'Song Kang',
            nameHangul: '송강',
            birthDate: new Date('1994-04-23'),
            roles: 'ATOR, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
            agency: { connect: { name: 'Namoo Actors' } }
        },
        {
            nameRomanized: 'Han So-hee',
            nameHangul: '한소희',
            birthDate: new Date('1994-11-18'),
            roles: 'ATRIZ, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80',
            agency: { connect: { name: '9ato Entertainment' } }
        },
        {
            nameRomanized: 'Cha Eun-woo',
            nameHangul: '차은우',
            birthDate: new Date('1997-03-30'),
            roles: 'ATOR, CANTOR, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80',
            agency: { connect: { name: 'Fantagio' } }
        }
    ];

    for (const artist of artists) {
        const { agency, ...artistData } = artist;
        await prisma.artist.upsert({
            where: { nameRomanized: artist.nameRomanized },
            update: {
                ...artistData,
                agency: agency || undefined
            },
            create: {
                ...artistData,
                agency: agency || undefined
            },
        });
    }

    console.log("✅ Todo o conteúdo foi semeado com sucesso!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
