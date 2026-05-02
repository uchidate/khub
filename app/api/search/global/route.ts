import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { withLogging } from '@/lib/server/withLogging'
import { searchProductionsUnaccent, searchArtistsUnaccent, searchGroupsUnaccent, searchBlogPostsUnaccent } from '@/lib/utils/search-unaccent'

const log = createLogger('SEARCH')

export const dynamic = 'force-dynamic'

export const GET = withLogging(async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.SEARCH_GLOBAL)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const types = searchParams.get('types')?.split(',') || ['artists', 'productions', 'articles']
    const limit = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '5')))

    if (!query || query.trim().length < 2) {
        return NextResponse.json({
            artists: [],
            groups: [],
            news: [],
            productions: [],
            total: 0,
            query: query || ''
        })
    }

    const searchTerm = query.trim()

    try {
        // Aplicar filtro de classificação etária
        const ageRatingFilter = await applyAgeRatingFilter()

        const [artists, productions, groups, articles] = await Promise.all([
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
        ])

        const total = artists.length + productions.length + groups.length + articles.length

        return NextResponse.json({
            artists,
            groups,
            articles,
            productions,
            total,
            query: searchTerm
        })

    } catch (error: unknown) {
        log.error('Error in global search', { error: getErrorMessage(error) })
        return NextResponse.json(
            { error: 'Failed to perform search' },
            { status: 500 }
        )
    }
})
