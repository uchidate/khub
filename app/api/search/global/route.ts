import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'

const log = createLogger('SEARCH')

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const limited = checkRateLimit(request, RateLimitPresets.SEARCH_GLOBAL)
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const types = searchParams.get('types')?.split(',') || ['artists', 'news', 'productions']
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

        // Buscar em paralelo nos 4 modelos
        const [artists, news, productions, groups] = await Promise.all([
            // Buscar artistas
            types.includes('artists') ? prisma.artist.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    OR: [
                        { nameRomanized: { contains: searchTerm, mode: 'insensitive' } },
                        { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                        { stageNames: { has: searchTerm } }
                    ]
                },
                take: limit,
                select: {
                    id: true,
                    nameRomanized: true,
                    nameHangul: true,
                    primaryImageUrl: true,
                    roles: true,
                    trendingScore: true
                },
                orderBy: { trendingScore: 'desc' }
            }) : [],

            // Buscar notícias
            types.includes('news') ? prisma.news.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { contentMd: { contains: searchTerm, mode: 'insensitive' } },
                        { tags: { has: searchTerm } }
                    ]
                },
                take: limit,
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    publishedAt: true,
                    tags: true
                },
                orderBy: { publishedAt: 'desc' }
            }) : [],

            // Buscar produções
            types.includes('productions') ? prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    OR: [
                        { titlePt: { contains: searchTerm, mode: 'insensitive' } },
                        { titleKr: { contains: searchTerm, mode: 'insensitive' } },
                        { synopsis: { contains: searchTerm, mode: 'insensitive' } }
                    ],
                    ...ageRatingFilter,
                },
                take: limit,
                select: {
                    id: true,
                    titlePt: true,
                    titleKr: true,
                    type: true,
                    year: true,
                    imageUrl: true,
                    voteAverage: true
                },
                orderBy: [
                    { voteAverage: 'desc' },
                    { year: 'desc' }
                ]
            }) : [],

            // Buscar grupos
            types.includes('groups') ? prisma.musicalGroup.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { nameHangul: { contains: searchTerm, mode: 'insensitive' } },
                    ]
                },
                take: limit,
                select: {
                    id: true,
                    name: true,
                    nameHangul: true,
                    profileImageUrl: true,
                    debutDate: true,
                },
                orderBy: { name: 'asc' }
            }) : []
        ])

        const total = artists.length + news.length + productions.length + groups.length

        return NextResponse.json({
            artists,
            groups,
            news,
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
}
