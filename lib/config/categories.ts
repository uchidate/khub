export interface BlogCategoryConfig {
    /** Display name shown in UI */
    name: string
    /** URL-safe slug matching BlogCategory.slug in DB */
    slug: string
}

/**
 * Canonical list of blog categories — única fonte de verdade.
 * A ordem define a exibição na HomeCategoriesBar e nos filtros do blog.
 * Os slugs devem corresponder aos registros de BlogCategory no banco de dados.
 */
export const BLOG_CATEGORIES: BlogCategoryConfig[] = [
    { name: 'K-pop',         slug: 'k-pop' },
    { name: 'K-drama',       slug: 'k-drama' },
    { name: 'K-film',        slug: 'k-film' },
    { name: 'K-beauty',      slug: 'k-beauty' },
    { name: 'Artistas solo', slug: 'artistas-solo' },
    { name: 'Grupos',        slug: 'grupos' },
    { name: 'Reality shows', slug: 'reality-shows' },
    { name: 'Webtoons',      slug: 'webtoons' },
    { name: 'Idol culture',  slug: 'idol-culture' },
    { name: 'Fandom',        slug: 'fandom' },
]

/** Lookup por slug — acesso O(1) para filtros de blog */
export const BLOG_CATEGORY_BY_SLUG = Object.fromEntries(
    BLOG_CATEGORIES.map(c => [c.slug, c])
) as Record<string, BlogCategoryConfig>

/** Apenas os nomes — para componentes que não precisam do slug */
export const BLOG_CATEGORY_NAMES = BLOG_CATEGORIES.map(c => c.name)
