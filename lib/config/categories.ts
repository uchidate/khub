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
 * A ordem define a exibição na HomeCategoriesBar e nos filtros do blog.
 * Os slugs devem corresponder aos registros de BlogCategory no banco de dados.
 */
export const BLOG_CATEGORIES: BlogCategoryConfig[] = [
    { name: 'K-pop',         slug: 'k-pop',          color: '#ec4899', bg: '#fce7f3' },
    { name: 'K-drama',       slug: 'k-drama',         color: '#8b5cf6', bg: '#ede9fe' },
    { name: 'K-film',        slug: 'k-film',          color: '#0ea5e9', bg: '#e0f2fe' },
    { name: 'K-beauty',      slug: 'k-beauty',        color: '#f59e0b', bg: '#fef3c7' },
    { name: 'Artistas solo', slug: 'artistas-solo',   color: '#f43f5e', bg: '#ffe4e6' },
    { name: 'Grupos',        slug: 'grupos',          color: '#a855f7', bg: '#f3e8ff' },
    { name: 'Reality shows', slug: 'reality-shows',   color: '#f97316', bg: '#ffedd5' },
    { name: 'Webtoons',      slug: 'webtoons',        color: '#10b981', bg: '#d1fae5' },
    { name: 'Idol culture',  slug: 'idol-culture',    color: '#d946ef', bg: '#fae8ff' },
    { name: 'Fandom',        slug: 'fandom',          color: '#6366f1', bg: '#e0e7ff' },
]

/** Lookup por slug — acesso O(1) para filtros de blog */
export const BLOG_CATEGORY_BY_SLUG = Object.fromEntries(
    BLOG_CATEGORIES.map(c => [c.slug, c])
) as Record<string, BlogCategoryConfig>

/** Apenas os nomes — para componentes que não precisam do slug */
export const BLOG_CATEGORY_NAMES = BLOG_CATEGORIES.map(c => c.name)
