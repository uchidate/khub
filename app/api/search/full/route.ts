import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { withLogging } from '@/lib/server/withLogging'

const log = createLogger('SEARCH-FULL')

export const dynamic = 'force-dynamic'

export const GET = withLogging(async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.SEARCH)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
        return NextResponse.json({ artists: [], groups: [], news: [], productions: [] })
    }

    const searchTerm = query.trim()

    try {
        const ageRatingFilter = await applyAgeRatingFilter()

        const [artists, groups, news, productions] = await Promise.all([
            prisma.artist.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    OR: [
                        { nameRomanized: { contains: searchTerm, mode: 'insensitive' } },
                        { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                        { stageNames: { has: searchTerm } },
                    ],
                },
                select: {
                    id: true,
                    nameRomanized: true,
                    nameHangul: true,
                    primaryImageUrl: true,
                    roles: true,
                    gender: true,
                },
                orderBy: { trendingScore: 'desc' },
                take: 100,
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
                    name: true,
                    nameHangul: true,
                    profileImageUrl: true,
                },
                orderBy: { trendingScore: 'desc' },
                take: 100,
            }),

            prisma.news.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { contentMd: { contains: searchTerm, mode: 'insensitive' } },
                        { tags: { has: searchTerm } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    publishedAt: true,
                    tags: true,
                    contentMd: true,
                },
                orderBy: { publishedAt: 'desc' },
                take: 100,
            }),

            prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    OR: [
                        { titlePt: { contains: searchTerm, mode: 'insensitive' } },
                        { titleKr: { contains: searchTerm, mode: 'insensitive' } },
                        { synopsis: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                    ...ageRatingFilter,
                },
                select: {
                    id: true,
                    titlePt: true,
                    titleKr: true,
                    type: true,
                    year: true,
                    imageUrl: true,
                    voteAverage: true,
                    synopsis: true,
                },
                orderBy: [{ voteAverage: 'desc' }, { year: 'desc' }],
                take: 100,
            }),
        ])

        return NextResponse.json({ artists, groups, news, productions })
    } catch (error: unknown) {
        log.error('Full search error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
})
