const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando atualização de dados reais...');

    // 1. Agências
    const agencies = [
        { name: 'LLOUD', website: 'https://lloud.co', socials: JSON.stringify({ instagram: '@wearelloud' }) },
        { name: 'Namoo Actors', website: 'http://www.namooactors.com', socials: JSON.stringify({ instagram: '@namooactors' }) },
        { name: '9ato Entertainment', website: 'http://9ato.com', socials: JSON.stringify({ instagram: '@9ato_ent' }) },
        { name: 'Fantagio', website: 'http://www.fantagio.kr', socials: JSON.stringify({ instagram: '@fantagio_official' }) },
    ];

    for (const agency of agencies) {
        await prisma.agency.upsert({
            where: { name: agency.name },
            update: {},
            create: agency,
        });
    }
    console.log('✅ Agências atualizadas.');

    // 2. Produções
    const productions = [
        {
            titlePt: 'My Demon',
            titleKr: '마이 데몬',
            type: 'SERIE',
            year: 2023,
            synopsis: 'Um demônio implacável perde seus poderes após se envolver com uma herdeira arrogante, mas o destino os une em um contrato de casamento.',
            streamingPlatforms: 'Netflix'
        },
        {
            titlePt: 'A Criatura de Gyeongseong',
            titleKr: '경성크리처',
            type: 'SERIE',
            year: 2023,
            synopsis: 'Em 1945, na sombria era colonial de Seul, um empresário e uma investigadora lutam pela sobrevivência enquanto enfrentam um monstro nascido da ganância humana.',
            streamingPlatforms: 'Netflix'
        },
        {
            titlePt: 'Wonderful World',
            titleKr: '원더풀 월드',
            type: 'SERIE',
            year: 2024,
            synopsis: 'Uma professora de psicologia busca justiça após perder o filho, cruzando o caminho de um jovem misterioso que vive em uma realidade brutal.',
            streamingPlatforms: 'Disney+'
        },
        {
            titlePt: 'My Name',
            titleKr: '마이 네임',
            type: 'SERIE',
            year: 2021,
            synopsis: 'Após o assassinato de seu pai, uma mulher movida pela vingança entra para uma rede de crime organizado e se infiltra na polícia.',
            streamingPlatforms: 'Netflix'
        }
    ];

    for (const prod of productions) {
        await prisma.production.upsert({
            where: { titlePt: prod.titlePt },
            update: {},
            create: prod,
        });
    }
    console.log('✅ Produções atualizadas.');

    // 3. Artistas
    // NOTA: As URLs abaixo são placeholders de alta qualidade do Unsplash
    // Para fotos reais dos artistas, substitua por URLs de press kits oficiais ou CDNs autorizados
    const artists = [
        {
            nameRomanized: 'Lisa',
            nameHangul: '리사',
            birthDate: new Date('1997-03-27'),
            roles: 'CANTORA, RAPPER, DANÇARINA, CEO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
            agencyName: 'LLOUD'
        },
        {
            nameRomanized: 'Felix',
            nameHangul: '필릭스',
            birthDate: new Date('2000-09-15'),
            roles: 'CANTOR, RAPPER, DANÇARINO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
            agencyName: 'JYP Entertainment'
        },
        {
            nameRomanized: 'Song Kang',
            nameHangul: '송강',
            birthDate: new Date('1994-04-23'),
            roles: 'ATOR, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
            agencyName: 'Namoo Actors'
        },
        {
            nameRomanized: 'Han So-hee',
            nameHangul: '한소희',
            birthDate: new Date('1994-11-18'),
            roles: 'ATRIZ, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&q=80',
            agencyName: '9ato Entertainment'
        },
        {
            nameRomanized: 'Cha Eun-woo',
            nameHangul: '차은우',
            birthDate: new Date('1997-03-30'),
            roles: 'ATOR, CANTOR, MODELO',
            primaryImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
            agencyName: 'Fantagio'
        }
    ];

    for (const artist of artists) {
        const agency = await prisma.agency.findUnique({ where: { name: artist.agencyName } });
        if (agency) {
            await prisma.artist.upsert({
                where: { nameRomanized: artist.nameRomanized },
                update: {},
                create: {
                    nameRomanized: artist.nameRomanized,
                    nameHangul: artist.nameHangul,
                    birthDate: artist.birthDate,
                    roles: artist.roles,
                    primaryImageUrl: artist.primaryImageUrl,
                    agencyId: agency.id
                }
            });
        }
    }
    console.log('✅ Artistas atualizados.');

    // 4. Notícias
    const newsItems = [
        {
            title: 'Lisa (BLACKPINK) confirmada no elenco da 3ª temporada de "The White Lotus"',
            contentMd: 'A estrela global Lalisa Manobal fará sua estreia como atriz na aclamada série da HBO, filmada em sua terra natal, a Tailândia.',
            publishedAt: new Date(),
            tags: 'LISA, BLACKPINK, HBO, ACTING',
            sourceUrl: 'https://variety.com'
        },
        {
            title: 'Felix, do Stray Kids, brilha na Paris Fashion Week como embaixador da Louis Vuitton',
            contentMd: 'O idol atraiu multidões em Paris, consolidando seu status como um dos maiores ícones da moda no K-Pop atual.',
            publishedAt: new Date(),
            tags: 'FELIX, STRAY KIDS, LV, FASHION',
            sourceUrl: 'https://vogue.com'
        },
        {
            title: 'Song Kang inicia serviço militar obrigatório e envia mensagem aos fãs',
            contentMd: 'O "Filho da Netflix" compartilhou uma carta escrita à mão, agradecendo o apoio antes de sua ausência temporária dos holofotes.',
            publishedAt: new Date(),
            tags: 'SONG KANG, MILITARY, NEWS',
            sourceUrl: 'https://soompi.com'
        },
        {
            title: 'Han So-hee e Park Seo-joon retornam para a 2ª temporada de "Gyeongseong Creature"',
            contentMd: 'A continuação da série de suspense estreia em breve, transportando o mistério para a Seul moderna de 2024.',
            publishedAt: new Date(),
            tags: 'HAN SO HEE, NETFLIX, K-DRAMA',
            sourceUrl: 'https://netflix.com'
        },
        {
            title: 'Cha Eun-woo lança seu primeiro álbum solo "ENTITY" e domina paradas globais',
            contentMd: 'Com letras profundamente pessoais, o artista mostra sua evolução como vocalista e compositor em seu aguardado debut solo.',
            publishedAt: new Date(),
            tags: 'CHA EUN WOO, ENTITY, SOLO, K-POP',
            sourceUrl: 'https://billboard.com'
        }
    ];

    for (const news of newsItems) {
        await prisma.news.upsert({
            where: { title: news.title },
            update: {},
            create: news,
        });
    }
    console.log('✅ Notícias atualizadas.');

    console.log('✨ Atualização concluída com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
