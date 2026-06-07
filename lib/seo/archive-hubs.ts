export type ArchiveHubKind = 'artists' | 'groups' | 'productions'

export type ArchiveHub = {
    slug: string
    kind: ArchiveHubKind
    groupSlug?: string
    agencyName?: string
    year?: number
    title: string
    shortTitle: string
    description: string
    intro: string[]
    keywords: string[]
    faq: Array<{ question: string; answer: string }>
    /** Idioma do hub. Hubs sem este campo são tratados como 'pt' (comportamento original, intocado). */
    locale?: 'pt' | 'en' | 'es'
    /**
     * Chave compartilhada entre versões traduzidas do mesmo hub (ex: 'bts-members').
     * Usada apenas para montar hreflang cruzado entre pt/en/es — não afeta slugs nem URLs existentes.
     */
    i18nKey?: string
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
    {
        slug: 'integrantes-do-bts',
        kind: 'artists',
        groupSlug: 'bts',
        i18nKey: 'bts-members',
        title: 'Integrantes do BTS',
        shortTitle: 'BTS',
        description: 'Conheça os integrantes do BTS com perfis, carreira solo, músicas, vídeos e curiosidades em português.',
        intro: [
            'BTS é o grupo de K-Pop mais conhecido no mundo, com sete integrantes que também constroem carreiras solo expressivas na música, atuação e entretenimento.',
            'Este hub reúne os perfis dos membros cadastrados no HallyuHub para que fãs e novos descobridores possam navegar por cada trajetória individual com facilidade.',
        ],
        keywords: ['integrantes do bts', 'membros bts', 'bts kpop', 'rm jin suga jhope jimin v jungkook', 'bangtan boys'],
        faq: [
            { question: 'Quem são os integrantes do BTS?', answer: 'BTS tem sete integrantes: RM, Jin, Suga, J-Hope, Jimin, V e Jungkook. Todos têm perfis no HallyuHub com discografia, vídeos e carreira individual.' },
            { question: 'Os membros do BTS têm carreira solo?', answer: 'Sim. Todos os membros do BTS lançaram projetos solo como álbuns, mixtapes, trilhas sonoras e colaborações internacionais. Os detalhes aparecem em cada perfil.' },
            { question: 'BTS ainda está ativo?', answer: 'BTS pausou atividades coletivas enquanto os membros cumprem o serviço militar obrigatório na Coreia do Sul. A volta do grupo está prevista para 2025 e 2026.' },
        ],
    },
    {
        slug: 'integrantes-do-stray-kids',
        kind: 'artists',
        groupSlug: 'stray-kids',
        title: 'Integrantes do Stray Kids',
        shortTitle: 'Stray Kids',
        description: 'Explore os integrantes do Stray Kids com perfis em português, carreira, músicas, vídeos e curiosidades sobre o grupo.',
        intro: [
            'Stray Kids é um dos grupos masculinos de maior impacto da quarta geração, reconhecido pela produção própria, sonoridade intensa e fanbase global chamada STAY.',
            'Este hub organiza os membros cadastrados no HallyuHub para facilitar a navegação por perfis, atividades individuais e conteúdos relacionados.',
        ],
        keywords: ['integrantes do stray kids', 'membros stray kids', 'straykids kpop', 'bang chan felix hyunjin'],
        faq: [
            { question: 'Quem são os integrantes do Stray Kids?', answer: 'Stray Kids é formado por Bang Chan, Lee Know, Changbin, Hyunjin, Han, Felix, Seungmin e I.N. Os perfis disponíveis no HallyuHub trazem carreira, fotos e conexões.' },
            { question: 'O Stray Kids produz as próprias músicas?', answer: 'Sim. A sub-unit 3RACHA — formada por Bang Chan, Changbin e Han — é responsável por grande parte da produção musical do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-girls-generation',
        kind: 'artists',
        groupSlug: 'girls-generation',
        title: 'Integrantes do Girls\' Generation',
        shortTitle: 'Girls\' Generation',
        description: 'Conheça as integrantes do Girls\' Generation (SNSD) com perfis, carreira, músicas e curiosidades em português.',
        intro: [
            'Girls\' Generation, também conhecido como SNSD, é um dos grupos mais icônicos da segunda geração do K-Pop, com hits que marcaram gerações de fãs no mundo inteiro.',
            'Este hub organiza as integrantes públicas no HallyuHub, facilitando a navegação por perfis, carreiras individuais e contexto histórico do grupo.',
        ],
        keywords: ['integrantes do girls generation', 'membros snsd', 'girls generation kpop', 'snsd taeyeon yoona', 'soshi'],
        faq: [
            { question: 'Girls\' Generation ainda está ativa?', answer: 'Girls\' Generation celebrou seu 15º aniversário em 2022 com o álbum "Forever 1". As integrantes também mantêm carreiras solo ativas em música, atuação e entretenimento.' },
            { question: 'Por que o grupo também é chamado de SNSD?', answer: 'SNSD é a sigla do nome coreano do grupo, So Nyeo Shi Dae (소녀시대), que significa "Era das Garotas". Ambos os nomes são amplamente usados pela fanbase.' },
        ],
    },
    {
        slug: 'integrantes-do-red-velvet',
        kind: 'artists',
        groupSlug: 'red-velvet',
        title: 'Integrantes do Red Velvet',
        shortTitle: 'Red Velvet',
        description: 'Explore as integrantes do Red Velvet com perfis em português, carreira, músicas, conceitos e curiosidades.',
        intro: [
            'Red Velvet é um dos grupos mais versáteis do K-Pop, alternando entre o conceito "Red" (pop energético) e "Velvet" (R&B suave), com uma discografia que impressiona por qualidade e variedade.',
            'Este hub reúne as integrantes cadastradas no HallyuHub para quem quer descobrir perfis, carreira individual, músicas e conteúdos relacionados ao grupo.',
        ],
        keywords: ['integrantes do red velvet', 'membros red velvet', 'red velvet kpop', 'irene seulgi wendy joy yeri'],
        faq: [
            { question: 'Quem são as integrantes do Red Velvet?', answer: 'Red Velvet é formado por Irene, Seulgi, Wendy, Joy e Yeri, todas sob a SM Entertainment. Os perfis individuais no HallyuHub trazem detalhes de carreira, fotos e discografia.' },
            { question: 'O que significa o conceito Red e Velvet?', answer: '"Red" representa um lado pop, colorido e animado, enquanto "Velvet" traz uma sonoridade mais suave, R&B e sofisticada. A dualidade é marca registrada do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-shinee',
        kind: 'artists',
        groupSlug: 'shinee',
        title: 'Integrantes do SHINee',
        shortTitle: 'SHINee',
        description: 'Conheça os integrantes do SHINee com perfis em português, carreira, músicas, vídeos e curiosidades sobre o grupo.',
        intro: [
            'SHINee é um grupo icônico da segunda geração do K-Pop, reconhecido por vocais excepcionais, performances inovadoras e uma discografia que influenciou toda uma geração de artistas.',
            'Este hub reúne os integrantes públicos no HallyuHub para que fãs e novos descobridores possam explorar perfis, histórico e conexões do grupo.',
        ],
        keywords: ['integrantes do shinee', 'membros shinee', 'shinee kpop', 'onew key minho taemin'],
        faq: [
            { question: 'Quem são os integrantes do SHINee?', answer: 'SHINee é formado por Onew, Key, Minho e Taemin (quatro membros ativos). Jonghyun, um dos fundadores do grupo, faleceu em 2017 e é lembrado com carinho pela fanbase.' },
            { question: 'Os membros do SHINee têm carreiras solo?', answer: 'Sim. Todos os membros têm projetos individuais em música, atuação, MC e entretenimento. Taemin em particular tem uma das carreiras solo mais reconhecidas do K-Pop.' },
        ],
    },
    {
        slug: 'integrantes-do-mamamoo',
        kind: 'artists',
        groupSlug: 'mamamoo',
        title: 'Integrantes do MAMAMOO',
        shortTitle: 'MAMAMOO',
        description: 'Conheça as integrantes do MAMAMOO com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'MAMAMOO é conhecido por vocais excepcionais, personalidade forte e uma abordagem musical que foge dos padrões comuns do K-Pop.',
            'Este hub reúne as integrantes cadastradas no HallyuHub para navegar por perfis, carreira individual e conteúdos relacionados.',
        ],
        keywords: ['integrantes do mamamoo', 'membros mamamoo', 'mamamoo kpop', 'solar moonbyul wheein hwasa'],
        faq: [
            { question: 'Quem são as integrantes do MAMAMOO?', answer: 'MAMAMOO é formado por Solar, Moonbyul, Wheein e Hwasa, todas com projetos solo expressivos em música, shows e entretenimento.' },
            { question: 'As integrantes do MAMAMOO têm carreira solo?', answer: 'Sim. Todas as integrantes têm lançamentos solo, com destaque para Hwasa, que alcançou grande popularidade individual nacional e internacionalmente.' },
        ],
    },
    {
        slug: 'integrantes-do-got7',
        kind: 'artists',
        groupSlug: 'got7',
        title: 'Integrantes do GOT7',
        shortTitle: 'GOT7',
        description: 'Explore os integrantes do GOT7 com perfis em português, carreira, músicas, vídeos e curiosidades.',
        intro: [
            'GOT7 construiu uma base de fãs global leal com sua mistura de pop, hip-hop e R&B, e cada integrante manteve projetos individuais ativos após o reagrupamento independente.',
            'Este hub organiza os membros cadastrados no HallyuHub para quem quer explorar perfis, discografia e conexões do grupo.',
        ],
        keywords: ['integrantes do got7', 'membros got7', 'got7 kpop', 'mark jay b jackson jinyoung youngjae bambam yugyeom'],
        faq: [
            { question: 'O GOT7 voltou a atuar juntos?', answer: 'Sim. Após saírem da JYP Entertainment, os sete integrantes se reagruparam como grupo independente em 2022.' },
            { question: 'Quem são os integrantes do GOT7?', answer: 'GOT7 é formado por Mark, Jay B, Jackson, Jinyoung, Youngjae, BamBam e Yugyeom. Cada um tem projetos solo e os perfis no HallyuHub detalham suas trajetórias individuais.' },
        ],
    },
    {
        slug: 'integrantes-do-seventeen',
        kind: 'artists',
        groupSlug: 'seventeen',
        title: 'Integrantes do SEVENTEEN',
        shortTitle: 'SEVENTEEN',
        description: 'Conheça os integrantes do SEVENTEEN com perfis, carreira, músicas, unidades e curiosidades em português.',
        intro: [
            'SEVENTEEN é um dos maiores grupos de boy band da quarta geração, com treze integrantes divididos em três unidades: vocal, hip-hop e performance.',
            'Este hub organiza os membros cadastrados no HallyuHub para facilitar a navegação por perfis, histórico e atividades individuais.',
        ],
        keywords: ['integrantes do seventeen', 'membros seventeen', 'seventeen kpop', 'svt carats', 's.coups woozi'],
        faq: [
            { question: 'Quantos integrantes tem o SEVENTEEN?', answer: 'SEVENTEEN tem 13 integrantes: S.Coups, Jeonghan, Joshua, Jun, Hoshi, Wonwoo, Woozi, DK, Mingyu, The8, Seungkwan, Vernon e Dino.' },
            { question: 'O que são as unidades do SEVENTEEN?', answer: 'O grupo é dividido em três sub-unidades: Vocal Unit, Hip-hop Unit e Performance Unit, cada uma com lançamentos e shows próprios além das atividades coletivas.' },
        ],
    },
    {
        slug: 'integrantes-do-ateez',
        kind: 'artists',
        groupSlug: 'ateez',
        title: 'Integrantes do ATEEZ',
        shortTitle: 'ATEEZ',
        description: 'Explore os integrantes do ATEEZ com perfis em português, carreira, músicas, performances e curiosidades.',
        intro: [
            'ATEEZ ganhou reconhecimento internacional por performances intensas, narrativas visuais elaboradas e uma base de fãs chamada ATINY que cresce globalmente.',
            'Este hub organiza os membros cadastrados no HallyuHub para navegar por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do ateez', 'membros ateez', 'ateez kpop', 'atiny hongjoong mingi'],
        faq: [
            { question: 'Quem são os integrantes do ATEEZ?', answer: 'ATEEZ é formado por Hongjoong, Seonghwa, Yunho, Yeosang, San, Mingi, Wooyoung e Jongho, todos sob a KQ Entertainment.' },
            { question: 'Por que o ATEEZ é tão popular internacionalmente?', answer: 'O grupo é conhecido por shows ao vivo poderosos, conceitos cinematográficos e uma conexão muito próxima com os fãs, o que impulsionou seu crescimento fora da Coreia.' },
        ],
    },
    {
        slug: 'integrantes-do-enhypen',
        kind: 'artists',
        groupSlug: 'enhypen',
        title: 'Integrantes do ENHYPEN',
        shortTitle: 'ENHYPEN',
        description: 'Conheça os integrantes do ENHYPEN com perfis, carreira, músicas, vídeos e curiosidades em português.',
        intro: [
            'ENHYPEN surgiu do reality show I-Land e rapidamente se tornou um dos grupos mais comentados da quarta geração, com estética vampírica e músicas que misturam pop com dark concepts.',
            'Este hub reúne os membros cadastrados no HallyuHub para facilitar a descoberta de perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do enhypen', 'membros enhypen', 'enhypen kpop', 'engene jungwon jay heeseung'],
        faq: [
            { question: 'Como o ENHYPEN foi formado?', answer: 'O ENHYPEN foi formado em 2020 pelo reality show I-Land, produzido pela BELIFT LAB (joint venture da Big Hit e CJ ENM).' },
            { question: 'Quem são os integrantes do ENHYPEN?', answer: 'ENHYPEN é formado por Jungwon, Heeseung, Jay, Jake, Sunghoon, Sunoo e Ni-ki. Os perfis no HallyuHub trazem detalhes de cada integrante.' },
        ],
    },
    {
        slug: 'integrantes-do-zerobaseone',
        kind: 'artists',
        groupSlug: 'zerobaseone',
        title: 'Integrantes do ZEROBASEONE',
        shortTitle: 'ZEROBASEONE',
        description: 'Explore os integrantes do ZEROBASEONE (ZB1) com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'ZEROBASEONE surgiu do reality Boys Planet e conquistou uma fanbase fiel chamada ZEROx1 com música, performance e presença digital marcante.',
            'Este hub organiza os membros cadastrados no HallyuHub para facilitar a descoberta de perfis e conexões individuais.',
        ],
        keywords: ['integrantes do zerobaseone', 'membros zb1', 'zerobaseone kpop', 'boys planet zb1'],
        faq: [
            { question: 'Como o ZEROBASEONE foi formado?', answer: 'O grupo surgiu do reality show Boys Planet (2023), transmitido pela Mnet, com membros selecionados pela votação dos fãs.' },
            { question: 'Quem são os integrantes do ZEROBASEONE?', answer: 'ZEROBASEONE é formado por Sung Hanbin, Zhang Hao, Seok Matthew, Kim Jiwoong, Ricky, Kim Gyuvin, Park Gunwook, Han Yujin e Cha Woongki.' },
        ],
    },
    {
        slug: 'grupos-masculinos-kpop',
        kind: 'groups',
        title: 'Boy groups de K-Pop',
        shortTitle: 'Boy groups',
        description: 'Descubra boy groups de K-Pop com perfis de integrantes, discografia, fandom, carreira e curiosidades em português.',
        intro: [
            'Boy groups são um pilar do K-Pop: de BTS a Stray Kids, de SHINee a SEVENTEEN, cada grupo traz uma identidade própria que conecta fãs ao redor do mundo.',
            'Neste hub você encontra grupos masculinos com links para integrantes, músicas, vídeos e páginas relacionadas dentro do HallyuHub.',
        ],
        keywords: ['boy groups kpop', 'grupos masculinos kpop', 'boy bands coreanas', 'kpop masculino', 'integrantes boy group'],
        faq: [
            { question: 'O que é um boy group de K-Pop?', answer: 'É um grupo masculino da indústria coreana, normalmente formado por idols com foco em música, dança, performance e fandom ativo.' },
            { question: 'O hub inclui grupos de todas as gerações?', answer: 'Sim. A lista pode incluir grupos ativos ou encerrados de diferentes gerações do K-Pop, quando eles têm perfil e relevância no catálogo HallyuHub.' },
        ],
    },
    {
        slug: 'integrantes-do-exo',
        kind: 'artists',
        groupSlug: 'exo',
        title: 'Integrantes do EXO',
        shortTitle: 'EXO',
        description: 'Conheça os integrantes do EXO com perfis em português, carreira, músicas, sub-unidades e curiosidades.',
        intro: [
            'EXO é um dos grupos mais premiados da história do K-Pop, com um impacto enorme sobre toda a terceira geração e uma base de fãs global chamada EXO-L.',
            'Este hub reúne os membros cadastrados no HallyuHub para navegar por perfis, sub-unidades (EXO-K, EXO-M, EXO-CBX, EXO-SC) e atividades individuais.',
        ],
        keywords: ['integrantes do exo', 'membros exo', 'exo kpop', 'exo-l baekhyun kai sehun chanyeol', 'exo sm entertainment'],
        faq: [
            { question: 'Quem são os integrantes do EXO?', answer: 'A formação atual inclui Xiumin, Suho, Lay, Baekhyun, Chen, Chanyeol, D.O., Kai e Sehun. Kris, Luhan e Tao saíram do grupo. Os perfis no HallyuHub detalham cada trajetória.' },
            { question: 'O EXO ainda está ativo?', answer: 'Sim. O EXO continua em atividade, com lançamentos em grupo e projetos individuais expressivos de cada integrante em música, atuação e entretenimento.' },
            { question: 'O que são as sub-unidades do EXO?', answer: 'EXO tem várias sub-unidades: EXO-CBX (Chen, Baekhyun, Xiumin), EXO-SC (Sehun e Chanyeol) e os projetos solistas, cada um com lançamentos independentes.' },
        ],
    },
    {
        slug: 'integrantes-do-bigbang',
        kind: 'artists',
        groupSlug: 'bigbang',
        title: 'Integrantes do BIGBANG',
        shortTitle: 'BIGBANG',
        description: 'Explore os integrantes do BIGBANG com perfis em português, carreira solo, músicas e história do grupo.',
        intro: [
            'BIGBANG é considerado um dos grupos mais influentes do K-Pop, tendo definido o som e o estilo de toda uma era da música coreana.',
            'Este hub organiza os membros cadastrados no HallyuHub para quem quer explorar as trajetórias individuais de G-Dragon, T.O.P, Taeyang, Daesung e Seungri.',
        ],
        keywords: ['integrantes do bigbang', 'membros bigbang', 'bigbang kpop', 'gdragon taeyang top daesung', 'vip bigbang'],
        faq: [
            { question: 'Quem são os integrantes do BIGBANG?', answer: 'BIGBANG é formado por G-Dragon, T.O.P, Taeyang e Daesung (Seungri se desligou do grupo em 2019). Todos têm carreiras solo relevantes.' },
            { question: 'BIGBANG ainda está ativo?', answer: 'O grupo retomou atividades em 2022 após o cumprimento do serviço militar pelos integrantes, mas como quarteto.' },
        ],
    },
    {
        slug: 'integrantes-do-2ne1',
        kind: 'artists',
        groupSlug: '2ne1',
        title: 'Integrantes do 2NE1',
        shortTitle: '2NE1',
        description: 'Conheça as integrantes do 2NE1 com perfis em português, carreira após o grupo e legado no K-Pop.',
        intro: [
            '2NE1 foi um dos grupos mais revolucionários do K-Pop, combinando hip-hop, pop e R&B em um conceito agressivo e poderoso que abriu caminho para toda uma geração de girl groups.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis, carreira individual e o impacto duradouro do grupo.',
        ],
        keywords: ['integrantes do 2ne1', 'membros 2ne1', '2ne1 kpop', 'cl bom minzy dara', 'blackjack 2ne1'],
        faq: [
            { question: '2NE1 ainda está ativo?', answer: '2NE1 encerrou as atividades em 2016. As integrantes CL, Minzy, Park Bom e Sandara Park seguiram carreiras individuais. O grupo reuniu o quarteto completo em apresentações especiais.' },
            { question: 'Qual foi a influência do 2NE1 no K-Pop?', answer: '2NE1 ajudou a popularizar o K-Pop internacionalmente com um som e conceito únicos que influenciaram profundamente girl groups subsequentes como BLACKPINK e 4Minute.' },
        ],
    },
    {
        slug: 'integrantes-do-txt',
        kind: 'artists',
        groupSlug: 'txt',
        title: 'Integrantes do TXT',
        shortTitle: 'TXT',
        description: 'Explore os integrantes do TXT (TOMORROW X TOGETHER) com perfis, carreira, músicas e curiosidades em português.',
        intro: [
            'TXT, abreviação de TOMORROW X TOGETHER, é o segundo grupo masculino da HYBE (Big Hit), famoso por conceitos narrativos profundos e uma sonoridade que mistura pop alternativo com K-Pop.',
            'Este hub organiza os membros cadastrados no HallyuHub para facilitar a descoberta de perfis, discografia e atividades individuais.',
        ],
        keywords: ['integrantes do txt', 'membros tomorrow x together', 'txt kpop', 'yeonjun soobin beomgyu taehyun huening kai', 'moa txt'],
        faq: [
            { question: 'Quem são os integrantes do TXT?', answer: 'TXT é formado por Yeonjun, Soobin, Beomgyu, Taehyun e HueningKai, todos sob a HYBE Entertainment.' },
            { question: 'TXT é da mesma empresa do BTS?', answer: 'Sim. TXT é o segundo grupo masculino da HYBE (antiga Big Hit Entertainment), mesma empresa do BTS.' },
        ],
    },
    {
        slug: 'integrantes-do-nct',
        kind: 'artists',
        groupSlug: 'nct',
        title: 'Integrantes do NCT',
        shortTitle: 'NCT',
        description: 'Conheça os integrantes do NCT com perfis em português, sub-unidades, carreira, músicas e curiosidades.',
        intro: [
            'NCT é um grupo sem número fixo de integrantes, dividido em várias sub-unidades como NCT 127, NCT Dream, WayV e NCT U, cada uma com conceitos e músicas próprios.',
            'Este hub organiza os membros cadastrados no HallyuHub para facilitar a navegação por perfis e as diferentes unidades do grupo.',
        ],
        keywords: ['integrantes do nct', 'membros nct', 'nct kpop', 'nct 127 nct dream wayv', 'nctizen taeyong jaehyun'],
        faq: [
            { question: 'O que é o sistema de sub-unidades do NCT?', answer: 'NCT opera com unidades rotatórias — NCT 127 (base em Seul), NCT Dream (membros mais jovens), WayV (unidade chinesa) e NCT U (formação especial variável).' },
            { question: 'Quantos integrantes tem o NCT?', answer: 'O NCT tem mais de 20 integrantes ao todo, distribuídos entre as sub-unidades. A formação exata das unidades pode variar ao longo do tempo.' },
        ],
    },
    {
        slug: 'integrantes-do-itzy',
        kind: 'artists',
        groupSlug: 'itzy',
        title: 'Integrantes do ITZY',
        shortTitle: 'ITZY',
        description: 'Conheça as integrantes do ITZY com perfis, carreira, músicas, vídeos e curiosidades em português.',
        intro: [
            'ITZY se destacou na quarta geração com mensagens de autoconfiança, coreografias energéticas e um conceito "ser você mesmo" que conquistou fãs globalmente.',
            'Este hub reúne as integrantes cadastradas no HallyuHub para navegar por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do itzy', 'membros itzy', 'itzy kpop', 'yeji lia ryujin chaeryeong yuna', 'midzy itzy'],
        faq: [
            { question: 'Quem são as integrantes do ITZY?', answer: 'ITZY é formado por Yeji, Lia, Ryujin, Chaeryeong e Yuna, todas sob a JYP Entertainment.' },
            { question: 'O que o nome ITZY significa?', answer: 'ITZY representa "있지" (it-ji) em coreano, que significa "eu tenho o que você está procurando", reforçando a mensagem de autoconfiança do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-g-i-dle',
        kind: 'artists',
        groupSlug: 'i-dle',
        title: 'Integrantes do (G)I-DLE',
        shortTitle: '(G)I-DLE',
        description: 'Explore as integrantes do (G)I-DLE com perfis, carreira, músicas produzidas pelo grupo e curiosidades em português.',
        intro: [
            '(G)I-DLE chama atenção pela autoprodução musical — integrantes como Soyeon participam ativamente da criação das músicas — e por um conceito poderoso e versátil.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para facilitar a descoberta de perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do gidle', 'membros g i dle', 'gidle kpop', 'soyeon minnie miyeon yuqi shuhua', 'neverland gidle'],
        faq: [
            { question: 'Quem são as integrantes do (G)I-DLE?', answer: 'Após a saída de Soojin, (G)I-DLE é formado por Miyeon, Minnie, Soyeon, Yuqi e Shuhua, sob a Cube Entertainment.' },
            { question: 'O que diferencia o (G)I-DLE de outros girl groups?', answer: 'Soyeon, líder e principal compositora, produz e escreve a maior parte das músicas do grupo, dando ao (G)I-DLE uma identidade musical própria rara no K-Pop feminino.' },
        ],
    },
    {
        slug: 'integrantes-do-super-junior',
        kind: 'artists',
        groupSlug: 'super-junior',
        title: 'Integrantes do Super Junior',
        shortTitle: 'Super Junior',
        description: 'Conheça os integrantes do Super Junior com perfis em português, carreira, músicas e história do grupo.',
        intro: [
            'Super Junior foi um dos grupos pioneiros no sucesso internacional do K-Pop, ajudando a construir a Hallyu Wave com hits como "Sorry Sorry" e "Bonamana".',
            'Este hub reúne os membros cadastrados no HallyuHub para navegar por perfis, sub-unidades e a longa trajetória do grupo.',
        ],
        keywords: ['integrantes do super junior', 'membros super junior', 'suju kpop', 'leeteuk heechul kangin eunhyuk', 'elf super junior'],
        faq: [
            { question: 'Super Junior ainda está ativo?', answer: 'Sim. Super Junior continua ativo com lançamentos regulares e shows ao vivo, mesmo com os integrantes equilibrando atividades em grupo e carreiras individuais.' },
            { question: 'Quantos integrantes tem o Super Junior?', answer: 'A formação original tinha 13 integrantes. Kyuhyun, Leeteuk, Heechul, Yesung, Shindong, Donghae, Eunhyuk, Siwon e Ryeowook são os mais ativos atualmente.' },
        ],
    },
    {
        slug: 'integrantes-do-kep1er',
        kind: 'artists',
        groupSlug: 'kep1er',
        title: 'Integrantes do Kep1er',
        shortTitle: 'Kep1er',
        description: 'Conheça as integrantes do Kep1er com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'Kep1er surgiu do reality Mnet Girls Planet 999 com nove integrantes de diferentes países, trazendo diversidade e energia pop para a quarta geração do K-Pop.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para facilitar a descoberta de perfis e conexões.',
        ],
        keywords: ['integrantes do kep1er', 'membros kep1er', 'kep1er kpop', 'girls planet 999', 'kep1ian'],
        faq: [
            { question: 'Como o Kep1er foi formado?', answer: 'Kep1er foi formado em 2021 através do reality show Mnet Girls Planet 999, com as nove integrantes mais votadas pelo público global.' },
            { question: 'O Kep1er ainda está ativo?', answer: 'O contrato original do Kep1er era de dois anos e meio. As integrantes podem seguir carreiras individuais ou novas atividades após o período de contrato.' },
        ],
    },
    {
        slug: 'integrantes-do-loona',
        kind: 'artists',
        groupSlug: 'loona',
        title: 'Integrantes do LOONA',
        shortTitle: 'LOONA',
        description: 'Explore as integrantes do LOONA com perfis em português, sub-unidades, carreira, músicas e curiosidades.',
        intro: [
            'LOONA ficou famosa por um debut conceitual único — cada integrante foi apresentada individualmente durante dois anos antes do grupo se formar — criando uma das narrativas mais elaboradas do K-Pop.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para facilitar a descoberta de perfis e do universo criativo do grupo.',
        ],
        keywords: ['integrantes do loona', 'membros loona', 'loona kpop', 'orbit loona', 'loonaverse'],
        faq: [
            { question: 'Como foi o debut do LOONA?', answer: 'LOONA debutou de forma gradual entre 2016 e 2018, com cada uma das 12 integrantes recebendo um mini-álbum solo antes da formação completa do grupo.' },
            { question: 'LOONA ainda está ativo?', answer: 'Após saída de várias integrantes e mudança de empresa, o grupo passou por reformulações. Alguns membros continuam sob o nome LOONA ou em projetos individuais.' },
        ],
    },
    {
        slug: 'integrantes-do-apink',
        kind: 'artists',
        groupSlug: 'apink',
        title: 'Integrantes do Apink',
        shortTitle: 'Apink',
        description: 'Conheça as integrantes do Apink com perfis em português, carreira, músicas e história do grupo.',
        intro: [
            'Apink é um dos grupos femininos mais duradouros do K-Pop, com mais de uma década de atividade, hit após hit e uma evolução de conceito do doce para o maduro.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis, discografia individual e história do grupo.',
        ],
        keywords: ['integrantes do apink', 'membros apink', 'apink kpop', 'bomi eunji hayoung namjoo chorong', 'panda apink'],
        faq: [
            { question: 'Apink ainda está ativo?', answer: 'Sim. Apink comemorou mais de 10 anos de carreira e segue com atividades em grupo e projetos individuais, com destaque para Jung Eunji, que também tem carreira de atriz.' },
            { question: 'Qual foi o maior hit do Apink?', answer: '"Mr. Chu" e "LUV" são os hits mais conhecidos, mas o grupo é querido por uma discografia consistente que evoluiu junto com sua fanbase.' },
        ],
    },
    {
        slug: 'integrantes-do-sistar',
        kind: 'artists',
        groupSlug: 'sistar',
        title: 'Integrantes do SISTAR',
        shortTitle: 'SISTAR',
        description: 'Veja as integrantes do SISTAR com perfis em português, carreira, músicas e legado no K-Pop.',
        intro: [
            'SISTAR foi um dos grupos femininos mais populares da segunda geração, dominando os charts de verão com hits inesquecíveis como "Touch My Body" e "Shake It".',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e o legado musical do grupo.',
        ],
        keywords: ['integrantes do sistar', 'membros sistar', 'sistar kpop', 'hyolyn bora dasom soyou'],
        faq: [
            { question: 'SISTAR ainda está ativo?', answer: 'SISTAR encerrou as atividades em 2017, mas as integrantes seguiram carreiras individuais. Hyolyn em particular tem uma das carreiras solo mais bem-sucedidas do K-Pop.' },
            { question: 'Por que o SISTAR era famoso?', answer: 'SISTAR era conhecido por hits de verão, coreografias sensuais e vocais fortes, especialmente de Hyolyn e Soyou, que também lançaram músicas em dupla.' },
        ],
    },
    {
        slug: 'integrantes-do-gfriend',
        kind: 'artists',
        groupSlug: 'gfriend',
        title: 'Integrantes do GFRIEND',
        shortTitle: 'GFRIEND',
        description: 'Conheça as integrantes do GFRIEND com perfis em português, carreira após o grupo e legado no K-Pop.',
        intro: [
            'GFRIEND marcou a terceira geração com suas coreografias sincronizadas, concept escolar/fantástico e uma fanbase chamada Buddy muito dedicada.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e atividades pós-grupo.',
        ],
        keywords: ['integrantes do gfriend', 'membros gfriend', 'gfriend kpop', 'sowon yerin eunha sinb umji yuju', 'buddy gfriend'],
        faq: [
            { question: 'GFRIEND ainda está ativo?', answer: 'GFRIEND encerrou as atividades em 2021 após não renovar contrato com a Source Music. As seis integrantes seguiram caminhos individuais em novas agências.' },
            { question: 'Qual era o concept do GFRIEND?', answer: 'GFRIEND era famoso por um conceito misto entre school-girl e dark fantasy, com coreografias complexas e vocais harmoniosos muito apreciados pelos fãs.' },
        ],
    },
    // ── Novos hubs — rodada 3 ─────────────────────────────────────
    {
        slug: 'integrantes-do-monsta-x',
        kind: 'artists',
        groupSlug: 'monsta-x',
        title: 'Integrantes do MONSTA X',
        shortTitle: 'MONSTA X',
        description: 'Conheça os integrantes do MONSTA X com perfis em português, carreira, discografia e curiosidades do grupo.',
        intro: [
            'MONSTA X é um dos grupos masculinos mais energéticos do K-Pop, reconhecido por performances intensas, batidas pesadas e uma fanbase Monbebe apaixonada ao redor do mundo.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para explorar perfis individuais, carreiras solo e a trajetória do grupo desde o reality Show Me the Money.',
        ],
        keywords: ['integrantes do monsta x', 'membros monsta x', 'monsta x kpop', 'shownu minhyuk kihyun hyungwon joohoney im changkyun', 'monbebe'],
        faq: [
            { question: 'MONSTA X ainda está ativo?', answer: 'Sim. MONSTA X continua ativo com shows internacionais, mas a formação mudou ao longo dos anos. Wonho saiu em 2019 para seguir carreira solo de sucesso.' },
            { question: 'Como o MONSTA X surgiu?', answer: 'O grupo foi formado em 2015 pelo reality "NO.MERCY" da Starship Entertainment, que selecionou os integrantes por eliminação diante de câmeras.' },
        ],
    },
    {
        slug: 'integrantes-do-vixx',
        kind: 'artists',
        groupSlug: 'vixx',
        title: 'Integrantes do VIXX',
        shortTitle: 'VIXX',
        description: 'Veja os integrantes do VIXX com perfis em português, carreira, conceitos marcantes e curiosidades do grupo.',
        intro: [
            'VIXX é pioneiro nos chamados "concept-dols" do K-Pop, sendo reconhecido por conceitos teatrais e sombrios como robots, vampiros e divindades gregas, sempre com performances marcantes.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis, solos e o legado artístico do grupo.',
        ],
        keywords: ['integrantes do vixx', 'membros vixx', 'vixx kpop', 'n leo ken ravi hongbin hyuk', 'starlight vixx'],
        faq: [
            { question: 'VIXX ainda está ativo?', answer: 'VIXX segue ativo como grupo, com atividades esporádicas, mas os integrantes têm focado em projetos individuais como atuação, serviço militar e carreiras solo.' },
            { question: 'Por que o VIXX é único no K-Pop?', answer: 'VIXX se destacou pelo storytelling visual dos MVs e conceitos completamente distintos a cada comeback, algo incomum na época, o que os tornou referência em concept groups.' },
        ],
    },
    {
        slug: 'integrantes-do-btob',
        kind: 'artists',
        groupSlug: 'btob',
        title: 'Integrantes do BTOB',
        shortTitle: 'BTOB',
        description: 'Conheça os integrantes do BTOB com perfis em português, carreira solo, músicas e curiosidades do grupo.',
        intro: [
            'BTOB é celebrado pela harmonia vocal excepcional, humor cativante e músicas emotivas que atravessam gerações de fãs — a fanbase Melody é uma das mais leais do K-Pop.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para explorar perfis, projetos solo e a discografia do grupo.',
        ],
        keywords: ['integrantes do btob', 'membros btob', 'btob kpop', 'eunkwang minhyuk changsub hyunsik peniel ilhoon sungjae', 'melody btob'],
        faq: [
            { question: 'BTOB ainda está ativo?', answer: 'Sim. BTOB voltou a atuar em conjunto após os retornos do serviço militar e celebrou mais de uma década de carreira com shows e lançamentos recentes.' },
            { question: 'Qual é a especialidade musical do BTOB?', answer: 'BTOB é conhecido por baladas poderosas e harmonias vocais a cappella, o que os diferencia de grupos focados em dança. Sungjae também construiu uma carreira sólida como ator.' },
        ],
    },
    {
        slug: 'integrantes-do-day6',
        kind: 'artists',
        groupSlug: 'day6',
        title: 'Integrantes do DAY6',
        shortTitle: 'DAY6',
        description: 'Veja os integrantes do DAY6 com perfis em português, instrumentos, músicas e curiosidades do grupo.',
        intro: [
            'DAY6 é um dos poucos grupos de K-Pop que toca instrumentos ao vivo, misturando influências de rock, pop e indie em uma discografia autoral invejável.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para explorar perfis, projetos solo e a trajetória de uma das bandas mais respeitadas da JYP Entertainment.',
        ],
        keywords: ['integrantes do day6', 'membros day6', 'day6 kpop', 'jae young k wonpil dowoon', 'my day day6'],
        faq: [
            { question: 'DAY6 toca instrumentos de verdade?', answer: 'Sim. DAY6 é reconhecido no K-Pop justamente por tocar guitarra, bateria, teclado e baixo nas performances, o que os coloca num patamar diferente dos grupos de dança convencionais.' },
            { question: 'DAY6 ainda está ativo?', answer: 'Sim. O grupo seguiu ativo mesmo durante os períodos de serviço militar dos integrantes, lançando músicas e promovendo shows regularmente.' },
        ],
    },
    {
        slug: 'integrantes-do-t-ara',
        kind: 'artists',
        groupSlug: 't-ara',
        title: 'Integrantes do T-ARA',
        shortTitle: 'T-ARA',
        description: 'Conheça as integrantes do T-ARA com perfis em português, hits, carreira e legado no K-Pop.',
        intro: [
            'T-ARA foi um dos maiores grupos femininos da segunda geração do K-Pop, responsável por hits virais como "Roly-Poly", "Bo Peep Bo Peep" e "Lovey-Dovey" que ainda dominam playlists retrô.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e o legado musical do grupo na era dourada do K-Pop.',
        ],
        keywords: ['integrantes do t-ara', 'membros t-ara', 't-ara kpop', 'qri eunjung hyomin soyeon jiyeon boram', 'queens t-ara'],
        faq: [
            { question: 'T-ARA ainda está ativo?', answer: 'T-ARA fez comebacks ocasionais após um período de hiato e controvérsias que abalaram o grupo no início dos anos 2010. As integrantes continuaram com projetos individuais, especialmente na China.' },
            { question: 'Qual foi o maior hit do T-ARA?', answer: '"Roly-Poly" e "Lovey-Dovey" são os maiores hits do grupo, mas "Bo Peep Bo Peep" é provavelmente o mais memorável pela coreografia de dança felina que viralizou no YouTube.' },
        ],
    },
    {
        slug: 'integrantes-do-exid',
        kind: 'artists',
        groupSlug: 'exid',
        title: 'Integrantes do EXID',
        shortTitle: 'EXID',
        description: 'Veja as integrantes do EXID com perfis em português, hits, carreira e curiosidades do grupo.',
        intro: [
            'EXID ficou famoso por um fenômeno incomum: "Up & Down" foi lançado sem sucesso e meses depois um fancam de Hani viralizou, transformando o grupo em estrelas da noite para o dia.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a trajetória singular desse grupo.',
        ],
        keywords: ['integrantes do exid', 'membros exid', 'exid kpop', 'solji hani LE hyerin jeonghwa', 'up down exid'],
        faq: [
            { question: 'EXID ainda está ativo?', answer: 'EXID entrou em hiato em 2019 e as integrantes seguiram carreiras individuais. Solji tem atividades como cantora solo, e Hani e Jeonghwa são presença constante na mídia.' },
            { question: 'Como o EXID ficou famoso?', answer: 'A fama do EXID veio de um fancam viral da Hani dançando "Up & Down" que acumulou milhões de views, reativando as vendas do single meses após o lançamento sem sucesso.' },
        ],
    },
    {
        slug: 'integrantes-do-wonder-girls',
        kind: 'artists',
        groupSlug: 'wonder-girls',
        title: 'Integrantes do Wonder Girls',
        shortTitle: 'Wonder Girls',
        description: 'Conheça as integrantes do Wonder Girls com perfis em português, hits retro, carreira e legado no K-Pop.',
        intro: [
            'Wonder Girls foi o primeiro grupo de K-Pop a entrar na Billboard Hot 100 com "Nobody", abrindo caminho para a expansão do K-Pop além da Ásia no final dos anos 2000.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis, a discografia retrô do grupo e seus projetos individuais.',
        ],
        keywords: ['integrantes do wonder girls', 'membros wonder girls', 'wonder girls kpop', 'sunmi yubin yenny hyuna sohee', 'nobody wonder girls'],
        faq: [
            { question: 'Wonder Girls ainda está ativo?', answer: 'Wonder Girls encerrou atividades em 2017. Sunmi se tornou uma das artistas solo mais bem-sucedidas do K-Pop, e outras integrantes seguiram carreiras individuais.' },
            { question: 'Por que Wonder Girls é histórico?', answer: 'O grupo foi pioneiro na tentativa de penetrar o mercado americano e a primeira boyband/girl group coreano a entrar na Billboard Hot 100, em 2009, com "Nobody".' },
        ],
    },
    {
        slug: 'integrantes-do-ft-island',
        kind: 'artists',
        groupSlug: 'ft-island',
        title: 'Integrantes do FT Island',
        shortTitle: 'FT Island',
        description: 'Veja os integrantes do FT Island com perfis em português, carreira, músicas e história do grupo.',
        intro: [
            'FT Island é uma das bandas de rock mais populares do K-Pop, com instrumentos ao vivo, vocais potentes de Hongki e uma base de fãs Pri♥ncesses muito leal.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis, discografia e projetos individuais.',
        ],
        keywords: ['integrantes do ft island', 'membros ft island', 'ft island kpop', 'hongki jaejin minhwan jonghun seunghyun', 'primadonnas ft island'],
        faq: [
            { question: 'FT Island ainda está ativo?', answer: 'FT Island segue ativo, embora com atividades menos frequentes após as saídas e serviços militares. Hongki continua sendo um dos vocalistas mais aclamados do K-Pop.' },
            { question: 'FT Island toca instrumentos ao vivo?', answer: 'Sim. FT Island é uma banda no sentido literal — guitarras, baixo e bateria ao vivo, o que os diferencia da maioria dos grupos de idol do K-Pop.' },
        ],
    },
    {
        slug: 'integrantes-do-cnblue',
        kind: 'artists',
        groupSlug: 'cnblue',
        title: 'Integrantes do CNBLUE',
        shortTitle: 'CNBLUE',
        description: 'Conheça os integrantes do CNBLUE com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'CNBLUE é uma banda de rock alternativo formada pela FNC Entertainment que combina o charme dos idols com habilidade musical real, ficando famosa pela guitarra de Jung Yong-hwa e sua carreira paralela como ator.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia que mistura rock, pop e música original.',
        ],
        keywords: ['integrantes do cnblue', 'membros cnblue', 'cnblue kpop', 'yonghwa jungshin minhyuk jonghyun', 'boice cnblue'],
        faq: [
            { question: 'CNBLUE ainda está ativo?', answer: 'CNBLUE retomou atividades após os retornos do serviço militar. Jung Yong-hwa em particular tem presença ativa como artista solo e ator.' },
            { question: 'O que significa CNBLUE?', answer: 'O nome CNBLUE vem de "Code Name Blue" e reflete a identidade musical da banda — uma mistura de influências de rock indie e pop coreano com identidade própria.' },
        ],
    },
    {
        slug: 'integrantes-do-infinite',
        kind: 'artists',
        groupSlug: 'infinite',
        title: 'Integrantes do INFINITE',
        shortTitle: 'INFINITE',
        description: 'Veja os integrantes do INFINITE com perfis em português, carreira, músicas e legado no K-Pop.',
        intro: [
            'INFINITE é uma lenda da segunda geração do K-Pop, reconhecido por coreografias perfeitamente sincronizadas, o hit "The Chaser" e uma discografia consistente pela Woolim Entertainment.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis, solos e o legado do grupo que influenciou toda uma geração.',
        ],
        keywords: ['integrantes do infinite', 'membros infinite', 'infinite kpop', 'sunggyu dongwoo woohyun hoya sungyeol myungsoo sungjong', 'inspirit infinite'],
        faq: [
            { question: 'INFINITE ainda está ativo?', answer: 'INFINITE completou os serviços militares e voltou a atuar como grupo. Nem todos os membros originais seguem, mas o núcleo do grupo permanece ativo.' },
            { question: 'Por que INFINITE é tão respeitado?', answer: 'INFINITE ficou famoso pela precisão das coreografias em grupo — os membros dançavam com milímetros de diferença, algo que se tornou uma marca registrada do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-block-b',
        kind: 'artists',
        groupSlug: 'block-b',
        title: 'Integrantes do Block B',
        shortTitle: 'Block B',
        description: 'Conheça os integrantes do Block B com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'Block B trouxe um estilo irreverente e muitas vezes provocador ao K-Pop, com Zico como líder-compositor e uma identidade musical que mistura hip-hop, R&B e humor ácido.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis, projetos solo — Zico em particular construiu uma das maiores carreiras solo do K-Pop.',
        ],
        keywords: ['integrantes do block b', 'membros block b', 'block b kpop', 'zico taeil b-bomb jaehyo u-kwon kyung p.o', 'bbc block b'],
        faq: [
            { question: 'Block B ainda está ativo?', answer: 'Block B está em hiato, com os membros em atividades individuais. Zico é um dos produtores e artistas mais influentes do hip-hop coreano atual.' },
            { question: 'O que torna o Block B único?', answer: 'Block B combina letras criativas com performance enérgica e um senso de humor coletivo que aparece em shows ao vivo. Zico também compõe para o grupo, o que dá autenticidade musical.' },
        ],
    },
    {
        slug: 'integrantes-do-b1a4',
        kind: 'artists',
        groupSlug: 'b1a4',
        title: 'Integrantes do B1A4',
        shortTitle: 'B1A4',
        description: 'Veja os integrantes do B1A4 com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'B1A4 é querido pelos fãs pela personalidade genuína dos membros, músicas alegres e a longevidade de uma carreira baseada em composição própria desde os primeiros anos.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e o percurso de um dos grupos mais duradouros da geração.',
        ],
        keywords: ['integrantes do b1a4', 'membros b1a4', 'b1a4 kpop', 'jinyoung cnu sandeul baro gongchan', 'bana b1a4'],
        faq: [
            { question: 'B1A4 ainda está ativo?', answer: 'B1A4 continuou ativo após serviços militares, com lançamentos regulares e uma fanbase BANA leal que acompanha o grupo desde o debut em 2011.' },
            { question: 'O que significa B1A4?', answer: 'O nome vem dos tipos sanguíneos dos integrantes — um membro com tipo B e quatro com tipo A, uma curiosidade que virou identidade de marca do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-bap',
        kind: 'artists',
        groupSlug: 'bap',
        title: 'Integrantes do B.A.P',
        shortTitle: 'B.A.P',
        description: 'Conheça os integrantes do B.A.P com perfis em português, carreira, músicas e legado no K-Pop.',
        intro: [
            'B.A.P debutou em 2012 com um impacto imediato: performance poderosa, visual agressivo e Yongguk como produtor e rapper dominante que diferenciou o grupo desde o primeiro single.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a trajetória marcante do grupo que ficou famoso também por processar a própria agência.',
        ],
        keywords: ['integrantes do bap', 'membros bap', 'b.a.p kpop', 'yongguk himchan daehyun youngjae jongup zelo', 'babyz bap'],
        faq: [
            { question: 'B.A.P ainda está ativo?', answer: 'B.A.P encerrou atividades oficialmente em 2019 após disputas com a TS Entertainment. Os membros seguiram carreiras individuais, com destaque para Yongguk como produtor independente.' },
            { question: 'Por que B.A.P processa a agência foi importante?', answer: 'Em 2014, o B.A.P processou a TS Entertainment por condições abusivas de trabalho — um marco raro na indústria que abriu debate sobre os direitos dos idols coreanos.' },
        ],
    },
    {
        slug: 'integrantes-do-oh-my-girl',
        kind: 'artists',
        groupSlug: 'oh-my-girl',
        title: 'Integrantes do OH MY GIRL',
        shortTitle: 'OH MY GIRL',
        description: 'Veja as integrantes do OH MY GIRL com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'OH MY GIRL é celebrado por conceitos encantadores e musicalmente ricos, com hits como "Nonstop" e "Dun Dun Dance" que conquistaram charts e novos fãs anos após o debut.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia colorida desse grupo da WM Entertainment.',
        ],
        keywords: ['integrantes do oh my girl', 'membros oh my girl', 'oh my girl kpop', 'hyojung mimi yooa arin jiho seunghee binnie', 'miracle oh my girl'],
        faq: [
            { question: 'OH MY GIRL ainda está ativo?', answer: 'Sim. OH MY GIRL continua ativo com lançamentos regulares e é um dos grupos femininos mais consistentes da geração atual, com crescimento de popularidade constante.' },
            { question: 'Qual é o conceito do OH MY GIRL?', answer: 'OH MY GIRL ficou conhecido pelo conceito "fantasia da vida cotidiana" — MVs com elementos mágicos, narrativas envolventes e visuais coloridos que se tornaram sua assinatura.' },
        ],
    },
    {
        slug: 'integrantes-do-miss-a',
        kind: 'artists',
        groupSlug: 'miss-a',
        title: 'Integrantes do miss A',
        shortTitle: 'miss A',
        description: 'Conheça as integrantes do miss A com perfis em português, carreira, músicas e história do grupo.',
        intro: [
            'miss A foi o grupo que lançou Suzy ao estrelato — e juntos deixaram hits como "Bad Girl Good Girl" e "Hush" que definiram uma estética única misturando atitude e charme feminino.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a trajetória do grupo que consolidou a JYP Entertainment no segmento feminino.',
        ],
        keywords: ['integrantes do miss a', 'membros miss a', 'miss a kpop', 'suzy min fei jia', 'bad girl good girl miss a'],
        faq: [
            { question: 'miss A ainda está ativo?', answer: 'miss A encerrou atividades em 2017. Suzy se tornou uma das atrizes mais populares da Coreia, e as outras integrantes seguiram carreiras individuais na música e atuação.' },
            { question: 'Por que Suzy é tão famosa?', answer: 'Suzy ganhou visibilidade com o drama "Dream High" e se tornou uma das "Nation\'s First Love" da Coreia — uma mulher cujo charme é amplamente percebido como inatingível e cativante.' },
        ],
    },
    {
        slug: 'integrantes-do-dreamcatcher',
        kind: 'artists',
        groupSlug: 'dreamcatcher',
        title: 'Integrantes do Dreamcatcher',
        shortTitle: 'Dreamcatcher',
        description: 'Veja as integrantes do Dreamcatcher com perfis em português, conceito dark, músicas e trajetória do grupo.',
        intro: [
            'Dreamcatcher é pioneiro no K-Pop de conceito dark rock feminino, misturando sonoridades de metal e rock alternativo com performances atmosféricas únicas na indústria.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e uma discografia que desafia as convenções estéticas do K-Pop feminino.',
        ],
        keywords: ['integrantes do dreamcatcher', 'membros dreamcatcher', 'dreamcatcher kpop', 'jiu siyeon handong yoohyeon dami sua gahyeon', 'insomnia dreamcatcher'],
        faq: [
            { question: 'Dreamcatcher ainda está ativo?', answer: 'Sim. Dreamcatcher é um dos grupos femininos mais ativos no circuito internacional, com grande base de fãs Insomnia no Brasil, Europa e América Latina.' },
            { question: 'O que torna o Dreamcatcher diferente?', answer: 'Dreamcatcher usa rock e metal como base musical — uma raridade no K-Pop feminino — e mantém uma narrativa contínua de universo de pesadelos ao longo de seus álbuns.' },
        ],
    },
    {
        slug: 'integrantes-do-wanna-one',
        kind: 'artists',
        groupSlug: 'wanna-one',
        title: 'Integrantes do Wanna One',
        shortTitle: 'Wanna One',
        description: 'Conheça os integrantes do Wanna One com perfis em português, carreira, hits e trajetória do grupo.',
        intro: [
            'Wanna One foi formado pelo reality Produce 101 Season 2 e debutou em 2017 como um dos grupos temporários mais bem-sucedidos da história do K-Pop, com 11 integrantes escolhidos por votação pública.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e o legado de um grupo que existiu apenas até 2019, mas deixou uma marca inesquecível.',
        ],
        keywords: ['integrantes do wanna one', 'membros wanna one', 'wanna one kpop', 'kang daniel park jihoon lee daehwi', 'wannable wanna one'],
        faq: [
            { question: 'Wanna One ainda está ativo?', answer: 'Wanna One era um grupo com prazo determinado e encerrou em 2019. Os membros seguiram carreira individual — Kang Daniel é o mais conhecido, com grande fanbase solo.' },
            { question: 'Como o Wanna One foi formado?', answer: 'O grupo surgiu do reality show "Produce 101 Season 2" da Mnet, onde o público votou nos 11 integrantes que formariam o grupo por um período de aproximadamente 18 meses.' },
        ],
    },
    {
        slug: 'integrantes-do-stayc',
        kind: 'artists',
        groupSlug: 'stayc',
        title: 'Integrantes do STAYC',
        shortTitle: 'STAYC',
        description: 'Veja as integrantes do STAYC com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'STAYC chegou ao K-Pop em 2020 com um som nostálgico e moderno ao mesmo tempo — produzido por Black Eyed Pilseung, responsável por hits de TWICE e AOA, o grupo conquista pela melodia e visual marcante.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia crescente do grupo.',
        ],
        keywords: ['integrantes do stayc', 'membros stayc', 'stayc kpop', 'sumin sieun isa seeun yoon j', 'swith stayc'],
        faq: [
            { question: 'STAYC ainda está ativo?', answer: 'Sim. STAYC é um dos grupos mais ativos da nova geração feminina, com comebacks frequentes e uma base de fãs SWITH crescendo rapidamente na Ásia e internacionalmente.' },
            { question: 'Quem produz as músicas do STAYC?', answer: 'A maioria das músicas é produzida pela dupla Black Eyed Pilseung (Hwang Hyun e Choi Kyu-sung), conhecidos por criar hits de dance-pop para grandes artistas do K-Pop.' },
        ],
    },
    {
        slug: 'integrantes-do-riize',
        kind: 'artists',
        groupSlug: 'riize',
        title: 'Integrantes do RIIZE',
        shortTitle: 'RIIZE',
        description: 'Conheça os integrantes do RIIZE com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'RIIZE debutou em 2023 como o novo boy group da SM Entertainment, reunindo Shotaro e Sungchan (ex-SuperM/NCT) e rapidamente conquistou visibilidade global com "Get a Guitar" e "Siren".',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e o universo do grupo que chega para renovar o line-up de boy groups da SM.',
        ],
        keywords: ['integrantes do riize', 'membros riize', 'riize kpop', 'shotaro sungchan eunseok seunghan anton wonbin sohee', 'briize riize'],
        faq: [
            { question: 'RIIZE é da mesma empresa que EXO e NCT?', answer: 'Sim. RIIZE é da SM Entertainment, mesma empresa de EXO, NCT, SHINee e TVXQ. O grupo foi anunciado como o próximo grande boy group da companhia.' },
            { question: 'Quem são os ex-NCT no RIIZE?', answer: 'Shotaro e Sungchan fizeram parte do NCT e do SuperM antes de debutar no RIIZE, trazendo experiência de performance e fanbase consolidada para o novo grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-nct-127',
        kind: 'artists',
        groupSlug: 'nct-127',
        title: 'Integrantes do NCT 127',
        shortTitle: 'NCT 127',
        description: 'Veja os integrantes do NCT 127 com perfis em português, carreira, músicas e curiosidades do subgrupo.',
        intro: [
            'NCT 127 é a unidade baseada em Seul do NCT, com um som mais agressivo e conceito urbano que combina rap pesado, vocais explosivos e performances de alto impacto visual.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia do subgrupo que lidera a presença internacional do NCT.',
        ],
        keywords: ['integrantes do nct 127', 'membros nct 127', 'nct 127 kpop', 'taeyong taeil johnny yuta doyoung jaehyun jungwoo mark haechan', 'nctzen nct 127'],
        faq: [
            { question: 'O que significa 127 no nome NCT 127?', answer: '127 é a longitude de Seul (127°E), indicando que essa unidade é baseada na capital coreana. NCT tem outras unidades baseadas em diferentes cidades do mundo.' },
            { question: 'NCT 127 lança músicas diferentes do NCT Dream?', answer: 'Sim. NCT 127 tem um conceito mais dark e de hip-hop urbano, enquanto NCT Dream é mais jovem e descontraído — cada subunidade do NCT tem identidade sonora própria.' },
        ],
    },
    {
        slug: 'integrantes-do-nct-dream',
        kind: 'artists',
        groupSlug: 'nct-dream',
        title: 'Integrantes do NCT Dream',
        shortTitle: 'NCT Dream',
        description: 'Conheça os integrantes do NCT Dream com perfis em português, carreira, músicas e trajetória do subgrupo.',
        intro: [
            'NCT Dream é a unidade jovem do NCT, com um conceito de energia e frescor que representa os anos escolares — Mark e Haechan são os membros mais duradouros e mais queridos pelos fãs.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia repleta de hits pop do subgrupo.',
        ],
        keywords: ['integrantes do nct dream', 'membros nct dream', 'nct dream kpop', 'mark renjun jeno haechan jaemin chenle jisung', 'nctzen dream'],
        faq: [
            { question: 'NCT Dream tem membros rotativos?', answer: 'NCT Dream foi criado com o conceito de que os membros sairiam ao completar 20 anos, mas a SM abandonou a rotatividade e o grupo manteve formação fixa desde 2019.' },
            { question: 'Qual é o maior hit do NCT Dream?', answer: '"Candy", "Chewing Gum", "Hot Sauce" e "Glitch Mode" estão entre os maiores sucessos, com "Candy" sendo uma das músicas de Natal mais populares do K-Pop.' },
        ],
    },
    {
        slug: 'integrantes-do-wayv',
        kind: 'artists',
        groupSlug: 'wayv',
        title: 'Integrantes do WayV',
        shortTitle: 'WayV',
        description: 'Veja os integrantes do WayV com perfis em português, carreira, músicas e trajetória do subgrupo chinês do NCT.',
        intro: [
            'WayV é a unidade chinesa do NCT, formada por membros chineses e coreano-americanos e lançada para o mercado C-Pop, com produções sofisticadas e forte presença nas plataformas chinesas.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia bilíngue do grupo que conecta K-Pop e C-Pop.',
        ],
        keywords: ['integrantes do wayv', 'membros wayv', 'wayv kpop cpop', 'kun ten lucas winwin xiaojun hendery yangyang', 'wayzenni wayv'],
        faq: [
            { question: 'WayV lança músicas em que idioma?', answer: 'WayV lança músicas principalmente em mandarim (para o mercado chinês), mas também em coreano e inglês, sendo uma ponte entre os mercados K-Pop e C-Pop.' },
            { question: 'WayV faz parte do NCT?', answer: 'Sim. WayV é tecnicamente uma unidade do NCT, mas opera com grande autonomia e catálogo separado, focado especificamente no público da China continental.' },
        ],
    },
    {
        slug: 'integrantes-do-ikon',
        kind: 'artists',
        groupSlug: 'ikon',
        title: 'Integrantes do iKON',
        shortTitle: 'iKON',
        description: 'Conheça os integrantes do iKON com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'iKON foi formado pela YG Entertainment depois de um reality de seleção brutal e debutou em 2015 com um som de hip-hop e R&B que conquistou os charts coreanos com "Love Scenario" em 2018.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia do grupo que sobreviveu a polêmicas e reestruturações.',
        ],
        keywords: ['integrantes do ikon', 'membros ikon', 'ikon kpop', 'jay song yunhyeong bobby dk ju-ne chan', 'ikonic ikon'],
        faq: [
            { question: 'iKON ainda está ativo?', answer: 'Sim. iKON continuou após a saída de B.I em 2019 e reestruturação da formação. O grupo segue lançando músicas e realizando shows.' },
            { question: 'Qual é o maior hit do iKON?', answer: '"Love Scenario" é de longe o maior hit do iKON — ficou semanas no topo dos charts coreanos e se tornou um fenômeno cultural com crianças em jardins de infância cantando a música.' },
        ],
    },
    {
        slug: 'integrantes-do-winner',
        kind: 'artists',
        groupSlug: 'winner',
        title: 'Integrantes do WINNER',
        shortTitle: 'WINNER',
        description: 'Veja os integrantes do WINNER com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'WINNER trouxe uma abordagem mais madura ao K-Pop da YG Entertainment, com letras introspectivas e um som que transita entre pop melancólico, hip-hop e indie, muito distinto do estilo da agência.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia autoral do grupo.',
        ],
        keywords: ['integrantes do winner', 'membros winner', 'winner kpop', 'seungyoon mino jinwoo yoon', 'inner circle winner'],
        faq: [
            { question: 'WINNER ainda está ativo?', answer: 'Sim. WINNER opera como quarteto após a saída de Nam Taehyun e segue lançando músicas com forte apelo emocional e uma fanbase Inner Circle dedicada.' },
            { question: 'O que diferencia o WINNER da YG?', answer: 'Diferente de BIGBANG e BLACKPINK, WINNER tem um som mais suave e introspectivo, com composição própria e temas que abordam solidão, amor e crescimento pessoal.' },
        ],
    },
    {
        slug: 'integrantes-do-teen-top',
        kind: 'artists',
        groupSlug: 'teen-top',
        title: 'Integrantes do Teen Top',
        shortTitle: 'Teen Top',
        description: 'Conheça os integrantes do Teen Top com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'Teen Top debutou em 2010 como um dos grupos mais jovens da época e ficou famoso por coreografias energéticas e pelo hit "Crazy" que dominou os charts coreanos em 2012.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a trajetória de mais de uma década do grupo.',
        ],
        keywords: ['integrantes do teen top', 'membros teen top', 'teen top kpop', 'chunji l.joe niel ricky changjo cap', 'angel teen top'],
        faq: [
            { question: 'Teen Top ainda está ativo?', answer: 'Teen Top segue ativo, mas com formação reduzida após serviços militares e saídas. O grupo completou mais de uma década de carreira, algo raro na indústria.' },
            { question: 'Qual foi o maior hit do Teen Top?', answer: '"Crazy" de 2012 é o maior hit do grupo, com uma coreografia complexa e energética que os ajudou a ganhar reconhecimento nacional em um mercado muito competitivo.' },
        ],
    },
    {
        slug: 'integrantes-do-after-school',
        kind: 'artists',
        groupSlug: 'after-school',
        title: 'Integrantes do After School',
        shortTitle: 'After School',
        description: 'Veja as integrantes do After School com perfis em português, carreira, performances marcantes e legado.',
        intro: [
            'After School foi um grupo feminino inovador da Pledis Entertainment que usava o conceito de "school system" — novas integrantes entravam e outras se formavam — e ficou famoso por performances de bateria ao vivo e pole dance artístico.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e um legado criativo que influenciou grupos posteriores.',
        ],
        keywords: ['integrantes do after school', 'membros after school', 'after school kpop', 'nana uee raina juyeon eyoung jooyeon kahi', 'playgirlz after school'],
        faq: [
            { question: 'After School ainda está ativo?', answer: 'After School está em hiato indefinido desde 2015. As integrantes seguiram carreiras individuais, com Nana tornando-se modelo internacional e atriz reconhecida.' },
            { question: 'O que foi único no After School?', answer: 'Beyond do conceito vocal, After School ficou famoso por performances de bateria ao vivo e pole dance artístico em shows — algo completamente inédito para grupos de idol coreanos.' },
        ],
    },
    {
        slug: 'integrantes-do-beast',
        kind: 'artists',
        groupSlug: 'beast',
        title: 'Integrantes do BEAST / Highlight',
        shortTitle: 'BEAST',
        description: 'Conheça os integrantes do BEAST (Highlight) com perfis em português, carreira, músicas e história do grupo.',
        intro: [
            'BEAST foi um dos grupos masculinos mais populares da segunda geração, com hits vocais poderosos e uma identidade emocional forte que conquistou uma das fanbases mais leais do K-Pop — as B2UTY.',
            'Após saírem da Cube Entertainment, os membros continuaram como Highlight, seguindo um percurso raro de independência artística na indústria coreana.',
        ],
        keywords: ['integrantes do beast', 'membros beast', 'beast highlight kpop', 'yoon doojoon yang yoseob lee kikwang son dongwoon jang hyunseung', 'b2uty beast'],
        faq: [
            { question: 'BEAST e Highlight são o mesmo grupo?', answer: 'Sim. Após não renovarem contrato com a Cube Entertainment, 5 dos 6 membros fundaram a própria agência (Around US Entertainment) e continuaram como Highlight.' },
            { question: 'BEAST / Highlight ainda está ativo?', answer: 'Highlight segue ativo como quarteto após o afastamento de Jang Hyunseung. O grupo mantém lançamentos regulares e uma fanbase dedicada.' },
        ],
    },
    {
        slug: 'integrantes-do-fx',
        kind: 'artists',
        groupSlug: 'fx',
        title: 'Integrantes do f(x)',
        shortTitle: 'f(x)',
        description: 'Veja as integrantes do f(x) com perfis em português, carreira, conceito avant-garde e legado no K-Pop.',
        intro: [
            'f(x) foi o grupo mais experimental da SM Entertainment — ao invés de seguir o molde convencional do K-Pop, o grupo arriscou conceitos avant-garde, colaborações artísticas e uma estética única em cada álbum.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e o legado artístico de um grupo que nunca teve um fácil acesso mas tem uma fanbase MeU extremamente fiel.',
        ],
        keywords: ['integrantes do fx', 'membros fx', 'f(x) kpop', 'victoria luna sulli amber krystal', 'meu fx sm entertainment'],
        faq: [
            { question: 'f(x) ainda está ativo?', answer: 'f(x) está em hiato indefinido desde 2019. A SM nunca anunciou oficialmente o fim do grupo, mas não há atividades coletivas. Krystal e Amber seguem carreiras individuais.' },
            { question: 'Por que f(x) é tão cultuado?', answer: 'f(x) era conhecido por álbuns conceituais coesos e uma sonoridade diferente do K-Pop padrão. "4 Walls" em particular é considerado um dos melhores álbuns do K-Pop de todos os tempos.' },
        ],
    },
    {
        slug: 'integrantes-do-4minute',
        kind: 'artists',
        groupSlug: '4minute',
        title: 'Integrantes do 4Minute',
        shortTitle: '4Minute',
        description: 'Conheça as integrantes do 4Minute com perfis em português, carreira, músicas e legado no K-Pop.',
        intro: [
            '4Minute ficou famoso pelo hit "Crazy" de 2015 e pela presença dominante de HyunA, que se tornou uma das artistas solo mais ousadas e bem-sucedidas do K-Pop depois do grupo.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia enérgica do grupo da Cube Entertainment.',
        ],
        keywords: ['integrantes do 4minute', 'membros 4minute', '4minute kpop', 'hyuna jiyoon gayoon sohyun jihyun', '4nia 4minute'],
        faq: [
            { question: '4Minute ainda está ativo?', answer: '4Minute encerrou atividades em 2016 após não renovar contratos com a Cube. HyunA seguiu uma carreira solo explosiva, e as outras integrantes continuaram na música de formas diferentes.' },
            { question: 'Qual foi o maior hit do 4Minute?', answer: '"Crazy" de 2015 é o maior hit, mas "Volume Up" e "What\'s Your Name?" também são muito lembrados pelos fãs da segunda geração do K-Pop.' },
        ],
    },
    {
        slug: 'integrantes-do-kara',
        kind: 'artists',
        groupSlug: 'kara',
        title: 'Integrantes do KARA',
        shortTitle: 'KARA',
        description: 'Veja as integrantes do KARA com perfis em português, carreira, hits e legado do primeiro grupo feminino a conquistar o Japão.',
        intro: [
            'KARA foi o primeiro girl group coreano a alcançar sucesso massivo no Japão — "Mister" e "Lupin" dominaram os charts japoneses e abriram a Hallyu Wave para toda uma geração de artistas coreanas.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a trajetória histórica do grupo que reestreou em 2023 com uma nova formação.',
        ],
        keywords: ['integrantes do kara', 'membros kara', 'kara kpop', 'park gyuri han seungyeon nicole kang jiyoung goo hara', 'karasia kara'],
        faq: [
            { question: 'KARA voltou a atuar?', answer: 'Sim. KARA fez um retorno marcante em 2022-2023 para celebrar o 15º aniversário, lançando novo álbum e realizando shows — um retorno raro e muito elogiado pelos fãs.' },
            { question: 'Por que KARA é tão importante?', answer: 'KARA foi a primeira grande onda coreana no Japão, com shows lotados em grandes arenas. O sucesso do grupo provou que o K-Pop podia ser exportado com viabilidade comercial real.' },
        ],
    },
    {
        slug: 'integrantes-do-aoa',
        kind: 'artists',
        groupSlug: 'aoa',
        title: 'Integrantes do AOA',
        shortTitle: 'AOA',
        description: 'Conheça as integrantes do AOA com perfis em português, carreira, hits e trajetória do grupo.',
        intro: [
            'AOA (Ace of Angels) foi um dos grupos femininos mais populares dos anos 2010, com uma fase banda ao vivo e depois um pivot para concept sensual que gerou hits como "Heart Attack" e "Short Hair".',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia de um grupo que também construiu carreiras de atriz notáveis.',
        ],
        keywords: ['integrantes do aoa', 'membros aoa', 'aoa kpop', 'jimin seolhyun chanmi hyejeong yuna mina', 'elvis aoa'],
        faq: [
            { question: 'AOA ainda está ativo?', answer: 'AOA está em hiato desde 2021 após uma reestruturação significativa do grupo. Seolhyun tem uma das carreiras de atriz mais bem-sucedidas entre as ex-idols.' },
            { question: 'O que foi único no AOA?', answer: 'AOA debutou em 2012 como uma banda ao vivo com guitarras e bateria, mas mais tarde abandonou esse conceito e adotou uma identidade de girl group convencional com coreografias sensuais.' },
        ],
    },
    {
        slug: 'integrantes-do-sf9',
        kind: 'artists',
        groupSlug: 'sf9',
        title: 'Integrantes do SF9',
        shortTitle: 'SF9',
        description: 'Veja os integrantes do SF9 com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'SF9 é conhecido pela performance de alto nível e vocais poderosos, com Rowoon e Jaeyoon construindo carreiras de atriz paralelas que ampliaram o alcance do grupo.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia do grupo da FNC Entertainment.',
        ],
        keywords: ['integrantes do sf9', 'membros sf9', 'sf9 kpop', 'youngbin inseong jaeyoon dawon rowoon zuho taeyang hwiyoung chani', 'fantasy sf9'],
        faq: [
            { question: 'SF9 ainda está ativo?', answer: 'Sim. SF9 continua ativo com lançamentos regulares. Rowoon ficou famoso como ator em dramas como "Scholar Who Walks the Night" e expandiu bastante o alcance do grupo.' },
            { question: 'O que significa SF9?', answer: 'SF9 significa "Sensational Feeling 9" — uma referência aos 9 integrantes e à proposta de levar uma sensação intensa ao público por meio de performance e música.' },
        ],
    },
    {
        slug: 'integrantes-do-pentagon',
        kind: 'artists',
        groupSlug: 'pentagon',
        title: 'Integrantes do PENTAGON',
        shortTitle: 'PENTAGON',
        description: 'Conheça os integrantes do PENTAGON com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'PENTAGON ficou conhecido por "Shine" e pelo programa "Pentagon Maker", além de ter Hui como um dos compositores mais prolíficos do K-Pop — ele co-escreve músicas para outros artistas da CUBE Entertainment.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia criativa do grupo.',
        ],
        keywords: ['integrantes do pentagon', 'membros pentagon', 'pentagon kpop', 'jinho hui hongseok e-dawn yanan yeo one yan-an kino wooseok', 'universe pentagon'],
        faq: [
            { question: 'PENTAGON ainda está ativo?', answer: 'Sim. PENTAGON segue ativo com comebacks regulares. Hui é especialmente valorizado como produtor e compositor dentro e fora do grupo.' },
            { question: 'Quantos integrantes tem o PENTAGON?', answer: 'PENTAGON debutou com 10 membros em 2016. A formação atual é de 9 após saídas ao longo dos anos, mas o grupo mantém um som coeso e bem recebido pelos fãs.' },
        ],
    },
    {
        slug: 'integrantes-do-p1harmony',
        kind: 'artists',
        groupSlug: 'p1harmony',
        title: 'Integrantes do P1Harmony',
        shortTitle: 'P1Harmony',
        description: 'Veja os integrantes do P1Harmony com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'P1Harmony debutou em 2020 com um universo narrativo próprio e um conceito sci-fi distópico que une performance, atuação e um visual de alta produção incomum para grupos estreantes.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e o universo expandido do grupo da FNC Entertainment.',
        ],
        keywords: ['integrantes do p1harmony', 'membros p1harmony', 'p1harmony kpop', 'keeho theo jiung intak soul jongseob', 'p1ece p1harmony'],
        faq: [
            { question: 'P1Harmony ainda está ativo?', answer: 'Sim. P1Harmony é um dos grupos mais ativos da quarta geração, com shows internacionais frequentes e uma fanbase P1ece crescendo em ritmo acelerado.' },
            { question: 'O que é o universo P1Harmony?', answer: 'P1Harmony tem um lore (universo narrativo) sci-fi que conecta seus MVs e álbuns — um recurso cada vez mais comum no K-Pop para engajar fãs além da música.' },
        ],
    },
    {
        slug: 'integrantes-do-weeekly',
        kind: 'artists',
        groupSlug: 'weeekly',
        title: 'Integrantes do Weeekly',
        shortTitle: 'Weeekly',
        description: 'Conheça as integrantes do Weeekly com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'Weeekly chegou em 2020 com uma energia contagiante e um concept jovem e colorido que resgatou a energia pop dos primeiros anos 2000 — "Holiday Party" e "After School" são os destaques.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia animada do grupo da Play M Entertainment.',
        ],
        keywords: ['integrantes do weeekly', 'membros weeekly', 'weeekly kpop', 'jihan monday jiyoon jane soojin jaehee', 'daileè weeekly'],
        faq: [
            { question: 'Weeekly ainda está ativo?', answer: 'Sim. Weeekly continua ativo e é um dos grupos femininos mais estáveis da nova geração, com uma proposta musical consistente desde o debut.' },
            { question: 'Por que "Weeekly" tem três E?', answer: 'O nome com três "E" faz referência às sete integrantes — cada "E" representa um dia da semana e o grupo completo forma a semana inteira, reforçando o conceito de alegria diária.' },
        ],
    },
    {
        slug: 'integrantes-do-brave-girls',
        kind: 'artists',
        groupSlug: 'brave-girls',
        title: 'Integrantes do Brave Girls',
        shortTitle: 'Brave Girls',
        description: 'Veja as integrantes do Brave Girls com perfis em português, carreira e a história do revival mais surpreendente do K-Pop.',
        intro: [
            'Brave Girls viveu um dos revivals mais emocionantes do K-Pop: "Rollin\'", lançada em 2017 sem sucesso, viralizou em 2021 graças a um vídeo de reação de soldados, enviando o grupo para o topo dos charts quatro anos depois.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e uma trajetória que se tornou símbolo de perseverança na indústria.',
        ],
        keywords: ['integrantes do brave girls', 'membros brave girls', 'brave girls kpop', 'yujeong eunji minyoung yuna', 'fearless brave girls'],
        faq: [
            { question: 'Brave Girls ainda está ativo?', answer: 'Brave Girls está em hiato. O grupo desfrutou de enorme popularidade após o viral de "Rollin\'" mas enfrentou dificuldades para manter o momentum comercial após o pico.' },
            { question: 'Como "Rollin\'" viralizou?', answer: 'Um vídeo mostrando soldados do exército coreano reagindo com entusiasmo a uma performance antiga de "Rollin\'" circulou nas redes em 2021 e desencadeou um fenômeno de redescoberta da música.' },
        ],
    },
    {
        slug: 'integrantes-do-brown-eyed-girls',
        kind: 'artists',
        groupSlug: 'brown-eyed-girls',
        title: 'Integrantes do Brown Eyed Girls',
        shortTitle: 'Brown Eyed Girls',
        description: 'Conheça as integrantes do Brown Eyed Girls com perfis em português, carreira, hits e legado.',
        intro: [
            'Brown Eyed Girls é pioneiro do K-Pop adulto — com vocais excepcionais, letras maduras e o icônico "Abracadabra", o grupo redefiniu o que um girl group coreano podia expressar artisticamente.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e o legado de um grupo que influenciou diretamente toda a geração seguinte.',
        ],
        keywords: ['integrantes do brown eyed girls', 'membros brown eyed girls', 'brown eyed girls kpop', 'jea miryo narsha gain', 'abracadabra brown eyed girls'],
        faq: [
            { question: 'Brown Eyed Girls ainda está ativo?', answer: 'Brown Eyed Girls tem atividades esporádicas. As integrantes, especialmente Gain e Narsha, mantêm carreiras solo ativas e o grupo é respeitado como uma das melhores performances vocais do K-Pop.' },
            { question: 'Por que "Abracadabra" foi revolucionário?', answer: '"Abracadabra" (2009) chocou pela coreografia sensual e narrativa adulta, quebrando o molde do K-Pop feminino da época e abrindo espaço para artistas expressarem sexualidade de forma artística.' },
        ],
    },
    {
        slug: 'integrantes-do-boynextdoor',
        kind: 'artists',
        groupSlug: 'boynextdoor',
        title: 'Integrantes do BOYNEXTDOOR',
        shortTitle: 'BOYNEXTDOOR',
        description: 'Veja os integrantes do BOYNEXTDOOR com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'BOYNEXTDOOR debutou em 2023 pela KOZ Entertainment (subsidiária da HYBE) e rapidamente conquistou atenção com um som indie-pop sincero e letras sobre emoções cotidianas de jovens adultos.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia que une autenticidade e produção pop de alta qualidade.',
        ],
        keywords: ['integrantes do boynextdoor', 'membros boynextdoor', 'boynextdoor kpop', 'leehan riwoo taesan jaehyun sungho woonhak', 'bnd boynextdoor'],
        faq: [
            { question: 'BOYNEXTDOOR é da HYBE?', answer: 'Sim. BOYNEXTDOOR é da KOZ Entertainment, que é subsidiária da HYBE — a mesma empresa do BTS. O grupo tem Zico (do Block B) como um dos responsáveis pela label.' },
            { question: 'Qual é o conceito do BOYNEXTDOOR?', answer: 'O conceito do grupo é de "boys next door" — jovens comuns com histórias reais, letras que falam de inseguranças e sentimentos reais, contrastando com o glamour de muitos grupos.' },
        ],
    },
    {
        slug: 'integrantes-do-and-team',
        kind: 'artists',
        groupSlug: 'and-team',
        title: 'Integrantes do &TEAM',
        shortTitle: '&TEAM',
        description: 'Conheça os integrantes do &TEAM com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            '&TEAM é um grupo multinacional da HYBE Japan, formado por integrantes coreanos e japoneses que focam no mercado japonês com um sound energético de alta performance.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a trajetória de um grupo que conecta as culturas pop coreana e japonesa.',
        ],
        keywords: ['integrantes do and-team', 'membros and team', '&team kpop', 'k fuma nicholas ef taki yuma maki harua', 'luné and team'],
        faq: [
            { question: '&TEAM é coreano ou japonês?', answer: '&TEAM opera principalmente no Japão pela HYBE Japan, mas tem integrantes coreanos e japoneses. Lançam músicas em japonês e coreano, posicionados entre os dois mercados.' },
            { question: 'Como o &TEAM foi formado?', answer: '&TEAM foi formado por meio de um processo de audição e treinamento da HYBE, sendo apresentado ao público através do reality "&Audition — The Howling" em 2022.' },
        ],
    },
    {
        slug: 'integrantes-do-everglow',
        kind: 'artists',
        groupSlug: 'everglow',
        title: 'Integrantes do EVERGLOW',
        shortTitle: 'EVERGLOW',
        description: 'Veja as integrantes do EVERGLOW com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'EVERGLOW debutou em 2019 com um concept poderoso e uma abordagem de "fierce girl group" que combina rap, dança e vocais em performances de alto impacto — "Adios" e "La Di Da" são os destaques.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e a discografia do grupo da Yuehua Entertainment.',
        ],
        keywords: ['integrantes do everglow', 'membros everglow', 'everglow kpop', 'yiren sihyeon mia onda aisha e:u', 'forever everglow'],
        faq: [
            { question: 'EVERGLOW ainda está ativo?', answer: 'Sim. EVERGLOW continua ativo com lançamentos e shows. O grupo tem presença forte no mercado internacional, especialmente na América Latina e Estados Unidos.' },
            { question: 'Qual é o maior hit do EVERGLOW?', answer: '"Adios" é o hit mais conhecido, com uma performance enérgica que viralizou em covers e fan cams ao redor do mundo, ajudando a estabelecer o grupo além da Coreia.' },
        ],
    },
    {
        slug: 'integrantes-do-clc',
        kind: 'artists',
        groupSlug: 'clc',
        title: 'Integrantes do CLC',
        shortTitle: 'CLC',
        description: 'Conheça as integrantes do CLC com perfis em português, carreira, músicas e legado no K-Pop.',
        intro: [
            'CLC (Crystal Clear) é considerado um dos grupos mais injustamente subestimados do K-Pop — "No" e "Devil" são performances de nível altíssimo que nunca receberam o sucesso que mereciam em charts.',
            'Este hub organiza as integrantes cadastradas no HallyuHub para navegar por perfis e uma discografia que a internet redescobriu e valoriza cada vez mais.',
        ],
        keywords: ['integrantes do clc', 'membros clc', 'clc kpop', 'seunghee yujin sorn seungyeon yeeun elkie cheshire', 'clc cube entertainment'],
        faq: [
            { question: 'CLC ainda está ativo?', answer: 'CLC encerrou atividades em 2021 após deixar a Cube Entertainment. O grupo é muito lembrado nas redes sociais como exemplo de potencial não aproveitado pela agência.' },
            { question: 'Por que CLC tem tantos fãs retrospectivos?', answer: 'Muitos fãs acreditam que a Cube Entertainment não investiu adequadamente no CLC, e redescobriram o grupo anos depois — especialmente "No", considerada uma das melhores performances do K-Pop feminino.' },
        ],
    },
    {
        slug: 'integrantes-do-cravity',
        kind: 'artists',
        groupSlug: 'cravity',
        title: 'Integrantes do CRAVITY',
        shortTitle: 'CRAVITY',
        description: 'Veja os integrantes do CRAVITY com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'CRAVITY debutou em 2020 pela Starship Entertainment com um concept de "criatividade e gravidade" que une performance de dança precisa e um visual impactante para cada comeback.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia crescente do grupo.',
        ],
        keywords: ['integrantes do cravity', 'membros cravity', 'cravity kpop', 'serim allen jungmo woobin wonjin minhee hyeongjun taeyoung allen', 'luvity cravity'],
        faq: [
            { question: 'CRAVITY ainda está ativo?', answer: 'Sim. CRAVITY continua ativo com comebacks regulares e participações em eventos internacionais, consolidando uma fanbase Luvity crescente.' },
            { question: 'O que significa CRAVITY?', answer: 'CRAVITY vem de "Creativity" + "Gravity", representando a ideia de criar um universo próprio que atrai fãs com força gravitacional — um nome que reflete a identidade artística do grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-treasure',
        kind: 'artists',
        groupSlug: 'treasure',
        title: 'Integrantes do TREASURE',
        shortTitle: 'TREASURE',
        description: 'Conheça os integrantes do TREASURE com perfis em português, carreira, músicas e trajetória do grupo.',
        intro: [
            'TREASURE é o mais recente boy group da YG Entertainment, com 12 integrantes selecionados pelo reality "YG Treasure Box" em 2018 e debut em 2020 com um sound que mescla hip-hop e performance energética.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a discografia do grupo que carrega as expectativas de ser o próximo grande grupo masculino da YG.',
        ],
        keywords: ['integrantes do treasure', 'membros treasure', 'treasure kpop yg', 'hyunsuk jihoon yoshi junkyu mashiho jaehyuk asahi yedam doyoung haruto jeongwoo junghwan', 'treasure maker'],
        faq: [
            { question: 'TREASURE ainda está ativo?', answer: 'Sim. TREASURE continua ativo com shows e lançamentos regulares, sendo uma das apostas da YG Entertainment para o cenário internacional de K-Pop.' },
            { question: 'Quantos membros tem o TREASURE?', answer: 'TREASURE debutou com 12 integrantes, mas a formação se alterou ao longo do tempo. O grupo é um dos maiores em número de membros entre os grupos da YG.' },
        ],
    },
    {
        slug: 'integrantes-do-tws',
        kind: 'artists',
        groupSlug: 'tws',
        title: 'Integrantes do TWS',
        shortTitle: 'TWS',
        description: 'Veja os integrantes do TWS com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'TWS debutou em 2024 pela PLEDIS Entertainment (subsidiária da HYBE) com um concept de amizade e adolescência, conquistando rapidamente fãs com o hit "Plot Twist".',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a fase inicial de um grupo que promete bastante na quarta geração do K-Pop.',
        ],
        keywords: ['integrantes do tws', 'membros tws', 'tws kpop hybe', 'hanjin kyuvin dohoon youngjae jihoon jun', 'twiceonce tws'],
        faq: [
            { question: 'TWS é da mesma empresa que SEVENTEEN?', answer: 'Sim. TWS é da PLEDIS Entertainment, que agora faz parte da HYBE — a mesma empresa do BTS. SEVENTEEN e TWS compartilham a mesma label.' },
            { question: 'Qual foi o primeiro hit do TWS?', answer: '"Plot Twist" foi o debut single mais comentado de 2024, com uma melodia nostálgica e performance animada que capturou atenção imediata nas redes sociais.' },
        ],
    },
    {
        slug: 'integrantes-do-onf',
        kind: 'artists',
        groupSlug: 'onf',
        title: 'Integrantes do ONF',
        shortTitle: 'ONF',
        description: 'Conheça os integrantes do ONF com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'ONF é conhecido por uma discografia de alta qualidade artística que vai além do típico K-Pop — "We Must Love" e "Beautiful Beautiful" são exemplos de composições elaboradas que conquistaram fãs exigentes.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e uma trajetória de um grupo que construiu uma base de fãs leal através da consistência.',
        ],
        keywords: ['integrantes do onf', 'membros onf', 'onf kpop', 'hyojin e-tion j-us wyatt mk u', 'fuse onf'],
        faq: [
            { question: 'ONF ainda está ativo?', answer: 'ONF segue ativo após os serviços militares dos membros, com comebacks bem recebidos e uma fanbase Fuse dedicada que manteve o interesse no grupo durante o hiato militar.' },
            { question: 'O que significa ONF?', answer: 'ONF significa "On and Off" — representando a dualidade entre a vida no palco e fora dele, uma metáfora para o contraste entre performance intensa e personalidades genuínas dos membros.' },
        ],
    },
    {
        slug: 'integrantes-do-victon',
        kind: 'artists',
        groupSlug: 'victon',
        title: 'Integrantes do VICTON',
        shortTitle: 'VICTON',
        description: 'Veja os integrantes do VICTON com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'VICTON ganhou reconhecimento maior após "What I Said", mas especialmente pelo sucesso solo de Han Seungwoo, que apareceu no reality "Produce X 101" e trouxe nova visibilidade ao grupo.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para navegar por perfis e a trajetória de um grupo que persistiu por anos antes do breakthrough.',
        ],
        keywords: ['integrantes do victon', 'membros victon', 'victon kpop', 'seungwoo seungsik chan subin sejun byungchan hanse', 'alice victon'],
        faq: [
            { question: 'VICTON ainda está ativo?', answer: 'Sim. VICTON continuou ativo após os serviços militares com comebacks regulares e uma fanbase Alice leal que acompanha o grupo desde 2016.' },
            { question: 'Por que Han Seungwoo participou de um reality?', answer: 'Han Seungwoo entrou no "Produce X 101" da Mnet em 2019 como representante do VICTON e acabou debuting temporariamente no X1, o que aumentou muito o perfil do grupo original.' },
        ],
    },
    // ── Hubs temáticos ────────────────────────────────────────────
    {
        slug: 'doramas-historicos-coreanos',
        kind: 'productions',
        title: 'Doramas Históricos Coreanos (Sageuk)',
        shortTitle: 'Sageuk',
        description: 'Os melhores doramas históricos coreanos (sageuk) com perfis em português, elenco, plataformas e onde assistir.',
        intro: [
            'Os sageuks — dramas históricos coreanos — transportam o espectador para dinastias como Joseon e Goryeo com figurinos elaborados, tramas políticas e romances épicos que prendem do primeiro ao último episódio.',
            'O HallyuHub organiza os melhores sageuk cadastrados para que você encontre onde assistir, conheça o elenco e explore as histórias que moldaram a Coreia.',
        ],
        keywords: ['doramas historicos coreanos', 'sageuk', 'drama joseon', 'dorama historico', 'historico coreano netflix', 'dynasty drama'],
        faq: [
            { question: 'O que é sageuk?', answer: 'Sageuk é o termo coreano para drama histórico. Esses dramas se passam em períodos como a Dinastia Joseon (1392–1897) ou Goryeo e combinam história, política, romance e, às vezes, fantasia.' },
            { question: 'Qual é o sageuk mais famoso?', answer: '"Mr. Sunshine", "Jewel in the Palace", "Six Flying Dragons" e "My Sassy Girl" histórico estão entre os mais aclamados, mas "Kingdom" popularizou o gênero globalmente na Netflix.' },
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
        slug: 'grupos-4a-geracao-kpop',
        kind: 'groups',
        title: 'Grupos da 4ª Geração do K-Pop',
        shortTitle: '4ª Geração K-Pop',
        description: 'Os principais grupos da 4ª geração do K-Pop com perfis em português, discografia, fandom e curiosidades.',
        intro: [
            'A 4ª geração do K-Pop começou por volta de 2018-2019 e trouxe grupos com foco em identidade própria, lore narrativo, conexão direta com fãs via Weverse e YouTube, e uma base internacional mais sólida que nunca.',
            'ATEEZ, Stray Kids, ENHYPEN, aespa, IVE, NewJeans e Le Sserafim são alguns dos nomes que definem essa geração — todos cadastrados no HallyuHub com perfis completos.',
        ],
        keywords: ['grupos 4a geracao kpop', 'kpop 4th gen', 'novos grupos kpop', 'grupos kpop 2020 2021 2022 2023', '4th generation kpop'],
        faq: [
            { question: 'Quando começa a 4ª geração do K-Pop?', answer: 'Não há um consenso exato, mas a maioria dos fãs considera que a 4ª geração começou entre 2018 e 2020, com grupos como ATEEZ, TXT e Stray Kids abrindo caminho para a nova onda.' },
            { question: 'Quais são os grupos mais populares da 4ª geração?', answer: 'Stray Kids, ATEEZ, ENHYPEN, aespa, IVE, NewJeans, Le Sserafim e NMIXX estão entre os mais citados — mas a geração tem dezenas de grupos com bases de fãs globais significativas.' },
        ],
    },
    {
        slug: 'grupos-3a-geracao-kpop',
        kind: 'groups',
        title: 'Grupos da 3ª Geração do K-Pop',
        shortTitle: '3ª Geração K-Pop',
        description: 'Os maiores grupos da 3ª geração do K-Pop com perfis em português, discografia, fandom e curiosidades.',
        intro: [
            'A 3ª geração do K-Pop (2012–2017) consolidou o gênero globalmente — BTS, EXO, BLACKPINK, TWICE e GOT7 são os nomes que transformaram o K-Pop de nicho em fenômeno de cultura pop mundial.',
            'Este hub reúne os grupos mais representativos da era que pavimentou o caminho para o sucesso do K-Pop no Ocidente.',
        ],
        keywords: ['grupos 3a geracao kpop', 'kpop 3rd gen', 'kpop 2012 2016', 'bts exo blackpink twice got7', '3rd generation kpop'],
        faq: [
            { question: 'Quando foi a 3ª geração do K-Pop?', answer: 'A 3ª geração é geralmente datada de 2012 a 2017, com grupos como EXO, BTS, GOT7, TWICE e BLACKPINK. Foi a era que levou o K-Pop para as paradas ocidentais e grandes festivais.' },
            { question: 'O BTS é da 3ª geração?', answer: 'Sim. BTS debutou em 2013 e é considerado o grupo mais representativo da 3ª geração, sendo o que mais contribuiu para o reconhecimento global do K-Pop.' },
        ],
    },
    // ── Solo Artist Hubs ──────────────────────────────────────────────────────
    {
        slug: 'iu',
        kind: 'artists',
        title: 'IU — Lee Ji-eun',
        shortTitle: 'IU',
        description: 'Perfil completo de IU (Lee Ji-eun): discografia, carreiras solo, dramas, conquistas e curiosidades sobre a mais amada solista do K-Pop.',
        intro: [
            'IU (이유), nome real Lee Ji-eun, é considerada a princesa do K-Pop coreano. Debutou em 2008 pela LOEN Entertainment e construiu uma das carreiras mais longas e consistentes do pop coreano.',
            'Além de cantora, IU é atriz aclamada — seu papel em "My Mister" (2018) e "Hotel Del Luna" (2019) a consagrou como uma das artistas mais versáteis da Coreia.',
        ],
        keywords: ['IU', 'Lee Ji-eun', 'IU discografia', 'IU dramas', 'IU kpop solista', 'princesa kpop'],
        faq: [
            { question: 'Qual é o nome real de IU?', answer: 'O nome real de IU é Lee Ji-eun (이지은). O pseudônimo "IU" representa a ideia de "I" e "You" conectados pela música.' },
            { question: 'IU faz parte de algum grupo?', answer: 'Não. IU sempre teve carreira exclusivamente solo desde seu debut em 2008. É considerada uma das solistas mais bem-sucedidas da história do K-Pop.' },
            { question: 'Quais são os maiores hits de IU?', answer: 'Alguns dos maiores hits de IU incluem "Good Day" (2010), "You and I" (2011), "Palette" (2017), "BBIBBI" (2018), "Blueming" (2019) e "Celebrity" (2021).' },
        ],
    },
    {
        slug: 'taeyeon',
        kind: 'artists',
        title: 'Taeyeon — SNSD',
        shortTitle: 'Taeyeon',
        description: 'Perfil completo de Taeyeon: carreira solo, álbuns, lideres do SNSD/Girls Generation, conquistas e discografia.',
        intro: [
            'Kim Taeyeon é a líder e vocalista principal do SNSD (Girls\' Generation) e uma das solistas de K-Pop mais aclamadas. Debutou em 2007 com o SNSD e iniciou carreira solo em 2015.',
            'Com uma voz reconhecida como uma das melhores do K-Pop, Taeyeon lançou álbuns aclamados e trilhou uma carreira solo robusta paralelamente ao SNSD.',
        ],
        keywords: ['Taeyeon', 'Kim Taeyeon', 'SNSD Taeyeon', 'Taeyeon solo', 'Girls Generation líder', 'Taeyeon discografia'],
        faq: [
            { question: 'Taeyeon faz parte do SNSD?', answer: 'Sim. Taeyeon é a líder e vocalista principal do SNSD (Girls\' Generation), um dos grupos femininos mais icônicos do K-Pop. Ela também tem uma extensa carreira solo iniciada em 2015.' },
            { question: 'Quais são os maiores hits solo de Taeyeon?', answer: 'Os maiores hits de Taeyeon incluem "I" (2015), "Fine" (2017), "Four Seasons" (2019), "INVU" (2022) e "To the Moon" (2018).' },
        ],
    },
    {
        slug: 'g-dragon',
        kind: 'artists',
        title: 'G-Dragon — BIGBANG',
        shortTitle: 'G-Dragon',
        description: 'Perfil completo de G-Dragon: carreira solo, álbuns, liderança do BIGBANG, influência na moda e conquistas no K-Pop.',
        intro: [
            'Kwon Ji-yong, conhecido como G-Dragon, é o líder e principal criador do BIGBANG. É amplamente considerado um dos maiores artistas do K-Pop de todos os tempos, tanto pela música quanto pela influência na moda.',
            'Com uma carreira solo que inclui os icônicos álbuns "Heartbreaker" (2009) e "One of a Kind" (2012), G-Dragon redefiniu os limites do pop coreano e abriu caminho para a presença do K-Pop no Ocidente.',
        ],
        keywords: ['G-Dragon', 'GD', 'BIGBANG G-Dragon', 'G-Dragon solo', 'Kwon Jiyong', 'G-Dragon discografia'],
        faq: [
            { question: 'G-Dragon faz parte do BIGBANG?', answer: 'Sim. G-Dragon é o líder e principal compositor do BIGBANG. O grupo ficou em hiato parcial enquanto seus membros cumpriram serviço militar, retornando gradualmente a partir de 2022.' },
            { question: 'Qual é o nome real de G-Dragon?', answer: 'O nome real de G-Dragon é Kwon Ji-yong (권지용). Ele usa o pseudônimo artístico GD ou G-Dragon tanto em suas atividades solo quanto no BIGBANG.' },
        ],
    },
    {
        slug: 'taeyang',
        kind: 'artists',
        title: 'Taeyang — BIGBANG',
        shortTitle: 'Taeyang',
        description: 'Perfil completo de Taeyang: carreira solo, R&B coreano, membro do BIGBANG, discografia e conquistas internacionais.',
        intro: [
            'Dong Young-bae, conhecido como Taeyang, é o vocalista principal e dançarino do BIGBANG. Sua voz única e influência no R&B coreano o tornaram um dos artistas mais respeitados do gênero.',
            'Seu álbum solo "Solar" (2014) e o single "Eyes, Nose, Lips" se tornaram clássicos do K-Pop. Taeyang também casou com a atriz Min Hyo-rin, sendo um dos casamentos mais seguidos do entretenimento coreano.',
        ],
        keywords: ['Taeyang', 'BIGBANG Taeyang', 'Taeyang solo', 'Dong Young-bae', 'Solar Taeyang', 'Eyes Nose Lips'],
        faq: [
            { question: 'Quais são os maiores hits de Taeyang?', answer: 'Os maiores hits solo de Taeyang incluem "Wedding Dress" (2010), "I Need a Girl" (2010), "Eyes, Nose, Lips" (2014) e "Ringa Linga" (2013). Com o BIGBANG, participou de "Fantastic Baby", "Bang Bang Bang" e "Lies".' },
        ],
    },
    {
        slug: 'zico',
        kind: 'artists',
        title: 'Zico — Block B',
        shortTitle: 'Zico',
        description: 'Perfil completo de Zico: carreira solo, fundador do Block B, hits de hip-hop coreano, produção musical e conquistas.',
        intro: [
            'Woo Ji-ho, conhecido como Zico, é líder e rapper do Block B e um dos produtores e compositores mais prolíficos do hip-hop coreano. Seu talento como beatmaker e letrista o diferencia como artista completo.',
            '"Any Song" (2020) se tornou um dos maiores hits virais do K-Pop, dominando as paradas coreanas e acumulando bilhões de streams. Zico também é fundador da gravadora KOZ Entertainment.',
        ],
        keywords: ['Zico', 'Block B Zico', 'Zico solo', 'Woo Ji-ho', 'Any Song', 'hip-hop coreano Zico'],
        faq: [
            { question: 'Zico ainda faz parte do Block B?', answer: 'Zico é membro fundador do Block B, mas também tem uma extensa carreira solo e é CEO da KOZ Entertainment, gravadora filiada à HYBE. Suas atividades solo são mais frequentes atualmente.' },
            { question: 'Qual é o maior hit de Zico?', answer: '"Any Song" (2020) é o hit mais popular de Zico, dominando as paradas coreanas e viralizando globalmente com o desafio de dança. O single é um marco do K-Pop moderno.' },
        ],
    },
    {
        slug: 'hyuna',
        kind: 'artists',
        title: 'HyunA',
        shortTitle: 'HyunA',
        description: 'Perfil completo de HyunA: carreira solo, ex-4Minute e ex-Wonder Girls, hits icônicos, estilo e discografia.',
        intro: [
            'Kim Hyun-ah, conhecida como HyunA, é uma das artistas femininas mais ousadas e influentes do K-Pop. Ex-membro do 4Minute e das Wonder Girls, HyunA construiu uma das carreiras solo mais consistentes entre as idols de sua geração.',
            '"Bubble Pop!" (2011) e "Red" (2013) se tornaram clássicos do pop coreano. HyunA é conhecida por seu estilo provocativo e por quebrar convenções de imagem no K-Pop.',
        ],
        keywords: ['HyunA', 'Kim Hyuna', 'HyunA solo', '4Minute HyunA', 'Bubble Pop', 'HyunA discografia'],
        faq: [
            { question: 'HyunA foi membro de algum grupo?', answer: 'Sim. HyunA foi membro fundador do 4Minute (2009-2016) e teve uma participação breve nas Wonder Girls. Desde o fim do 4Minute, tem se dedicado exclusivamente à carreira solo.' },
            { question: 'Quais são os maiores hits de HyunA?', answer: 'Os maiores hits de HyunA incluem "Bubble Pop!" (2011), "Gangnam Style" (participação com PSY, 2012), "Red" (2013), "Roll Deep" (2015) e "Lip & Hip" (2017).' },
        ],
    },
    {
        slug: 'sunmi',
        kind: 'artists',
        title: 'Sunmi',
        shortTitle: 'Sunmi',
        description: 'Perfil completo de Sunmi: carreira solo, ex-Wonder Girls, hits icônicos, estilo artístico único e discografia.',
        intro: [
            'Lee Sun-mi, conhecida como Sunmi, é ex-membro das Wonder Girls e uma das artistas solo mais aclamadas da nova geração do K-Pop. Seu estilo artístico único mistura pop experimental, letras de auto-expressão e performances cinematográficas.',
            '"Gashina" (2017) e "Siren" (2018) marcaram o retorno de Sunmi como solista e consolidaram sua reputação de artista que define tendências no pop coreano.',
        ],
        keywords: ['Sunmi', 'Lee Sunmi', 'Sunmi solo', 'Wonder Girls Sunmi', 'Gashina', 'Sunmi discografia'],
        faq: [
            { question: 'Sunmi foi membro das Wonder Girls?', answer: 'Sim. Sunmi foi membro das Wonder Girls de 2007 a 2010, quando saiu para focar em seus estudos, e retornou de 2012 a 2015. Desde 2017 tem carreira exclusivamente solo.' },
            { question: 'Quais são os maiores hits de Sunmi?', answer: 'Os maiores hits de Sunmi incluem "Gashina" (2017), "Heroine" (2018), "Siren" (2018), "Lalalay" (2019) e "pporappippam" (2020).' },
        ],
    },
    // ── Grupos masculinos ──────────────────────────────────────────────────────
    {
        slug: 'integrantes-do-loona',
        kind: 'artists',
        groupSlug: 'loona',
        title: 'Integrantes do LOONA',
        shortTitle: 'LOONA',
        description: 'Conheça as integrantes do LOONA com perfis em português, carreira, músicas, curiosidades e histórico do grupo.',
        intro: [
            'LOONA é um dos projetos de K-Pop mais ambiciosos já criados: cada integrante foi revelada individualmente, cada uma com seu próprio MV solo, antes do debut oficial do grupo.',
            'Este hub organiza as integrantes do LOONA para facilitar a navegação por perfis, carreira individual e conexões dentro do HallyuHub.',
        ],
        keywords: ['integrantes do loona', 'membros loona', 'loona kpop', 'loona orbits'],
        faq: [
            { question: 'Quantas integrantes tem o LOONA?', answer: 'O LOONA foi formado por 12 integrantes, cada uma revelada individualmente antes do debut do grupo em 2018.' },
            { question: 'O LOONA ainda está ativo?', answer: 'As antigas integrantes do LOONA continuam ativas em projetos individuais e em novos grupos como o ARTMS, após disputas contratuais com a Blockberry Creative.' },
        ],
    },
    {
        slug: 'integrantes-do-the-boyz',
        kind: 'artists',
        groupSlug: 'the-boyz',
        title: 'Integrantes do THE BOYZ',
        shortTitle: 'THE BOYZ',
        description: 'Conheça os integrantes do THE BOYZ com perfis, carreira, músicas e curiosidades sobre o grupo masculino de K-Pop.',
        intro: [
            'THE BOYZ é um grupo masculino de K-Pop conhecido pela intensidade de suas performances ao vivo e pela vitória no reality de grupos "Road to Kingdom".',
            'Este hub reúne os integrantes cadastrados no HallyuHub para navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do the boyz', 'membros the boyz', 'the boyz kpop', 'the boyz road to kingdom'],
        faq: [
            { question: 'Quantos integrantes tem o THE BOYZ?', answer: 'O THE BOYZ estreou com 12 integrantes em 2017, mas teve mudanças na formação ao longo dos anos.' },
            { question: 'O que é Road to Kingdom?', answer: 'Road to Kingdom foi um reality de competição entre grupos masculinos de K-Pop em 2020, vencido pelo THE BOYZ com performances marcantes.' },
        ],
    },
    {
        slug: 'integrantes-do-zerobaseone',
        kind: 'artists',
        groupSlug: 'zerobaseone',
        title: 'Integrantes do ZEROBASEONE',
        shortTitle: 'ZEROBASEONE',
        description: 'Conheça os integrantes do ZEROBASEONE com perfis em português, carreira, músicas e curiosidades do grupo.',
        intro: [
            'ZEROBASEONE (ZB1) foi formado pelo reality "Boys Planet" da Mnet em 2023 e rapidamente se tornou um dos grupos masculinos mais relevantes da quarta geração.',
            'Este hub reúne os integrantes do ZB1 cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do zerobaseone', 'membros zb1', 'zerobaseone kpop', 'boys planet grupo'],
        faq: [
            { question: 'Como o ZEROBASEONE foi formado?', answer: 'O ZEROBASEONE foi formado pelo reality show "Boys Planet" da Mnet, onde os 9 integrantes foram selecionados por votação do público.' },
            { question: 'Quantos integrantes tem o ZB1?', answer: 'O ZEROBASEONE é composto por 9 integrantes de diferentes países, incluindo Coreia do Sul e China.' },
        ],
    },
    {
        slug: 'integrantes-do-super-junior',
        kind: 'artists',
        groupSlug: 'super-junior',
        title: 'Integrantes do Super Junior',
        shortTitle: 'Super Junior',
        description: 'Conheça os integrantes do Super Junior com perfis, carreira, músicas e curiosidades sobre o lendário grupo de K-Pop.',
        intro: [
            'Super Junior é um dos grupos mais importantes da segunda geração do K-Pop, com hits como "Sorry Sorry" que marcaram toda uma geração de fãs.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para facilitar a descoberta de perfis, carreira individual e conteúdos relacionados.',
        ],
        keywords: ['integrantes do super junior', 'membros super junior', 'super junior kpop', 'suju'],
        faq: [
            { question: 'Super Junior ainda está ativo?', answer: 'Sim. O Super Junior continua ativo, com lançamentos regulares e atividades em grupo, mesmo com membros que seguem projetos individuais em paralelo.' },
            { question: 'Qual é o maior hit do Super Junior?', answer: '"Sorry Sorry" (2009) é o maior hit do Super Junior, considerado um marco do K-Pop que ajudou a popularizar o gênero internacionalmente.' },
        ],
    },
    {
        slug: 'integrantes-do-enhypen',
        kind: 'artists',
        groupSlug: 'enhypen',
        title: 'Integrantes do ENHYPEN',
        shortTitle: 'ENHYPEN',
        description: 'Conheça os integrantes do ENHYPEN com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'ENHYPEN foi formado pelo reality "I-Land" em 2020 e rapidamente conquistou uma posição central entre os grupos masculinos da quarta geração.',
            'Este hub reúne os integrantes cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do enhypen', 'membros enhypen', 'enhypen kpop', 'i-land grupo'],
        faq: [
            { question: 'Como o ENHYPEN foi formado?', answer: 'O ENHYPEN foi formado pelo reality show "I-Land" da Mnet em colaboração com a HYBE e Big Hit Music, com os integrantes selecionados por votação do público.' },
            { question: 'Quantos integrantes tem o ENHYPEN?', answer: 'O ENHYPEN é composto por 7 integrantes: Jungwon, Heeseung, Jay, Jake, Sunghoon, Sunoo e Ni-ki.' },
        ],
    },
    {
        slug: 'integrantes-do-i-dle',
        kind: 'artists',
        groupSlug: 'i-dle',
        title: 'Integrantes do (G)I-DLE',
        shortTitle: '(G)I-DLE',
        description: 'Conheça as integrantes do (G)I-DLE com perfis em português, carreira, músicas, produções e curiosidades.',
        intro: [
            '(G)I-DLE é um dos grupos femininos mais autônomos do K-Pop, com integrantes que participam ativamente da composição, produção e direção criativa das músicas.',
            'Este hub reúne as integrantes cadastradas no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do gidle', 'membros gidle', 'gidle kpop', 'g idle soyeon minnie'],
        faq: [
            { question: 'O que diferencia o (G)I-DLE de outros grupos?', answer: 'O (G)I-DLE é conhecido pela autonomia criativa das integrantes, especialmente Soyeon, que compõe, produz e escreve a maioria das músicas do grupo.' },
            { question: 'Quantas integrantes tem o (G)I-DLE?', answer: 'Atualmente o (G)I-DLE conta com 5 integrantes: Miyeon, Minnie, Soyeon, Yuqi e Shuhua.' },
        ],
    },
    {
        slug: 'integrantes-do-kep1er',
        kind: 'artists',
        groupSlug: 'kep1er',
        title: 'Integrantes do Kep1er',
        shortTitle: 'Kep1er',
        description: 'Conheça as integrantes do Kep1er com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'Kep1er foi formado pelo reality "Girls Planet 999" em 2021, reunindo integrantes da Coreia do Sul, China e Japão.',
            'Este hub reúne as integrantes cadastradas no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do kep1er', 'membros kep1er', 'kep1er kpop', 'girls planet 999'],
        faq: [
            { question: 'Como o Kep1er foi formado?', answer: 'Kep1er foi formado pelo reality show "Girls Planet 999" da Mnet em 2021, com integrantes selecionadas por votação do público.' },
            { question: 'O Kep1er ainda está ativo?', answer: 'O Kep1er teve seu contrato renovado após o período inicial e continua com atividades regulares como grupo.' },
        ],
    },
    {
        slug: 'integrantes-do-2pm',
        kind: 'artists',
        groupSlug: '2pm',
        title: 'Integrantes do 2PM',
        shortTitle: '2PM',
        description: 'Conheça os integrantes do 2PM com perfis, carreira, músicas e curiosidades sobre o grupo masculino da JYP Entertainment.',
        intro: [
            '2PM é um dos grupos masculinos mais populares da segunda geração do K-Pop, conhecido pelo conceito de "beastly idols" e por performances físicas marcantes.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do 2pm', 'membros 2pm', '2pm kpop', '2pm jyp'],
        faq: [
            { question: '2PM ainda está ativo?', answer: 'Sim. O 2PM retomou atividades em grupo após todos os membros concluírem o serviço militar obrigatório.' },
            { question: 'Quem eram os membros originais do 2PM?', answer: 'O 2PM original incluía Jay Park, que saiu do grupo em 2009. A formação atual tem Junho, Taecyeon, Wooyoung, Chansung, Nichkhun e Jun.K.' },
        ],
    },
    {
        slug: 'integrantes-do-shinhwa',
        kind: 'artists',
        groupSlug: 'shinhwa',
        title: 'Integrantes do SHINHWA',
        shortTitle: 'SHINHWA',
        description: 'Conheça os integrantes do SHINHWA, o grupo de K-Pop mais longevo da história, com perfis, carreira e curiosidades.',
        intro: [
            'SHINHWA é o grupo de K-Pop com maior longevidade da história, mantendo a mesma formação desde o debut em 1998.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do shinhwa', 'membros shinhwa', 'shinhwa kpop', 'shinhwa grupo mais antigo kpop'],
        faq: [
            { question: 'Por que o SHINHWA é histórico?', answer: 'SHINHWA é o grupo de K-Pop mais longevo com a mesma formação original, ativo desde 1998, o que é um recorde no gênero.' },
            { question: 'Quantos integrantes tem o SHINHWA?', answer: 'O SHINHWA tem 6 integrantes: Eric, Minwoo, Dongwan, Hyesung, Andy e JunJin, todos desde o debut.' },
        ],
    },
    {
        slug: 'integrantes-do-winner',
        kind: 'artists',
        groupSlug: 'winner',
        title: 'Integrantes do WINNER',
        shortTitle: 'WINNER',
        description: 'Conheça os integrantes do WINNER com perfis em português, carreira, músicas e curiosidades sobre o grupo da YG Entertainment.',
        intro: [
            'WINNER é um grupo masculino da YG Entertainment que se destacou por seu som mais maduro e introspectivo em relação ao K-Pop mainstream.',
            'Este hub reúne os integrantes cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do winner', 'membros winner', 'winner kpop', 'winner yg'],
        faq: [
            { question: 'Como o WINNER foi formado?', answer: 'WINNER foi formado através do reality show "Who Is Next: WIN" da YG Entertainment em 2013, competindo com outro grupo que viria a se tornar iKON.' },
            { question: 'Quantos integrantes tem o WINNER?', answer: 'O WINNER tem 4 integrantes: Seungyoon, Mino, Seunghoon e Jinwoo, após a saída de Nam Taehyun em 2016.' },
        ],
    },
    {
        slug: 'integrantes-do-kara',
        kind: 'artists',
        groupSlug: 'kara',
        title: 'Integrantes do KARA',
        shortTitle: 'KARA',
        description: 'Conheça as integrantes do KARA com perfis em português, carreira, músicas e a história do grupo pioneiro no Japão.',
        intro: [
            'KARA foi um dos primeiros grupos de K-Pop a conquistar o Japão em grande escala, abrindo caminho para o Hallyu no mercado japonês.',
            'Este hub organiza as integrantes do KARA cadastradas no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do kara', 'membros kara', 'kara kpop', 'kara japão'],
        faq: [
            { question: 'KARA ainda está ativo?', answer: 'KARA voltou a atividades em 2022 com um comeback especial que reuniu integrantes antigas e novas, celebrando 15 anos de carreira.' },
            { question: 'Por que KARA é importante para o K-Pop?', answer: 'KARA foi um dos grupos pioneiros a alcançar sucesso massivo no Japão, contribuindo para a expansão do K-Pop asiático a partir de 2010.' },
        ],
    },
    {
        slug: 'integrantes-do-sistar',
        kind: 'artists',
        groupSlug: 'sistar',
        title: 'Integrantes do SISTAR',
        shortTitle: 'SISTAR',
        description: 'Conheça as integrantes do SISTAR com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'SISTAR foi um dos girl groups mais populares da segunda geração do K-Pop, conhecido pelos hits de verão e pela imagem confiante e sensual.',
            'Este hub organiza as integrantes do SISTAR cadastradas no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do sistar', 'membros sistar', 'sistar kpop', 'sistar so cool'],
        faq: [
            { question: 'SISTAR ainda está ativo?', answer: 'SISTAR anunciou a dissolução em 2017, mas as integrantes seguiram carreiras individuais como cantoras, atrizes e apresentadoras.' },
            { question: 'Quais são os maiores hits do SISTAR?', answer: 'Os maiores hits do SISTAR incluem "So Cool" (2011), "Loving U" (2012), "Give It to Me" (2013) e "Shake It" (2015).' },
        ],
    },
    {
        slug: 'integrantes-do-astro',
        kind: 'artists',
        groupSlug: 'astro',
        title: 'Integrantes do ASTRO',
        shortTitle: 'ASTRO',
        description: 'Conheça os integrantes do ASTRO com perfis em português, carreira, músicas e a história do grupo da Fantagio.',
        intro: [
            'ASTRO é um grupo masculino da Fantagio Entertainment que construiu uma trajetória de fidelidade com seus fãs Aroha ao longo de sete anos de atividade.',
            'Este hub organiza os integrantes cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do astro', 'membros astro', 'astro kpop', 'astro aroha'],
        faq: [
            { question: 'ASTRO ainda está ativo?', answer: 'O ASTRO entrou em pausa indefinida após o falecimento de Moon Bin (Moonbin) em abril de 2023. Os demais integrantes seguem com carreiras individuais.' },
            { question: 'Quem são os integrantes do ASTRO?', answer: 'O ASTRO era composto por MJ, JinJin, Cha Eun-woo, Moon Bin, Rocky e Sanha.' },
        ],
    },
    {
        slug: 'integrantes-do-victon',
        kind: 'artists',
        groupSlug: 'victon',
        title: 'Integrantes do VICTON',
        shortTitle: 'VICTON',
        description: 'Conheça os integrantes do VICTON com perfis em português, carreira, músicas e curiosidades sobre o grupo.',
        intro: [
            'VICTON é um grupo masculino da Play M Entertainment que ganhou notoriedade pelo vocal poderoso e por participações em reality shows de competição.',
            'Este hub organiza os integrantes do VICTON cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do victon', 'membros victon', 'victon kpop', 'victon produce x 101'],
        faq: [
            { question: 'Por que VICTON ficou mais popular?', answer: 'Han Seung-woo e Byungchan participaram do reality Produce X 101 em 2019, aumentando significativamente a visibilidade do grupo.' },
            { question: 'Quantos integrantes tem o VICTON?', answer: 'O VICTON conta com 7 integrantes: Seungwoo, Subin, Hanse, Sejun, Byungchan, Changsik e Dohkwang.' },
        ],
    },
    {
        slug: 'integrantes-do-ss501',
        kind: 'artists',
        groupSlug: 'ss501',
        title: 'Integrantes do SS501',
        shortTitle: 'SS501',
        description: 'Conheça os integrantes do SS501 com perfis em português, carreira, músicas e curiosidades sobre o grupo pioneiro.',
        intro: [
            'SS501 foi um dos grupos masculinos mais populares da segunda geração do K-Pop, com forte presença no Japão e fanbase leal ao redor do mundo.',
            'Este hub organiza os integrantes do SS501 cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['integrantes do ss501', 'membros ss501', 'ss501 kpop', 'kim hyun joong ss501'],
        faq: [
            { question: 'SS501 ainda está ativo?', answer: 'SS501 não tem atividades conjuntas regulares atualmente, mas os integrantes reconhecem o vínculo com o grupo e os fãs Triple S continuam ativos.' },
            { question: 'Quem é o mais famoso do SS501?', answer: 'Kim Hyun-joong é o membro mais conhecido internacionalmente, após ter protagonizado o drama "Boys Over Flowers" em 2009.' },
        ],
    },

    // ── Categorias temáticas novas ─────────────────────────────────────────────
    {
        slug: 'grupos-masculinos-kpop',
        kind: 'groups',
        title: 'Grupos masculinos de K-Pop',
        shortTitle: 'Boy groups',
        description: 'Explore boy groups de K-Pop com integrantes, discografia, carreira, vídeos e perfis completos em português.',
        intro: [
            'Boy groups são uma das grandes forças do K-Pop global, com choreografias complexas, conceitos visuais marcantes e fandoms extremamente ativos.',
            'Aqui você encontra grupos masculinos com links para integrantes, músicas, vídeos e páginas relacionadas dentro do HallyuHub.',
        ],
        keywords: ['boy groups kpop', 'grupos masculinos kpop', 'kpop masculino', 'integrantes boy group'],
        faq: [
            { question: 'O que é um boy group de K-Pop?', answer: 'É um grupo masculino da indústria coreana, normalmente formado por idols com foco em música, performance, conceitos visuais e fandom.' },
            { question: 'O hub inclui grupos ativos e inativos?', answer: 'Sim. A lista pode incluir grupos ativos, inativos ou dissolvidos quando têm relevância cultural e perfil público no HallyuHub.' },
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
        slug: 'doramas-amazon-prime',
        kind: 'productions',
        title: 'Doramas coreanos no Amazon Prime',
        shortTitle: 'Doramas no Prime',
        description: 'Descubra doramas coreanos no Amazon Prime Video com sinopse, elenco, avaliação e links para artistas.',
        intro: [
            'O Amazon Prime Video tem ampliado seu catálogo de K-Dramas, levando séries coreanas a públicos que ainda não acompanhavam o gênero.',
            'Este hub reúne produções coreanas associadas ao Prime Video, com páginas em português para entender elenco, sinopse e contexto de cada título.',
        ],
        keywords: ['doramas amazon prime', 'kdramas prime video', 'doramas coreanos amazon', 'séries coreanas prime'],
        faq: [
            { question: 'Todos os doramas deste hub estão disponíveis no Prime Video?', answer: 'A disponibilidade pode variar por país e data. O hub reúne produções coreanas associadas ao Amazon Prime ou marcadas no catálogo com presença na plataforma.' },
            { question: 'O HallyuHub informa onde assistir?', answer: 'Quando há dados disponíveis, as páginas de produção mostram plataformas, elenco, sinopse e contexto editorial para ajudar na descoberta.' },
        ],
    },
    {
        slug: 'doramas-historicos-coreanos',
        kind: 'productions',
        title: 'Doramas históricos coreanos',
        shortTitle: 'Doramas históricos',
        description: 'Descubra sageuk e doramas históricos coreanos com sinopse, elenco, períodos históricos e avaliações em português.',
        intro: [
            'Os doramas históricos — conhecidos como sageuk — são uma das formas mais ricas de conhecer a história e a cultura da Coreia, misturando política, romance e batalhas épicas.',
            'Este hub reúne produções históricas coreanas catalogadas no HallyuHub, com páginas em português para explorar enredo, elenco e contexto histórico.',
        ],
        keywords: ['doramas históricos coreanos', 'sageuk', 'kdrama histórico', 'doramas época coreana'],
        faq: [
            { question: 'O que é um sageuk?', answer: 'Sageuk é o nome coreano para dramas de época, normalmente ambientados nas dinastias Joseon, Goryeo ou Silla, mesclando história real com ficção.' },
            { question: 'Quais períodos históricos aparecem nos doramas?', answer: 'Os doramas históricos geralmente se passam na Dinastia Joseon (1392-1897), mas há produções em outros períodos como Goryeo e nos anos coloniais.' },
        ],
    },

    {
        slug: 'baekhyun',
        kind: 'artists',
        title: 'Baekhyun — EXO',
        shortTitle: 'Baekhyun',
        description: 'Perfil completo de Baekhyun: vocalista principal do EXO, carreira solo, supergrupo EXO-CBX e discografia completa.',
        intro: [
            'Byun Baek-hyun, conhecido como Baekhyun, é o vocalista principal do EXO e um dos solistas masculinos de K-Pop com mais streams. Seu timbre inconfundível e presença vocal o colocam entre os melhores cantores do gênero.',
            'Com álbuns solo como "City Lights" (2019) e "Delight" (2020), Baekhyun bateu recordes de vendas para artistas solo masculinos e ampliou sua base de fãs internacional.',
        ],
        keywords: ['Baekhyun', 'EXO Baekhyun', 'Baekhyun solo', 'Byun Baekhyun', 'EXO CBX', 'Baekhyun City Lights'],
        faq: [
            { question: 'Baekhyun ainda é membro do EXO?', answer: 'Sim. Baekhyun é membro do EXO desde o debut do grupo em 2012. Ele também é parte do subgrupo EXO-CBX (com Chen e Xiumin) e tem carreira solo ativa.' },
            { question: 'Quais são os maiores hits solo de Baekhyun?', answer: 'Os maiores hits solo de Baekhyun incluem "UN Village" (2019), "Candy" (2019), "Psycho" (2020) e "Bambi" (2021). Seu mini-álbum "Delight" foi o mais vendido por um artista solo coreano masculino em 2020.' },
        ],
    },

    // ── Hubs temáticos de alta demanda de busca ────────────────────────────────
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
        slug: 'doramas-romanticos',
        kind: 'productions',
        title: 'Doramas coreanos românticos',
        shortTitle: 'Doramas românticos',
        description: 'Descubra os melhores doramas românticos coreanos com sinopse, elenco, avaliação e onde assistir.',
        intro: [
            'Os romances coreanos definiram um gênero único no mundo: com OSTs inesquecíveis, química de elenco, e histórias que equilibram drama e leveza de forma incomum.',
            'Este hub reúne produções coreanas de romance catalogadas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas românticos', 'kdramas românticos', 'doramas de romance coreano', 'romance coreano netflix'],
        faq: [
            { question: 'O que faz um bom dorama romântico coreano?', answer: 'Um bom dorama romântico coreano combina química entre os protagonistas, um OST marcante, conflitos emocionais bem desenvolvidos e a famosa lentidão intencional que cria tensão antes do casal se unir.' },
            { question: 'Qual plataforma tem mais doramas românticos?', answer: 'Netflix, Disney+ e Amazon Prime têm crescido muito no catálogo de K-Dramas românticos, mas plataformas asiáticas como Viki e Kocowa ainda têm os maiores acervos históricos.' },
        ],
    },
    {
        slug: 'grupos-kpop-4a-geracao',
        kind: 'groups',
        title: 'Grupos de K-Pop da 4ª geração',
        shortTitle: 'K-Pop 4ª geração',
        description: 'Conheça os grupos de K-Pop da quarta geração com perfis em português, integrantes, carreira e músicas.',
        intro: [
            'A quarta geração do K-Pop trouxe grupos que debutaram a partir de 2018 e redefiniu a relação entre artistas e fãs com mais interatividade digital e conceitos mais variados.',
            'Este hub reúne grupos da 4ª geração cadastrados no HallyuHub para facilitar a descoberta de integrantes, carreira e conteúdos relacionados.',
        ],
        keywords: ['kpop 4a geração', '4th gen kpop', 'grupos kpop novos', 'kpop 2020 2021 2022'],
        faq: [
            { question: 'Quando começou a 4ª geração do K-Pop?', answer: 'A 4ª geração do K-Pop é geralmente considerada como iniciada entre 2018 e 2020, com grupos como ATEEZ, Stray Kids, ITZY, aespa e TXT entre os mais representativos.' },
            { question: 'O que diferencia a 4ª geração?', answer: 'A 4ª geração se destaca pela forte presença nas redes sociais, conceitos mais sombrios ou experimentais, diversidade de países de origem dos integrantes e conexão direta com fãs via plataformas digitais.' },
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

    // ── Hubs por agência ───────────────────────────────────────────────────────
    {
        slug: 'artistas-jyp-entertainment',
        kind: 'artists',
        agencyName: 'JYP Entertainment',
        title: 'Artistas da JYP Entertainment',
        shortTitle: 'JYP',
        description: 'Conheça artistas e grupos da JYP Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'JYP Entertainment é uma das três grandes gravadoras do K-Pop, fundada por Park Jin-young em 1997, com um portfólio que inclui TWO. PM, TWICE, ITZY, Stray Kids, aespa e muitos outros.',
            'Este hub reúne artistas e grupos vinculados à JYP cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas jyp entertainment', 'grupos jyp kpop', 'jyp kpop', 'jyp artistas'],
        faq: [
            { question: 'Quais são os maiores grupos da JYP?', answer: 'Os maiores grupos da JYP Entertainment incluem TWICE, Stray Kids, ITZY, 2PM, 2AM, miss A, Wonder Girls, Got7 e Day6.' },
            { question: 'Quem fundou a JYP Entertainment?', answer: 'A JYP Entertainment foi fundada em 1997 pelo cantor e produtor Park Jin-young, que também é responsável pelo desenvolvimento artístico de vários grupos da empresa.' },
        ],
    },
    {
        slug: 'artistas-sm-entertainment',
        kind: 'artists',
        agencyName: 'SM Entertainment',
        title: 'Artistas da SM Entertainment',
        shortTitle: 'SM',
        description: 'Conheça artistas e grupos da SM Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'SM Entertainment é pioneira do K-Pop moderno, fundada por Lee Soo-man em 1995, responsável por moldar o conceito de idol system que influencia toda a indústria.',
            'Este hub reúne artistas e grupos vinculados à SM cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas sm entertainment', 'grupos sm kpop', 'sm entertainment kpop', 'sm artistas'],
        faq: [
            { question: 'Quais são os maiores grupos da SM?', answer: 'Os maiores grupos da SM Entertainment incluem EXO, NCT/NCT 127/NCT Dream/WayV, aespa, Red Velvet, SHINee, Girls\' Generation, Super Junior e TVXQ.' },
            { question: 'Por que a SM é importante para o K-Pop?', answer: 'A SM Entertainment foi pioneira no modelo de treinamento intensivo de idols e na internacionalização do K-Pop, influenciando todas as grandes gravadoras do gênero.' },
        ],
    },
    {
        slug: 'artistas-yg-entertainment',
        kind: 'artists',
        agencyName: 'YG Entertainment',
        title: 'Artistas da YG Entertainment',
        shortTitle: 'YG',
        description: 'Conheça artistas e grupos da YG Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'YG Entertainment é conhecida pelo estilo hip-hop e streetwear no K-Pop, com uma lista de artistas que inclui BLACKPINK, BIGBANG, 2NE1, WINNER, iKON e TREASURE.',
            'Este hub reúne artistas e grupos vinculados à YG cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas yg entertainment', 'grupos yg kpop', 'yg entertainment kpop', 'yg artistas'],
        faq: [
            { question: 'Quais são os maiores grupos da YG?', answer: 'Os maiores grupos da YG Entertainment incluem BLACKPINK, BIGBANG, 2NE1, WINNER, iKON e TREASURE, além de artistas solo como G-Dragon e CL.' },
            { question: 'Qual é o estilo da YG?', answer: 'A YG Entertainment é conhecida por um estilo mais hip-hop, streetwear e urbano em relação às outras grandes gravadoras, com ênfase em composição própria e produção musical.' },
        ],
    },
    {
        slug: 'artistas-hybe',
        kind: 'artists',
        agencyName: 'BIGHIT MUSIC',
        title: 'Artistas da HYBE (Big Hit)',
        shortTitle: 'HYBE',
        description: 'Conheça artistas e grupos da HYBE Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'HYBE (antiga Big Hit Entertainment) é a empresa por trás do BTS, o maior fenômeno do K-Pop global, e hoje abriga subsidiárias como BELIFT LAB, SOURCE MUSIC, ADOR e Pledis.',
            'Este hub reúne artistas e grupos vinculados à HYBE cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas hybe', 'grupos hybe kpop', 'big hit entertainment', 'hybe kpop artistas'],
        faq: [
            { question: 'Quais grupos fazem parte da HYBE?', answer: 'A HYBE abriga o BTS, TOMORROW X TOGETHER (TXT), BTS, ENHYPEN (BELIFT LAB), NewJeans (ADOR), LE SSERAFIM (SOURCE MUSIC), &TEAM e Seventeen (Pledis), entre outros.' },
            { question: 'O que é a diferença entre HYBE e Big Hit?', answer: 'Big Hit Entertainment foi renomeada para HYBE em 2021, após crescimento acelerado e aquisição de várias subsidiárias. A Big Hit Music continua como sublabel responsável pelo BTS e TXT.' },
        ],
    },
    {
        slug: 'artistas-pledis-entertainment',
        kind: 'artists',
        agencyName: 'Pledis Entertainment',
        title: 'Artistas da Pledis Entertainment',
        shortTitle: 'Pledis',
        description: 'Conheça artistas e grupos da Pledis Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'Pledis Entertainment, hoje parte do grupo HYBE, é responsável pelo Seventeen e NU\'EST, além de ex-artistas como After School e Orange Caramel.',
            'Este hub reúne artistas e grupos vinculados à Pledis cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas pledis entertainment', 'seventeen pledis', 'nuest pledis', 'pledis kpop'],
        faq: [
            { question: 'Quais são os maiores grupos da Pledis?', answer: 'Os maiores grupos da Pledis Entertainment são o Seventeen e o NU\'EST. A empresa também revelou After School e Orange Caramel.' },
            { question: 'A Pledis ainda é independente?', answer: 'Não. A Pledis Entertainment foi adquirida pela HYBE (antiga Big Hit Entertainment) em 2020, mas opera como sublabel mantendo seus artistas e identidade.' },
        ],
    },
    {
        slug: 'artistas-cube-entertainment',
        kind: 'artists',
        agencyName: 'Cube Entertainment',
        title: 'Artistas da Cube Entertainment',
        shortTitle: 'Cube',
        description: 'Conheça artistas e grupos da Cube Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'Cube Entertainment é conhecida por grupos como (G)I-DLE, BTOB, HyunA e vários artistas que ajudaram a definir o K-Pop das 2ª e 3ª gerações.',
            'Este hub reúne artistas e grupos vinculados à Cube cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas cube entertainment', 'gidle cube', 'btob cube', 'cube kpop'],
        faq: [
            { question: 'Quais são os maiores grupos da Cube?', answer: 'Os maiores grupos da Cube Entertainment incluem (G)I-DLE, BTOB, CLC, 4Minute e Pentagon, além de artistas solo como HyunA.' },
        ],
    },
    {
        slug: 'artistas-starship-entertainment',
        kind: 'artists',
        agencyName: 'Starship Entertainment',
        title: 'Artistas da Starship Entertainment',
        shortTitle: 'Starship',
        description: 'Conheça artistas e grupos da Starship Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'Starship Entertainment é a gravadora por trás do Monsta X, Kep1er, SISTAR e outros grupos que marcaram diferentes gerações do K-Pop.',
            'Este hub reúne artistas e grupos vinculados à Starship cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas starship entertainment', 'monsta x starship', 'sistar starship', 'starship kpop'],
        faq: [
            { question: 'Quais são os maiores grupos da Starship?', answer: 'Os maiores grupos da Starship Entertainment incluem Monsta X, SISTAR (dissolvido em 2017), Kep1er, Cravity e os artistas solo Shownu e Joohoney.' },
        ],
    },
    {
        slug: 'artistas-fnc-entertainment',
        kind: 'artists',
        agencyName: 'FNC Entertainment',
        title: 'Artistas da FNC Entertainment',
        shortTitle: 'FNC',
        description: 'Conheça artistas e grupos da FNC Entertainment com perfis em português, carreira, músicas e curiosidades.',
        intro: [
            'FNC Entertainment é conhecida por grupos como FTISLAND, CNBlue, AOA e N.Flying, com forte identidade de banda ao vivo e rock coreano.',
            'Este hub reúne artistas e grupos vinculados à FNC cadastrados no HallyuHub para facilitar a navegação por perfis e conteúdos relacionados.',
        ],
        keywords: ['artistas fnc entertainment', 'ftisland fnc', 'cnblue fnc', 'fnc kpop'],
        faq: [
            { question: 'O que diferencia a FNC das outras gravadoras?', answer: 'A FNC Entertainment é conhecida por trabalhar com bandas ao vivo (FTISLAND, CNBlue, N.Flying) além de grupos de performance, o que a diferencia da maioria das gravadoras focadas apenas em idol groups.' },
        ],
    },

    // ── Hubs por ano de lançamento (doramas) ──────────────────────────────────
    {
        slug: 'doramas-coreanos-2025',
        kind: 'productions',
        year: 2025,
        title: 'Doramas coreanos 2025',
        shortTitle: 'K-Dramas 2025',
        description: 'Os melhores doramas coreanos lançados em 2025 com sinopse, elenco, plataformas e avaliações em português.',
        intro: [
            '2025 continua sendo um ano prolífico para os K-Dramas, com lançamentos em plataformas globais como Netflix, Disney+ e Amazon Prime.',
            'Este hub reúne produções coreanas de 2025 cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas 2025', 'kdramas 2025', 'doramas coreanos novos 2025', 'melhores doramas 2025'],
        faq: [
            { question: 'Onde assistir doramas coreanos em 2025?', answer: 'Os principais doramas de 2025 estão disponíveis no Netflix, Disney+, Amazon Prime Video, Viki e Kocowa, dependendo do título e da sua região.' },
            { question: 'Quais são os doramas mais esperados de 2025?', answer: 'O HallyuHub lista os principais lançamentos de doramas de 2025 com avaliações, sinopse e links para elenco completo.' },
        ],
    },
    {
        slug: 'doramas-coreanos-2024',
        kind: 'productions',
        year: 2024,
        title: 'Doramas coreanos 2024',
        shortTitle: 'K-Dramas 2024',
        description: 'Os melhores doramas coreanos lançados em 2024 com sinopse, elenco, plataformas e avaliações em português.',
        intro: [
            '2024 foi um ano marcante para os K-Dramas, com lançamentos que conquistaram audiências globais e debutaram nas listas de mais assistidos do mundo.',
            'Este hub reúne produções coreanas de 2024 cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas 2024', 'kdramas 2024', 'melhores doramas 2024', 'doramas coreanos 2024'],
        faq: [
            { question: 'Quais foram os melhores doramas de 2024?', answer: 'O HallyuHub lista os principais doramas de 2024 ordenados por avaliação, com sinopse e links para elenco completo em português.' },
            { question: 'Onde assistir os doramas de 2024?', answer: 'A maioria dos doramas de 2024 está disponível no Netflix, Disney+ e Viki. Alguns títulos mais antigos também estão no Amazon Prime Video.' },
        ],
    },
    {
        slug: 'doramas-coreanos-2023',
        kind: 'productions',
        year: 2023,
        title: 'Doramas coreanos 2023',
        shortTitle: 'K-Dramas 2023',
        description: 'Os melhores doramas coreanos lançados em 2023 com sinopse, elenco, plataformas e avaliações em português.',
        intro: [
            '2023 trouxe doramas que marcaram gerações de fãs e confirmaram a consolidação dos K-Dramas como um dos gêneros mais consumidos do mundo.',
            'Este hub reúne produções coreanas de 2023 cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas 2023', 'kdramas 2023', 'melhores doramas 2023', 'doramas coreanos 2023'],
        faq: [
            { question: 'Quais foram os melhores doramas de 2023?', answer: 'O HallyuHub lista os principais doramas de 2023 ordenados por avaliação, incluindo títulos que foram destaque no Netflix e outras plataformas.' },
        ],
    },
    {
        slug: 'doramas-coreanos-2022',
        kind: 'productions',
        year: 2022,
        title: 'Doramas coreanos 2022',
        shortTitle: 'K-Dramas 2022',
        description: 'Os melhores doramas coreanos lançados em 2022 com sinopse, elenco, plataformas e avaliações em português.',
        intro: [
            '2022 foi o primeiro ano pós-pandemia com produção plena de K-Dramas, trazendo títulos que rapidamente se tornaram clássicos modernos do gênero.',
            'Este hub reúne produções coreanas de 2022 cadastradas no HallyuHub, com páginas em português para entender elenco, sinopse e onde assistir.',
        ],
        keywords: ['doramas 2022', 'kdramas 2022', 'melhores doramas 2022', 'doramas coreanos 2022'],
        faq: [
            { question: 'Quais foram os melhores doramas de 2022?', answer: 'O HallyuHub lista os principais doramas de 2022 com avaliação, sinopse e elenco completo em português para ajudar você a escolher o próximo.' },
        ],
    },

    // ── PILOTO INTERNACIONAL: hubs traduzidos (locale + i18nKey ligam à versão pt) ──
    {
        slug: 'bts-members',
        kind: 'artists',
        groupSlug: 'bts',
        locale: 'en',
        i18nKey: 'bts-members',
        title: 'BTS Members',
        shortTitle: 'BTS',
        description: 'Meet the members of BTS — profiles, solo careers, music, videos and trivia, curated by HallyuHub.',
        intro: [
            'BTS is one of the most influential K-pop acts worldwide, and each member brings a distinct artistic identity — from rap and production to vocals and choreography.',
            'This hub gathers member profiles so you can explore their individual journeys, group history and connected releases in one place.',
        ],
        keywords: ['bts members', 'bts lineup', 'bts profiles', 'bangtan boys members', 'kpop bts'],
        faq: [
            { question: 'Who are the members of BTS?', answer: 'BTS is composed of RM, Jin, Suga, J-Hope, Jimin, V and Jungkook — each with an active solo career alongside group activities.' },
            { question: 'Does this hub include solo work?', answer: 'Yes. Member profiles highlight solo releases, acting work and other individual projects connected to their HallyuHub pages.' },
        ],
    },
    {
        slug: 'bts-integrantes',
        kind: 'artists',
        groupSlug: 'bts',
        locale: 'es',
        i18nKey: 'bts-members',
        title: 'Integrantes de BTS',
        shortTitle: 'BTS',
        description: 'Conoce a los integrantes de BTS — perfiles, carreras en solitario, música, videos y curiosidades, en HallyuHub.',
        intro: [
            'BTS es uno de los grupos de K-pop más influyentes del mundo, y cada integrante aporta una identidad artística propia: rap, producción, voz y coreografía.',
            'Este hub reúne los perfiles de los integrantes para explorar sus trayectorias individuales, la historia del grupo y sus lanzamientos relacionados en un solo lugar.',
        ],
        keywords: ['integrantes de bts', 'miembros de bts', 'perfiles bts', 'bangtan boys integrantes', 'kpop bts'],
        faq: [
            { question: '¿Quiénes son los integrantes de BTS?', answer: 'BTS está formado por RM, Jin, Suga, J-Hope, Jimin, V y Jungkook, cada uno con una carrera en solitario activa además de las actividades grupales.' },
            { question: '¿Este hub incluye trabajos en solitario?', answer: 'Sí. Los perfiles destacan lanzamientos en solitario, actuación y otros proyectos individuales conectados con sus páginas en HallyuHub.' },
        ],
    },
]

