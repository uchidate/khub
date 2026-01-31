const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding enriched data for SQLite...');

    // 0. Limpeza
    console.log('Limpando dados existentes...');
    await prisma.artistProduction.deleteMany({});
    await prisma.production.deleteMany({});
    await prisma.artist.deleteMany({});
    await prisma.agency.deleteMany({});
    await prisma.news.deleteMany({});

    // 1. Agências
    const agenciesData = [
        { name: 'HYBE Labels', website: 'https://hybecorp.com', socials: JSON.stringify({ twitter: '@hybe_labels' }) },
        { name: 'EDAM Entertainment', website: 'http://edam-ent.com', socials: JSON.stringify({ instagram: '@edam.official' }) },
        { name: 'SM Entertainment', website: 'https://www.smentertainment.com', socials: JSON.stringify({ twitter: '@SMTOWNGLOBAL' }) },
        { name: 'JYP Entertainment', website: 'https://www.jype.com', socials: JSON.stringify({ twitter: '@jypnation' }) },
        { name: 'YG Entertainment', website: 'https://www.ygfamily.com', socials: JSON.stringify({ twitter: '@ygent_official' }) },
        { name: 'Starship Entertainment', website: 'http://www.starship-ent.com', socials: JSON.stringify({ twitter: '@STARSHIPent' }) },
    ];

    const agencies = {} as any;
    for (const data of agenciesData) {
        agencies[data.name] = await prisma.agency.upsert({
            where: { name: data.name },
            update: data,
            create: data,
        });
    }

    // 2. Artistas
    const artistsData = [
        {
            nameRomanized: 'IU',
            nameHangul: '아이유',
            stageNames: ['IU'].join(','),
            roles: ['Cantora', 'Atriz'].join(','),
            bio: 'Lee Ji-eun, conhecida como IU, é uma das solistas mais bem-sucedidas da Coreia.',
            agencyId: agencies['EDAM Entertainment'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1541535881962-3bb380b08458?q=80&w=600',
        },
        {
            nameRomanized: 'V',
            nameHangul: '김태형',
            stageNames: ['V', 'Taehyung'].join(','),
            roles: ['Cantor', 'Ator'].join(','),
            bio: 'Membro do BTS e ator aclamado por seu papel em Hwarang.',
            agencyId: agencies['HYBE Labels'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600',
        },
        {
            nameRomanized: 'Jennie',
            nameHangul: '제니',
            stageNames: ['Jennie'].join(','),
            roles: ['Cantora', 'Rapper', 'Modelo'].join(','),
            bio: 'Membro do BLACKPINK e ícone global da moda.',
            agencyId: agencies['YG Entertainment'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1516515429572-1f9f3b839fdc?q=80&w=600',
        },
        {
            nameRomanized: 'Bang Chan',
            nameHangul: '방찬',
            stageNames: ['Bang Chan', 'CB97'].join(','),
            roles: ['Cantor', 'Produtor', 'Líder'].join(','),
            bio: 'Líder do grupo Stray Kids e produtor principal do 3RACHA.',
            agencyId: agencies['JYP Entertainment'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1520156555610-760a9f5d3043?q=80&w=600',
        },
        {
            nameRomanized: 'Karina',
            nameHangul: '카리나',
            stageNames: ['Karina'].join(','),
            roles: ['Cantora', 'Dançarina'].join(','),
            bio: 'Líder do grupo aespa e conhecida por seu visual impressionante.',
            agencyId: agencies['SM Entertainment'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?q=80&w=600',
        },
        {
            nameRomanized: 'Wonyoung',
            nameHangul: '장원영',
            stageNames: ['Wonyoung'].join(','),
            roles: ['Cantora', 'Modelo'].join(','),
            bio: 'Membro do grupo IVE e uma das visualidades mais populares da 4ª geração.',
            agencyId: agencies['Starship Entertainment'].id,
            primaryImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600',
        },
    ];

    const artists = {} as any;
    for (const data of artistsData) {
        artists[data.nameRomanized] = await prisma.artist.create({ data });
    }

    // 3. Produções
    const productionsData = [
        {
            titlePt: 'Hotel Del Luna',
            type: 'serie',
            year: 2019,
            synopsis: 'Jang Man-wol é a proprietária de um hotel para almas.',
            streamingPlatforms: ['Netflix', 'Viki'].join(','),
            artistConnections: [{ artistId: artists['IU'].id, role: 'Protagonista' }]
        },
        {
            titlePt: 'Hwarang',
            type: 'serie',
            year: 2016,
            synopsis: 'A história de jovens guerreiros no Reino de Silla.',
            streamingPlatforms: ['Netflix', 'Viki'].join(','),
            artistConnections: [{ artistId: artists['V'].id, role: 'Han-sung' }]
        },
        {
            titlePt: 'The Idol',
            type: 'serie',
            year: 2023,
            synopsis: 'Uma jovem estrela pop entra no mundo sombrio da fama.',
            streamingPlatforms: ['HBO Max'].join(','),
            artistConnections: [{ artistId: artists['Jennie'].id, role: 'Dyanne' }]
        },
        {
            titlePt: 'Parasita',
            type: 'filme',
            year: 2019,
            synopsis: 'Uma família pobre se infiltra na vida de uma família rica.',
            streamingPlatforms: ['HBO Max', 'Telecine'].join(','),
            artistConnections: []
        },
        {
            titlePt: 'Squid Game',
            type: 'serie',
            year: 2021,
            synopsis: 'Pessoas endividadas jogam jogos infantis mortais por dinheiro.',
            streamingPlatforms: ['Netflix'].join(','),
            artistConnections: []
        },
        {
            titlePt: 'Pousando no Amor',
            type: 'serie',
            year: 2019,
            synopsis: 'Uma herdeira sul-coreana cai na Coreia do Norte por acidente.',
            streamingPlatforms: ['Netflix'].join(','),
            artistConnections: []
        },
    ];

    for (const data of productionsData) {
        const { artistConnections, ...prod } = data;
        await prisma.production.create({
            data: {
                ...prod,
                artists: {
                    create: artistConnections
                }
            },
        });
    }

    // 4. Notícias
    const newsData = [
        {
            title: 'HallyuHub v1 é lançado oficialmente',
            contentMd: 'O portal HallyuHub v1 acaba de ser lançado focado em trazer o melhor da cultura coreana...',
            sourceUrl: 'https://hallyuhub.com.br/news/launch',
            tags: ['Lançamento', 'Portal'].join(','),
        },
        {
            title: 'Stray Kids anuncia nova turnê mundial para 2026',
            contentMd: 'O grupo fenômeno da JYP Entertainment confirmou datas para São Paulo e Rio de Janeiro.',
            sourceUrl: 'https://hallyuhub.com.br/news/skz-tour',
            tags: ['K-Pop', 'Tour', 'Brasil'].join(','),
        },
        {
            title: 'BLACKPINK renova contrato com a YG Entertainment',
            contentMd: 'Após meses de especulação, o grupo mais famoso do mundo continuará suas atividades em conjunto.',
            sourceUrl: 'https://hallyuhub.com.br/news/bp-renewal',
            tags: ['BLACKPINK', 'YG', 'Negócios'].join(','),
        },
        {
            title: 'K-Drama "My Demon" quebra recordes de audiência na Ásia',
            contentMd: 'A química entre Song Kang e Kim Yoo-jung conquistou fãs em todo o mundo.',
            sourceUrl: 'https://hallyuhub.com.br/news/my-demon-hits',
            tags: ['K-Drama', 'Netflix', 'Audiência'].join(','),
        },
        {
            title: 'Novo museu de K-Pop será inaugurado em Seul',
            contentMd: 'O espaço contará com exposições interativas e itens raros de ídolos lendários.',
            sourceUrl: 'https://hallyuhub.com.br/news/kpop-museum',
            tags: ['Turismo', 'Seul', 'Cultura'].join(','),
        },
    ];

    for (const data of newsData) {
        await prisma.news.create({ data });
    }

    console.log('Seeding complete for SQLite.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
