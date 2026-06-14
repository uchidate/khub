export const SPONSORED_TAGS = new Set(['patrocinado', 'parceria', 'sponsored', 'publi'])

export type AdSenseEligibilityInput = {
    adsDisabled?: boolean | null
    isSponsored?: boolean | null
    isIndexable?: boolean | null
    isThinContent?: boolean | null
    isAdultContent?: boolean | null
}

export function shouldServeAdSense({
    adsDisabled,
    isSponsored,
    isIndexable = true,
    isThinContent,
    isAdultContent,
}: AdSenseEligibilityInput) {
    return !adsDisabled
        && !isSponsored
        && isIndexable !== false
        && !isThinContent
        && !isAdultContent
}

export function hasSponsoredTag(tags: string[] = []) {
    return tags.some(tag => SPONSORED_TAGS.has(tag.trim().toLowerCase()))
}

export function getBlogAdChannel(options: {
    categorySlug?: string | null
    tags?: string[]
    hasRating?: boolean
}) {
    const category = options.categorySlug?.trim().toLowerCase()
    const tags = (options.tags ?? []).map(tag => tag.trim().toLowerCase())

    if (options.hasRating || tags.some(tag => ['review', 'resenha', 'critica', 'crítica'].includes(tag))) return 'blog-review'
    if (category && ['news', 'noticias', 'notícias'].includes(category)) return 'blog-news'
    if (tags.some(tag => ['guia', 'lista', 'ranking', 'melhores', 'evergreen'].includes(tag))) return 'blog-evergreen'
    if (category) return `blog-${category}`
    return 'blog-general'
}

export function getProductionAdChannel(options: {
    type?: string | null
    streamingPlatforms?: string[] | null
}) {
    const type = options.type?.toLowerCase()
    const hasStreaming = (options.streamingPlatforms?.length ?? 0) > 0
    if (hasStreaming) return 'production-streaming'
    if (type?.includes('movie') || type?.includes('filme')) return 'production-movie'
    if (type?.includes('drama') || type?.includes('tv') || type?.includes('series')) return 'production-kdrama'
    return 'production-profile'
}

export function getArtistAdChannel(options: {
    roles?: string[] | null
    hasPrimaryImage?: boolean | null
    hasBio?: boolean | null
    hasProductions?: boolean | null
    hasMusicCatalog?: boolean | null
}) {
    const roles = (options.roles ?? []).map(role => role.toLowerCase())
    const highIntent = options.hasPrimaryImage && options.hasBio && (options.hasProductions || options.hasMusicCatalog)
    if (highIntent) return 'artist-high-intent'
    if (roles.some(role => role.includes('actor') || role.includes('atriz') || role.includes('ator'))) return 'artist-acting'
    if (roles.some(role => role.includes('singer') || role.includes('idol') || role.includes('cantor'))) return 'artist-music'
    return 'artist-profile'
}
