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
    {
        slug: 'integrantes-do-twice',
        kind: 'artists',
        groupSlug: 'twice',
        title: 'Integrantes do TWICE',
        shortTitle: 'TWICE',
        description: 'Conheça as integrantes do TWICE com perfis em português, carreira, músicas, grupos relacionados e curiosidades.',
        intro: [
            'TWICE é um dos girl groups mais importantes da terceira geração, com forte presença no K-Pop, no J-Pop e em turnês globais.',
            'Este hub reúne as integrantes públicas no HallyuHub para facilitar a navegação por perfis, carreira individual e conteúdos relacionados.',
        ],
        keywords: ['integrantes do twice', 'membros twice', 'twice kpop', 'nayeon jihyo momo sana'],
        faq: [
            { question: 'Quem são as integrantes do TWICE?', answer: 'Este hub reúne as integrantes do TWICE cadastradas e públicas no HallyuHub, com links para perfis individuais.' },
            { question: 'O hub inclui carreiras solo?', answer: 'Sim. Quando disponível, os perfis individuais mostram trabalhos solo, discografia, vídeos e outras atividades.' },
        ],
    },
    {
        slug: 'integrantes-do-blackpink',
        kind: 'artists',
        groupSlug: 'blackpink',
        title: 'Integrantes do BLACKPINK',
        shortTitle: 'BLACKPINK',
        description: 'Explore as integrantes do BLACKPINK com perfis, carreira solo, músicas, vídeos e fatos em português.',
        intro: [
            'BLACKPINK é um dos grupos de K-Pop mais reconhecidos globalmente, com integrantes que também construíram carreiras solo fortes.',
            'Este hub conecta as páginas individuais das integrantes para quem quer acompanhar música, moda, atuação e presença internacional.',
        ],
        keywords: ['integrantes do blackpink', 'membros blackpink', 'blackpink kpop', 'jennie lisa jisoo rosé'],
        faq: [
            { question: 'As integrantes do BLACKPINK têm carreira solo?', answer: 'Sim. As integrantes também têm trabalhos individuais em música, moda, atuação ou entretenimento, quando esses dados estão disponíveis nos perfis.' },
            { question: 'O hub mostra links oficiais?', answer: 'Os perfis individuais podem incluir redes oficiais, vídeos, discografia e outros links curados.' },
        ],
    },
    {
        slug: 'integrantes-do-newjeans',
        kind: 'artists',
        groupSlug: 'newjeans',
        title: 'Integrantes do NewJeans',
        shortTitle: 'NewJeans',
        description: 'Veja as integrantes do NewJeans com perfis em português, carreira, músicas, conceitos e curiosidades.',
        intro: [
            'NewJeans marcou a nova geração com estética própria, sonoridade pop e alto impacto cultural.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para facilitar descoberta e navegação.',
        ],
        keywords: ['integrantes do newjeans', 'membros newjeans', 'newjeans kpop'],
        faq: [
            { question: 'O hub lista todas as integrantes do NewJeans?', answer: 'Ele lista as integrantes cadastradas e públicas no HallyuHub.' },
            { question: 'Posso acompanhar conteúdos relacionados?', answer: 'Sim. Os perfis podem linkar músicas, vídeos, artigos e outros conteúdos relacionados.' },
        ],
    },
    {
        slug: 'integrantes-do-le-sserafim',
        kind: 'artists',
        groupSlug: 'le-sserafim',
        title: 'Integrantes do LE SSERAFIM',
        shortTitle: 'LE SSERAFIM',
        description: 'Conheça as integrantes do LE SSERAFIM com perfis, carreira, músicas, vídeos e conexões no K-Pop.',
        intro: [
            'LE SSERAFIM combina performance, narrativa visual e presença global entre os grupos femininos mais comentados da nova geração.',
            'Este hub reúne as integrantes públicas no HallyuHub e facilita a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do le sserafim', 'membros le sserafim', 'lesserafim kpop'],
        faq: [
            { question: 'Como o nome LE SSERAFIM aparece nas buscas?', answer: 'Pode aparecer como LE SSERAFIM, Le Sserafim ou lesserafim; este hub usa a grafia editorial do HallyuHub.' },
            { question: 'O hub inclui atividades individuais?', answer: 'Quando disponíveis, as atividades individuais aparecem nos perfis das integrantes.' },
        ],
    },
    {
        slug: 'integrantes-do-babymonster',
        kind: 'artists',
        groupSlug: 'babymonster',
        title: 'Integrantes do BABYMONSTER',
        shortTitle: 'BABYMONSTER',
        description: 'Explore as integrantes do BABYMONSTER com perfis, carreira, músicas e curiosidades em português.',
        intro: [
            'BABYMONSTER é um grupo feminino ligado à nova geração do K-Pop, com forte atenção internacional desde o debut.',
            'Este hub organiza as integrantes públicas no HallyuHub para facilitar descoberta por fãs e novos leitores.',
        ],
        keywords: ['integrantes do babymonster', 'membros babymonster', 'babymonster kpop'],
        faq: [
            { question: 'O hub mostra as integrantes do BABYMONSTER?', answer: 'Sim, quando elas estão cadastradas e públicas no catálogo HallyuHub.' },
            { question: 'Os perfis têm vídeos e músicas?', answer: 'Perfis enriquecidos podem incluir vídeos do YouTube, links musicais e conteúdo editorial.' },
        ],
    },
    {
        slug: 'integrantes-do-nmixx',
        kind: 'artists',
        groupSlug: 'nmixx',
        title: 'Integrantes do NMIXX',
        shortTitle: 'NMIXX',
        description: 'Conheça as integrantes do NMIXX com perfis, carreira, músicas, vídeos e curiosidades em português.',
        intro: [
            'NMIXX se destaca por vocais fortes, performance e propostas musicais que chamam atenção dentro da quarta geração.',
            'Este hub reúne as integrantes públicas no HallyuHub para melhorar a navegação por perfis e temas relacionados.',
        ],
        keywords: ['integrantes do nmixx', 'membros nmixx', 'nmixx kpop'],
        faq: [
            { question: 'Quem aparece no hub do NMIXX?', answer: 'As integrantes do NMIXX cadastradas e públicas no HallyuHub aparecem com links para seus perfis.' },
            { question: 'A página é atualizada?', answer: 'Os hubs usam os dados públicos do catálogo; conforme perfis são atualizados, os links e dados ficam mais completos.' },
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

export function getRelatedGroupHubs(input: { slug?: string | null; femaleMembers?: number; maleMembers?: number }) {
    const femaleMembers = input.femaleMembers ?? 0
    const maleMembers = input.maleMembers ?? 0
    const slugs = [
        input.slug ? `integrantes-do-${input.slug}` : null,
        femaleMembers >= Math.max(1, maleMembers) ? 'grupos-femininos-kpop' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
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
