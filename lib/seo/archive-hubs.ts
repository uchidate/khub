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
    {
        slug: 'integrantes-do-bts',
        kind: 'artists',
        groupSlug: 'bts',
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
    return values.some(value => value.includes('netflix'))
        ? [ARCHIVE_HUB_BY_SLUG['doramas-coreanos-netflix']]
        : []
}
