export type SearchShortcut = {
    id: string
    title: string
    description: string
    href: string
    kind: 'section' | 'feature'
    keywords: string[]
}

const normalize = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

export const SEARCH_SHORTCUTS: SearchShortcut[] = [
    {
        id: 'discover',
        title: 'Descobrir',
        description: 'Entrada principal com destaques, leituras, artistas e recomendações.',
        href: '/',
        kind: 'section',
        keywords: ['descobrir', 'inicio', 'início', 'home', 'destaques', 'recomendacoes', 'recomendações'],
    },
    {
        id: 'blog',
        title: 'Artigos',
        description: 'Leituras, análises e novidades editoriais do HallyuHub.',
        href: '/blog',
        kind: 'section',
        keywords: ['artigos', 'blog', 'materias', 'noticias', 'editorial', 'leituras'],
    },
    {
        id: 'artists',
        title: 'Artistas',
        description: 'Perfis, filmografia, grupos, discografia e favoritos.',
        href: '/artists',
        kind: 'section',
        keywords: ['artistas', 'atores', 'atrizes', 'idols', 'cantores', 'pessoas', 'perfil'],
    },
    {
        id: 'groups',
        title: 'Grupos',
        description: 'Grupos de K-pop, integrantes, discografia e trajetória.',
        href: '/groups',
        kind: 'section',
        keywords: ['grupos', 'kpop', 'k-pop', 'bands', 'idols', 'integrantes', 'discografia'],
    },
    {
        id: 'productions',
        title: 'Dramas & Filmes',
        description: 'K-dramas, filmes, avaliações, elenco e onde assistir.',
        href: '/productions',
        kind: 'section',
        keywords: ['dramas', 'filmes', 'producoes', 'produções', 'kdrama', 'k-drama', 'series', 'séries'],
    },
    {
        id: 'calendar',
        title: 'Agenda',
        description: 'Aniversários, lançamentos recentes e próximos dramas.',
        href: '/calendario',
        kind: 'feature',
        keywords: ['agenda', 'calendario', 'calendário', 'aniversarios', 'aniversários', 'lancamentos', 'lançamentos', 'datas'],
    },
    {
        id: 'shop',
        title: 'Loja',
        description: 'Produtos K-pop, K-beauty, K-drama, álbuns e acessórios.',
        href: '/loja',
        kind: 'feature',
        keywords: ['loja', 'comprar', 'shopping', 'produtos', 'kbeauty', 'k-beauty', 'album', 'álbum', 'lightstick', 'photocard', 'snacks'],
    },
]

export function searchShortcuts(searchTerm: string, limit = 4) {
    const term = normalize(searchTerm.trim())
    if (term.length < 2) return []

    return SEARCH_SHORTCUTS
        .filter(shortcut => {
            const haystack = normalize([
                shortcut.title,
                shortcut.description,
                ...shortcut.keywords,
            ].join(' '))
            return haystack.includes(term) || term.split(/\s+/).some(part => part.length > 2 && haystack.includes(part))
        })
        .slice(0, limit)
}
