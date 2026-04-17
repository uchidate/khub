export interface BlogCategoryConfig {
    /** Display name shown in UI */
    name: string
    /** URL-safe slug matching BlogCategory.slug in DB */
    slug: string
    /** Accent color (hex) for badges, dots, labels */
    color: string
    /** Soft background color (hex) for pill badges */
    bg: string
}

/**
 * Canonical list of blog categories — única fonte de verdade.
 * A ordem define a exibição nos filtros do blog e na HomeBlogFeed.
 * Os slugs devem corresponder aos registros de BlogCategory no banco de dados.
 *
 * Taxonomia em 2 camadas:
 *   Camada 1 → estas 9 categorias (uma por artigo, drive navegação)
 *   Camada 2 → tags de lib/config/tags.ts (2–4 por artigo, vocabulário controlado)
 */
export const BLOG_CATEGORIES: BlogCategoryConfig[] = [
    { name: 'K-pop',         slug: 'k-pop',          color: '#ec4899', bg: '#fce7f3' },
    { name: 'K-drama',       slug: 'k-drama',         color: '#8b5cf6', bg: '#ede9fe' },
    { name: 'K-film',        slug: 'k-film',          color: '#0ea5e9', bg: '#e0f2fe' },
    { name: 'K-beauty',      slug: 'k-beauty',        color: '#f59e0b', bg: '#fef3c7' },
    { name: 'Reality Shows', slug: 'reality-shows',   color: '#f97316', bg: '#ffedd5' },
    { name: 'Webtoons',      slug: 'webtoons',        color: '#10b981', bg: '#d1fae5' },
    { name: 'Grupos',        slug: 'grupos',          color: '#a855f7', bg: '#f3e8ff' },
    { name: 'Artistas',      slug: 'artistas',        color: '#f43f5e', bg: '#ffe4e6' },
    { name: 'Cultura',       slug: 'cultura',         color: '#06b6d4', bg: '#cffafe' },
]

/**
 * Subset exibido nos tabs da HomeBlogFeed.
 * Mantém a home limpa — todas as 9 categorias ficam disponíveis no /blog.
 */
export const HOME_FEED_CATEGORIES = ['k-pop', 'k-drama', 'grupos', 'reality-shows', 'cultura']

/** Lookup por slug — acesso O(1) para filtros de blog */
export const BLOG_CATEGORY_BY_SLUG = Object.fromEntries(
    BLOG_CATEGORIES.map(c => [c.slug, c])
) as Record<string, BlogCategoryConfig>

/** Apenas os nomes — para componentes que não precisam do slug */
export const BLOG_CATEGORY_NAMES = BLOG_CATEGORIES.map(c => c.name)
