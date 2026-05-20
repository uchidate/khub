import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { searchShortcuts } from '@/lib/config/search-shortcuts'
import { searchBlogPostsUnaccent, searchStoreProductsUnaccent } from '@/lib/utils/search-unaccent'

const log = createLogger('SEARCH-FULL')

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.SEARCH)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ shortcuts: [], artists: [], groups: [], articles: [], productions: [], storeProducts: [] })
    }

    const searchTerm = query.trim()

    try {
        const ageRatingFilter = await applyAgeRatingFilter()

        const [artists, groups, productions, articles, storeProducts] = await Promise.all([
            prisma.artist.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    isHidden: false,
                    autoHidden: false,
                    OR: [
                        { nameRomanized: { contains: searchTerm, mode: 'insensitive' } },
                        { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                        { stageNames: { has: searchTerm } },
                    ],
                },
                select: {
                    id: true,
                    slug: true,
                    nameRomanized: true,
                    nameHangul: true,
                    primaryImageUrl: true,
                    roles: true,
                    gender: true,
                },
                orderBy: { trendingScore: 'desc' },
                take: 30,
            }),

            prisma.musicalGroup.findMany({
                where: {
                    isHidden: false,
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    nameHangul: true,
                    profileImageUrl: true,
                },
                orderBy: { trendingScore: 'desc' },
                take: 20,
            }),

            prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    isHidden: false,
                    isTakenDown: false,
                    OR: [
                        { titlePt: { contains: searchTerm, mode: 'insensitive' } },
                        { titleKr: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                    ...ageRatingFilter,
                },
                select: {
                    id: true,
                    slug: true,
                    titlePt: true,
                    titleKr: true,
                    type: true,
                    year: true,
                    imageUrl: true,
                    voteAverage: true,
                    synopsis: true,
                },
                orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
                take: 30,
            }),

            searchBlogPostsUnaccent(searchTerm, 20),
            searchStoreProductsUnaccent(searchTerm, 20),
        ])
        const shortcuts = searchShortcuts(searchTerm, 8)

        return NextResponse.json({ shortcuts, artists, groups, articles, productions, storeProducts })
    } catch (error: unknown) {
        log.error('Full search error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}
