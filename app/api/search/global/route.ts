import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'

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
            news: [],
            productions: [],
            total: 0,
            query: query || ''
        })
    }

    const searchTerm = query.trim()

    try {
        // Buscar em paralelo nos 3 modelos
        const [artists, news, productions] = await Promise.all([
            // Buscar artistas
            types.includes('artists') ? prisma.artist.findMany({
                where: {
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
                    OR: [
                        { titlePt: { contains: searchTerm, mode: 'insensitive' } },
                        { titleKr: { contains: searchTerm, mode: 'insensitive' } },
                        { synopsis: { contains: searchTerm, mode: 'insensitive' } }
                    ]
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
            }) : []
        ])

        const total = artists.length + news.length + productions.length

        return NextResponse.json({
            artists,
            news,
            productions,
            total,
            query: searchTerm
        })

    } catch (error: any) {
        console.error('Error in global search:', error)
        return NextResponse.json(
            { error: 'Failed to perform search', details: error.message },
            { status: 500 }
        )
    }
}