export const ARCHIVE_HUB_BY_SLUG = Object.fromEntries(ARCHIVE_HUBS.map(hub => [hub.slug, hub]))

export function getArchiveHub(slug: string) {
    return ARCHIVE_HUB_BY_SLUG[slug]
}

/** Hubs por idioma — pt = hubs sem `locale` (comportamento original) + os marcados explicitamente como 'pt'. */
export function getArchiveHubsByLocale(locale: 'pt' | 'en' | 'es') {
    if (locale === 'pt') return ARCHIVE_HUBS.filter(hub => !hub.locale || hub.locale === 'pt')
    return ARCHIVE_HUBS.filter(hub => hub.locale === locale)
}

export function getArchiveHubByLocaleAndSlug(locale: 'pt' | 'en' | 'es', slug: string) {
    const hub = ARCHIVE_HUB_BY_SLUG[slug]
    if (!hub) return undefined
    const hubLocale = hub.locale ?? 'pt'
    return hubLocale === locale ? hub : undefined
}

/** Encontra a versão de um hub em outro idioma, via i18nKey compartilhado — usado só para montar hreflang cruzado. */
export function getTranslatedHub(hub: ArchiveHub, targetLocale: 'pt' | 'en' | 'es'): ArchiveHub | undefined {
    if (!hub.i18nKey) return undefined
    return ARCHIVE_HUBS.find(h => h.i18nKey === hub.i18nKey && (h.locale ?? 'pt') === targetLocale)
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
        input.gender === 2 && isSinger ? 'cantores-kpop' : null,
        input.gender === 1 && isActor ? 'atrizes-coreanas' : null,
        input.gender === 2 && isActor ? 'atores-coreanos' : null,
        isSinger ? 'kpop-idols-famosos' : null,
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
        maleMembers > femaleMembers ? 'grupos-masculinos-kpop' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}

export function getRelatedProductionHubs(input: { streamingPlatforms?: string[] | null; network?: string | null; tags?: string[] | null }) {
    const values = [
        ...(input.streamingPlatforms ?? []),
        input.network ?? '',
        ...(input.tags ?? []),
    ].map(value => value.toLowerCase())
    const slugs = [
        values.some(v => v.includes('netflix')) ? 'doramas-coreanos-netflix' : null,
        values.some(v => v.includes('prime') || v.includes('amazon')) ? 'doramas-amazon-prime' : null,
        values.some(v => v.includes('histor') || v.includes('sageuk') || v.includes('joseon') || v.includes('goryeo')) ? 'doramas-historicos-coreanos' : null,
        values.some(v => v.includes('roman') || v.includes('rom-com') || v.includes('romance')) ? 'doramas-romanticos' : null,
    ].filter(Boolean) as string[]
    return slugs.map(slug => ARCHIVE_HUB_BY_SLUG[slug]).filter(Boolean)
}
