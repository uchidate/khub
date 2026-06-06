import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { withLogging } from '@/lib/server/withLogging'
import { searchShortcuts } from '@/lib/config/search-shortcuts'
import { searchProductionsUnaccent, searchArtistsUnaccent, searchGroupsUnaccent, searchBlogPostsUnaccent, searchStoreProductsUnaccent } from '@/lib/utils/search-unaccent'

const log = createLogger('SEARCH')

export const dynamic = 'force-dynamic'

export const GET = withLogging(async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.SEARCH_GLOBAL)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const types = searchParams.get('types')?.split(',') || ['artists', 'groups', 'productions', 'articles', 'products', 'shortcuts']
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '5')))

    if (!query || query.trim().length < 2) {
        return NextResponse.json({
            artists: [],
            groups: [],
            shortcuts: [],
            storeProducts: [],
            productions: [],
            articles: [],
            total: 0,
            query: query || ''
        })
    }

    const searchTerm = query.trim()

    try {
        // Aplicar filtro de classificação etária
        const ageRatingFilter = await applyAgeRatingFilter()

        const [artists, productions, groups, articles, storeProducts] = await Promise.all([
            types.includes('artists')
                ? searchArtistsUnaccent(searchTerm, limit)
                : [],
            types.includes('productions')
                ? searchProductionsUnaccent(searchTerm, { limit, ageRatingFilter })
                : [],
            types.includes('groups')
                ? searchGroupsUnaccent(searchTerm, limit)
                : [],
            types.includes('articles')
                ? searchBlogPostsUnaccent(searchTerm, limit)
                : [],
            types.includes('products')
                ? searchStoreProductsUnaccent(searchTerm, limit)
                : [],
        ])
        const shortcuts = types.includes('shortcuts') ? searchShortcuts(searchTerm, 4) : []

        const total = artists.length + productions.length + groups.length + articles.length + storeProducts.length + shortcuts.length

        return NextResponse.json({
            shortcuts,
            artists,
            groups,
            articles,
            productions,
            storeProducts,
            total,
            query: searchTerm
        }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })

    } catch (error: unknown) {
        log.error('Error in global search', { error: getErrorMessage(error) })
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        )
    }
})
