export type ArchiveHubKind = 'artists' | 'groups' | 'productions'

export type ArchiveHub = {
    slug: string
    kind: ArchiveHubKind
    groupSlug?: string
    title: string
    shortTitle: string
    description: string
    intro: string[]
    keywords: string[]
    faq: Array<{ question: string; answer: string }>
}

const SINGER_ROLE_TERMS = ['cantor', 'cantora', 'singer', 'vocalist', 'rapper', 'idol']
const ACTOR_ROLE_TERMS = ['ator', 'atriz', 'actor', 'actress']

export const ARCHIVE_HUBS: ArchiveHub[] = [
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
        slug: 'grupos-femininos-kpop',
        kind: 'groups',
        title: 'Grupos femininos de K-Pop',
        shortTitle: 'Girl groups',
        description: 'Conheça girl groups de K-Pop com integrantes, discografia, carreira, vídeos e perfis completos em português.',
        intro: [
            'Girl groups são um dos motores do K-Pop global, combinando conceitos visuais, coreografias, vocais e fandoms muito ativos.',
            'Aqui você encontra grupos femininos com links para integrantes, músicas, vídeos e páginas relacionadas dentro do HallyuHub.',
        ],
        keywords: ['girl groups kpop', 'grupos femininos kpop', 'kpop feminino', 'integrantes girl group'],
        faq: [
            {
                question: 'O que é um girl group de K-Pop?',
                answer: 'É um grupo feminino da indústria coreana, normalmente formado por idols com foco em música, performance, conceitos visuais e fandom.',
            },
            {
                question: 'O hub inclui grupos ativos e inativos?',
                answer: 'Sim. A lista pode incluir grupos ativos, inativos ou dissolvidos quando eles têm relevância cultural e perfil público no HallyuHub.',
            },
        ],
    },
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
            {
                question: 'Todos os doramas deste hub estão disponíveis na Netflix?',
                answer: 'A disponibilidade pode variar por país e data. O hub reúne produções coreanas associadas à Netflix ou marcadas no catálogo com presença na plataforma.',
            },
            {
                question: 'O HallyuHub informa onde assistir?',
                answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.',
            },
        ],
    },
    {
        slug: 'integrantes-do-ive',
        kind: 'artists',
        groupSlug: 'ive',
        title: 'Integrantes do IVE',
        shortTitle: 'IVE',
        description: 'Conheça as integrantes do IVE com perfis em português, posições, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'IVE se tornou um dos nomes centrais da nova geração do K-Pop, reunindo integrantes com forte presença em música, moda, performance e cultura pop.',
            'Este hub organiza as páginas das integrantes para facilitar a navegação por perfis, carreira e conexões dentro do HallyuHub.',
        ],
        keywords: ['integrantes do ive', 'membros ive', 'ive kpop', 'wonyoung yujin rei'],
        faq: [
            {
                question: 'Quem são as integrantes do IVE?',
                answer: 'O IVE é um grupo feminino de K-Pop. Este hub reúne as integrantes cadastradas no HallyuHub com links para perfis individuais e informações relacionadas.',
            },
            {
                question: 'As páginas mostram carreira solo e atividades individuais?',
                answer: 'Sim. Quando disponível, cada perfil pode mostrar discografia, produções, curiosidades, redes oficiais e histórico de carreira.',
            },
        ],
    },
    {
        slug: 'integrantes-do-aespa',
        kind: 'artists',
        groupSlug: 'aespa',
        title: 'Integrantes do aespa',
        shortTitle: 'aespa',
        description: 'Explore as integrantes do aespa com perfis, carreira, músicas, vídeos e curiosidades em português.',
        intro: [
            'aespa combina K-Pop, identidade visual futurista e performances que marcaram a quarta geração.',
            'Neste hub, você encontra links diretos para as integrantes e pode navegar por perfis relacionados dentro do catálogo HallyuHub.',
        ],
        keywords: ['integrantes do aespa', 'membros aespa', 'aespa kpop', 'karina winter giselle ningning'],
        faq: [
            {
                question: 'O hub inclui todas as integrantes do aespa?',
                answer: 'O hub lista as integrantes do aespa que estão cadastradas e públicas no HallyuHub.',
            },
            {
                question: 'Posso ver músicas e vídeos das integrantes?',
                answer: 'Quando o perfil estiver enriquecido, ele pode incluir vídeos, links musicais, discografia e conteúdo editorial.',
            },
        ],
    },
    {
        slug: 'integrantes-do-fromis-9',
        kind: 'artists',
        groupSlug: 'fromis-9',
        title: 'Integrantes do fromis_9',
        shortTitle: 'fromis_9',
        description: 'Conheça as integrantes do fromis_9 com perfis em português, carreira, músicas e conexões no K-Pop.',
        intro: [
            'fromis_9 construiu uma trajetória com identidade própria, presença vocal e uma base fiel de fãs.',
            'Este hub reúne as integrantes públicas no HallyuHub para facilitar a descoberta de perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do fromis_9', 'membros fromis_9', 'fromis 9 kpop'],
        faq: [
            {
                question: 'Por que o nome aparece como fromis_9?',
                answer: 'O nome oficial do grupo costuma ser estilizado como fromis_9. Também pode aparecer em buscas como fromis-9 ou fromis 9.',
            },
            {
                question: 'As ex-integrantes aparecem no hub?',
                answer: 'O hub prioriza integrantes com associação pública ao grupo no catálogo. O histórico pode ser detalhado nas páginas individuais e do grupo.',
            },
        ],
    },
    {
        slug: 'integrantes-do-izone',
        kind: 'artists',
        groupSlug: 'izone',
        title: 'Integrantes do IZ*ONE',
        shortTitle: 'IZ*ONE',
        description: 'Veja as integrantes do IZ*ONE com perfis, carreira após o grupo, produções, músicas e curiosidades.',
        intro: [
            'IZ*ONE foi um grupo de grande impacto no K-Pop e no J-Pop, com integrantes que seguiram carreiras relevantes após o encerramento das atividades.',
            'Este hub ajuda a navegar pelas integrantes cadastradas no HallyuHub e acompanhar seus caminhos individuais.',
        ],
        keywords: ['integrantes do izone', 'membros izone', 'izone kpop', 'iz*one'],
        faq: [
            {
                question: 'IZ*ONE ainda está ativo?',
                answer: 'IZ*ONE encerrou suas atividades como grupo, mas suas integrantes seguiram carreiras em grupos, solos, atuação e entretenimento.',
            },
            {
                question: 'Este hub mostra a carreira após o IZ*ONE?',
                answer: 'Os perfis individuais podem trazer grupos atuais, produções, discografia e outros dados de carreira disponíveis no HallyuHub.',
            },
        ],
    },
]

