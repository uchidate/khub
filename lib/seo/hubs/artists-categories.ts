import type { ArchiveHub } from './types'

export const artistsCategoriesHubs: ArchiveHub[] = [
    {
        slug: 'cantoras-kpop',
        kind: 'artists',
        title: 'Cantoras de K-Pop',
        shortTitle: 'Cantoras K-Pop',
        description: 'Conheça cantoras de K-Pop, idols e solistas coreanas com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'As cantoras de K-Pop movimentam boa parte da cultura Hallyu: de vocalistas de grupos femininos a solistas com discografias próprias, elas conectam música, performance, moda e fandom.',
            'Este hub reúne perfis em português para descobrir artistas, navegar por grupos relacionados e encontrar trajetórias que merecem uma leitura mais profunda.',
        ],
        keywords: ['cantoras kpop', 'idols femininas', 'solistas kpop', 'cantora coreana'],
        faq: [
            {
                question: 'O que define uma cantora de K-Pop?',
                answer: 'No HallyuHub, consideramos cantoras de K-Pop artistas coreanas ou ligadas à indústria coreana que atuam como vocalistas, idols, rappers ou solistas em carreiras musicais.',
            },
            {
                question: 'Esta lista inclui integrantes de grupos?',
                answer: 'Sim. O hub pode incluir vocalistas e idols de grupos femininos, além de artistas com carreira solo ou atividades musicais individuais.',
            },
        ],
    },
    {
        slug: 'artistas-solo-kpop',
        kind: 'artists',
        title: 'Artistas solo de K-Pop',
        shortTitle: 'Solistas K-Pop',
        description: 'Explore artistas solo de K-Pop com perfis, carreira musical, discografia, vídeos e conexões com grupos coreanos.',
        intro: [
            'Carreiras solo no K-Pop ajudam fãs a acompanhar uma faceta mais autoral de idols, vocalistas, rappers e performers.',
            'Nesta seleção, o HallyuHub destaca artistas com presença musical individual, facilitando a descoberta de perfis, músicas e trajetórias fora ou além dos grupos.',
        ],
        keywords: ['artistas solo kpop', 'solistas kpop', 'idol solo', 'cantores solo coreanos'],
        faq: [
            {
                question: 'O que é um artista solo de K-Pop?',
                answer: 'É um artista com lançamentos ou presença musical individual, seja como solista principal ou como idol que também desenvolve trabalhos fora do grupo.',
            },
            {
                question: 'Artistas que já participaram de grupos aparecem aqui?',
                answer: 'Podem aparecer quando o perfil público tem foco relevante em carreira solo ou quando não há grupo ativo associado no catálogo.',
            },
        ],
    },
    {
        slug: 'idols-que-atuam-em-doramas',
        kind: 'artists',
        title: 'Idols que atuam em doramas',
        shortTitle: 'Idols atores',
        description: 'Lista de idols do K-Pop que também aparecem em doramas, filmes e séries coreanas, com perfis e filmografia em português.',
        intro: [
            'Muitos idols constroem carreiras paralelas em doramas e filmes, aproximando fãs de K-Pop do universo dos K-Dramas.',
            'Este hub organiza artistas com atividade musical e atuação, conectando perfis, grupos e produções para facilitar a navegação entre música e dramaturgia coreana.',
        ],
        keywords: ['idols atores', 'idols em doramas', 'kpop kdrama', 'cantores coreanos atores'],
        faq: [
            {
                question: 'Por que idols atuam em doramas?',
                answer: 'Muitos idols expandem a carreira para atuação por meio de dramas, filmes e séries, aproximando fandoms de K-Pop do público de K-Drama.',
            },
            {
                question: 'A lista mostra só protagonistas?',
                answer: 'Não. O hub pode incluir idols com papéis principais, coadjuvantes ou filmografia relevante em produções coreanas.',
            },
        ],
    },
    {
        slug: 'cantores-kpop',
        kind: 'artists',
        title: 'Cantores de K-Pop',
        shortTitle: 'Cantores K-Pop',
        description: 'Conheça cantores de K-Pop, idols e solistas coreanos com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'Os cantores de K-Pop — de vocalistas a rappers, de idols a solistas — representam uma diversidade enorme de estilos, trajetórias e histórias.',
            'Este hub reúne perfis em português para descobrir artistas masculinos do K-Pop, navegar por grupos relacionados e encontrar trajetórias que merecem atenção.',
        ],
        keywords: ['cantores kpop', 'idols masculinos', 'solistas kpop masculino', 'cantor coreano'],
        faq: [
            { question: 'O hub inclui integrantes de grupos?', answer: 'Sim. O hub pode incluir vocalistas, rappers e idols de grupos masculinos, além de artistas com carreira solo ou atividades musicais individuais.' },
            { question: 'Esta lista inclui ex-idols?', answer: 'Quando há perfil público ativo no HallyuHub, ex-idols e artistas que passaram por grupos podem aparecer na listagem.' },
        ],
    },
    {
        slug: 'idols-atores-coreanos',
        kind: 'artists',
        title: 'Idols coreanos que também são atores',
        shortTitle: 'Idols atores',
        description: 'Idols de K-Pop que também atuam em doramas, filmes e séries coreanas, com perfis e filmografia em português.',
        intro: [
            'Muitos idols transformaram a popularidade no palco em carreiras sólidas na atuação, aparecendo em doramas, filmes, musicais e séries de streaming.',
            'Este hub destaca artistas com carreira musical idol e presença em produções coreanas cadastradas no HallyuHub.',
        ],
        keywords: ['idols atores coreanos', 'idols que atuam', 'kpop idols atores', 'idol ator kdrama'],
        faq: [
            { question: 'Todo idol ator aparece neste hub?', answer: 'O hub depende dos dados públicos cadastrados no HallyuHub: perfil musical, papéis de atuação e produções vinculadas.' },
            { question: 'Qual a diferença para o hub de idols em doramas?', answer: 'Este hub usa foco editorial em idols com carreira dupla mais clara; o hub de idols em doramas é mais amplo e pode incluir participações variadas.' },
        ],
    },
    {
        slug: 'atrizes-coreanas',
        kind: 'artists',
        title: 'Atrizes coreanas',
        shortTitle: 'Atrizes coreanas',
        description: 'Conheça atrizes coreanas com perfis em português, filmografia, doramas, músicas e carreira no entretenimento coreano.',
        intro: [
            'As atrizes coreanas estão no centro do fenômeno dos K-Dramas: de protagonistas de romances a vilãs complexas, elas definem boa parte da cultura Hallyu.',
            'Este hub reúne perfis em português de atrizes que aparecem em produções coreanas — incluindo idols que também atuam — para facilitar a descoberta e navegação.',
        ],
        keywords: ['atrizes coreanas', 'atriz kdrama', 'atrizes kdrama', 'atrizes k-drama'],
        faq: [
            { question: 'O hub inclui idols que atuam?', answer: 'Sim. Muitas idols do K-Pop também têm carreiras como atrizes em doramas, filmes ou produções especiais, e podem aparecer neste hub.' },
            { question: 'As páginas mostram a filmografia completa?', answer: 'Quando disponível, cada perfil pode mostrar produções, curiosidades, redes oficiais e histórico de carreira no HallyuHub.' },
        ],
    },
    {
        slug: 'atrizes-de-doramas-romanticos',
        kind: 'artists',
        title: 'Atrizes de doramas românticos',
        shortTitle: 'Atrizes românticas',
        description: 'Atrizes coreanas conhecidas por doramas românticos, com perfis, filmografia e produções relacionadas em português.',
        intro: [
            'Doramas românticos dependem muito da química e presença das protagonistas. Algumas atrizes se tornaram referência mundial justamente por personagens de romance e comédia romântica.',
            'Este hub reúne atrizes com produções românticas vinculadas no HallyuHub, conectando perfis, doramas e conteúdos relacionados.',
        ],
        keywords: ['atrizes doramas romanticos', 'atrizes kdrama romance', 'atriz coreana romance', 'protagonistas dorama romantico'],
        faq: [
            { question: 'O hub mostra apenas protagonistas?', answer: 'Não necessariamente. Atrizes com papéis relevantes em produções românticas podem aparecer conforme os dados cadastrados.' },
            { question: 'As páginas mostram os doramas românticos?', answer: 'Quando a filmografia está vinculada, os perfis mostram produções relacionadas e ajudam a navegar para os doramas.' },
        ],
    },
    {
        slug: 'atores-coreanos',
        kind: 'artists',
        title: 'Atores coreanos',
        shortTitle: 'Atores coreanos',
        description: 'Conheça atores coreanos com perfis em português, filmografia, doramas, carreira e curiosidades sobre o entretenimento coreano.',
        intro: [
            'Os atores coreanos conquistaram o mundo não apenas pelos K-Dramas, mas por um nível de craft que vai do romance à ação e ao drama psicológico.',
            'Este hub reúne perfis em português de atores do entretenimento coreano para facilitar a descoberta, navegação por produções e histórico de carreira.',
        ],
        keywords: ['atores coreanos', 'ator kdrama', 'atores kdrama', 'atores coreanos famosos'],
        faq: [
            { question: 'O hub inclui idols que atuam?', answer: 'Sim. Vários idols do K-Pop também atuam em doramas e filmes. Quando há perfil com produções vinculadas, eles podem aparecer neste hub.' },
            { question: 'As páginas mostram a filmografia completa?', answer: 'Quando disponível, cada perfil pode mostrar produções, curiosidades, redes oficiais e histórico de carreira no HallyuHub.' },
        ],
    },
    {
        slug: 'kpop-idols-famosos',
        kind: 'artists',
        title: 'Idols de K-Pop mais famosos',
        shortTitle: 'Idols famosos',
        description: 'Conheça os idols de K-Pop mais famosos do mundo com perfis em português, carreira, grupos, músicas e curiosidades.',
        intro: [
            'O fenômeno idol coreano vai além da música: envolve treinamento rigoroso, conceitos visuais únicos, fandoms globais e uma indústria que gera bilhões por ano.',
            'Este hub reúne os idols com maior destaque no HallyuHub para facilitar a descoberta de perfis, grupos relacionados e conteúdos editoriais.',
        ],
        keywords: ['idols kpop famosos', 'idols coreanos', 'kpop idols mais famosos', 'kpop artistas'],
        faq: [
            { question: 'O que é um idol coreano?', answer: 'Um idol coreano é um artista formado por uma agência de entretenimento que passou por anos de treinamento em canto, dança e performance antes de debutar em um grupo ou solo.' },
            { question: 'Quais são os idols mais famosos do mundo?', answer: 'Internacionalmente, os membros do BTS têm o maior alcance global, mas outros como Jennie (BLACKPINK), Karina (aespa), IU e Lisa também estão entre os mais reconhecidos fora da Coreia.' },
        ],
    },
]
