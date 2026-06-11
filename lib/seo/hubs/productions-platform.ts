import type { ArchiveHub } from './types'

export const productionsPlatformHubs: ArchiveHub[] = [
    {
        slug: 'doramas-coreanos-netflix',
        kind: 'productions',
        title: 'Doramas coreanos na Netflix',
        shortTitle: 'Doramas na Netflix',
        description: 'Descubra doramas coreanos disponíveis ou associados à Netflix, com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'A Netflix ajudou muitos doramas coreanos a chegarem a públicos que antes não acompanhavam K-Drama de perto.',
            'Este hub reúne produções coreanas ligadas à plataforma, com páginas em português para entender elenco, sinopse e contexto de cada título.',
        ],
        keywords: ['doramas netflix', 'kdramas netflix', 'doramas coreanos netflix', 'séries coreanas netflix'],
        faq: [
            { question: 'Todos os doramas deste hub estão disponíveis na Netflix?', answer: 'A disponibilidade pode variar por país e data. O hub reúne produções coreanas associadas à Netflix ou marcadas no catálogo com presença na plataforma.' },
            { question: 'O HallyuHub informa onde assistir?', answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-amazon-prime',
        kind: 'productions',
        title: 'Doramas Coreanos na Amazon Prime Video',
        shortTitle: 'Doramas Prime',
        description: 'Lista dos melhores doramas coreanos disponíveis na Amazon Prime Video com perfis, sinopse e elenco em português.',
        intro: [
            'A Amazon Prime Video expandiu significativamente seu catálogo de dramas coreanos, trazendo títulos exclusivos e coproduzidos que chegam ao Brasil com legendas e dublagem.',
            'Este hub reúne as produções coreanas cadastradas no HallyuHub disponíveis na Prime Video para que você encontre facilmente o próximo dorama a assistir.',
        ],
        keywords: ['doramas amazon prime', 'kdramas prime video', 'dorama coreano prime', 'amazon prime korea', 'doramas prime brasil'],
        faq: [
            { question: 'Amazon Prime tem doramas coreanos?', answer: 'Sim. A Amazon Prime Video tem investido em dramas coreanos originais e licenciados, disponíveis para assinantes no Brasil com legendas em português.' },
            { question: 'Quais são os melhores doramas na Amazon Prime?', answer: 'O catálogo inclui títulos variados de romance, thriller e histórico. As produções disponíveis variam por região — confira o hub para os títulos cadastrados com disponibilidade confirmada.' },
        ],
    },
    {
        slug: 'doramas-disney-plus',
        kind: 'productions',
        title: 'Doramas coreanos no Disney+',
        shortTitle: 'Doramas Disney+',
        description: 'Descubra doramas coreanos disponíveis no Disney+ com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'O Disney+ entrou forte no mercado de K-Dramas com produções originais de alto orçamento e licenciamentos exclusivos que não aparecem em outras plataformas.',
            'Este hub reúne produções coreanas associadas ao Disney+ cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e contexto de cada título.',
        ],
        keywords: ['doramas disney plus', 'kdramas disney+', 'doramas coreanos disney', 'k-drama disney plus brasil'],
        faq: [
            { question: 'O Disney+ tem doramas coreanos originais?', answer: 'Sim. O Disney+ tem investido em K-Dramas originais e exclusivos, com produções de alto orçamento que competem diretamente com as originais da Netflix.' },
            { question: 'O HallyuHub informa sobre o Disney+?', answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-apple-tv-plus',
        kind: 'productions',
        title: 'Doramas coreanos no Apple TV+',
        shortTitle: 'Doramas Apple TV+',
        description: 'Descubra doramas coreanos disponíveis no Apple TV+ com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'O Apple TV+ é uma das plataformas que tem apostado em coproduzir e licenciar K-Dramas de alta qualidade, com foco em narrativas mais maduras e produções cinematográficas.',
            'Este hub reúne produções coreanas associadas ao Apple TV+ cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas apple tv plus', 'kdramas apple tv', 'doramas coreanos apple tv', 'k-drama apple tv+'],
        faq: [
            { question: 'Apple TV+ tem doramas coreanos?', answer: 'Sim. O Apple TV+ tem se associado a produções coreanas de qualidade cinematográfica, geralmente focadas em thriller, drama e narrativas com apelo global.' },
            { question: 'O HallyuHub informa sobre o Apple TV+?', answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-viki',
        kind: 'productions',
        title: 'Doramas coreanos no Viki',
        shortTitle: 'Doramas Viki',
        description: 'Encontre doramas coreanos disponíveis no Viki com sinopse, elenco, avaliação e páginas relacionadas em português.',
        intro: [
            'O Viki é uma das plataformas mais conhecidas por fãs de K-Drama, com catálogo forte em romances, dramas históricos, comédias românticas e séries clássicas que nem sempre aparecem nos streamings generalistas.',
            'Este hub reúne produções coreanas associadas ao Viki cadastradas no HallyuHub para facilitar a descoberta de elenco, sinopse, avaliação e conteúdos relacionados.',
        ],
        keywords: ['doramas viki', 'kdramas viki', 'doramas coreanos viki', 'onde assistir doramas viki'],
        faq: [
            { question: 'O Viki tem doramas coreanos legendados?', answer: 'Sim. O Viki é conhecido pelo catálogo de dramas asiáticos com legendas em vários idiomas, incluindo português em muitos títulos.' },
            { question: 'O HallyuHub mostra doramas do Viki?', answer: 'Quando a plataforma está cadastrada nos dados da produção, o hub reúne doramas associados ao Viki com links para sinopse, elenco e páginas relacionadas.' },
        ],
    },
    {
        slug: 'doramas-kocowa',
        kind: 'productions',
        title: 'Doramas coreanos no Kocowa',
        shortTitle: 'Doramas Kocowa',
        description: 'Veja doramas coreanos disponíveis no Kocowa com sinopse, elenco, avaliação e contexto em português.',
        intro: [
            'O Kocowa reúne conteúdos das principais emissoras coreanas e é uma referência para quem acompanha K-Dramas, variedades e lançamentos próximos da exibição original.',
            'Este hub organiza produções coreanas associadas ao Kocowa dentro do HallyuHub, conectando páginas de doramas, elenco e artistas relacionados.',
        ],
        keywords: ['doramas kocowa', 'kdramas kocowa', 'kocowa brasil', 'onde assistir kdramas kocowa'],
        faq: [
            { question: 'O Kocowa tem doramas coreanos?', answer: 'Sim. O Kocowa é focado em entretenimento coreano e reúne dramas, programas de variedade e outros conteúdos das principais emissoras da Coreia.' },
            { question: 'Como o HallyuHub organiza títulos do Kocowa?', answer: 'O hub lista produções cadastradas com associação ao Kocowa, priorizando páginas públicas com sinopse, elenco, avaliação e contexto editorial.' },
        ],
    },
]