export const ARCHIVE_HUB_BY_SLUG = Object.fromEntries(ARCHIVE_HUBS.map(hub => [hub.slug, hub]))

export function getArchiveHub(slug: string) {
    return ARCHIVE_HUB_BY_SLUG[slug]
}

export function getRelatedArtistHubs(input: {
    roles?: string[] | null
    gender?: number | null
    activeGroupCount?: number
    productionCount?: number
}) {
    const roles = (input.roles ?? []).map(role => role.toLowerCase())
    const isSinger = roles.some(role => SINGER_ROLE_TERMS.some(term => role.includes(term)))
    const isActor = roles.some(role => ACTOR_ROLE_TERMS.some(term => role.includes(term)))
    const slugs = [
        input.gender === 1 && isSinger ? 'cantoras-kpop' : null,
        isSinger && (input.activeGroupCount ?? 0) === 0 ? 'artistas-solo-kpop' : null,
        isSinger && (isActor || (input.productionCount ?? 0) > 0) ? 'idols-que-atuam-em-doramas' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}

export function getRelatedGroupHubs(input: { femaleMembers?: number; maleMembers?: number }) {
    const femaleMembers = input.femaleMembers ?? 0
    const maleMembers = input.maleMembers ?? 0
    return femaleMembers >= Math.max(1, maleMembers)
        ? [ARCHIVE_HUB_BY_SLUG['grupos-femininos-kpop']]
        : []
}

export function getRelatedProductionHubs(input: { streamingPlatforms?: string[] | null; network?: string | null; tags?: string[] | null }) {
    const values = [
        ...(input.streamingPlatforms ?? []),
        input.network ?? '',
        ...(input.tags ?? []),
    ].map(value => value.toLowerCase())
    return values.some(value => value.includes('netflix'))
        ? [ARCHIVE_HUB_BY_SLUG['doramas-coreanos-netflix']]
        : []
}
