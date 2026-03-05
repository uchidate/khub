import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { withLogging } from '@/lib/server/withLogging'

export const dynamic = 'force-dynamic'

const TYPE_MAP: Record<string, string[]> = {
    MOVIE:       ['FILME', 'Filme', 'MOVIE'],
    SERIES:      ['SERIE', 'serie', 'SERIES', 'K-Drama', 'SHOW'],
    SPECIAL:     ['SPECIAL', 'ESPECIAL'],
    DOCUMENTARY: ['DOCUMENTARY', 'DOCUMENTARIO', 'DOCUMENTÁRIO'],
}

async function handler(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    // ?typeCounts=1 — retorna contagem de produções por tipo (sem paginação)
    if (searchParams.get('typeCounts') === '1') {
        const baseWhere = { flaggedAsNonKorean: false, isHidden: false }
        const counts = await Promise.all(
            Object.entries(TYPE_MAP).map(async ([key, values]) => {
                const count = await prisma.production.count({ where: { ...baseWhere, type: { in: values } } })
                return [key, count] as const
            })
        )
        return NextResponse.json(Object.fromEntries(counts), {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '18')))
    const skip = (page - 1) * limit

    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const ageRating = searchParams.get('ageRating') || undefined
    const sortBy = searchParams.get('sortBy') || 'popular'

    const where: any = {
        // Filtrar produções marcadas como não-relevantes ou ocultas pelo admin
        flaggedAsNonKorean: false,
        isHidden: false,
    }

    if (search) {
        where.OR = [
            { titlePt: { contains: search, mode: 'insensitive' } },
            { titleKr: { contains: search, mode: 'insensitive' } },
            { synopsis: { contains: search, mode: 'insensitive' } },
        ]
    }

    if (type) {
        // Map filter values to the actual DB values (legacy data uses PT names)
        const dbValues = TYPE_MAP[type]
        where.type = dbValues ? { in: dbValues } : type
    }

    // Aplicar filtro de classificação etária (respeita SystemSettings + UserContentPreferences)
    const ageRatingFilter = await applyAgeRatingFilter(ageRating)
    Object.assign(where, ageRatingFilter)

    // Sort "popular": boost produções presentes no Top 10 dos streamings
    if (sortBy === 'popular') {
        // Buscar sinais ativos de streaming (plataformas reais, excluindo interno)
        const activeSignals = await prisma.streamingTrendSignal.findMany({
            where: {
                expiresAt: { gt: new Date() },
                source: { not: 'internal_production' },
            },
            select: { showTmdbId: true, rank: true },
        })

        // Melhor rank por showTmdbId (rank menor = posição mais alta)
        const streamingBoost = new Map<string, number>()
        for (const s of activeSignals) {
            const existing = streamingBoost.get(s.showTmdbId)
            if (existing === undefined || s.rank < existing) {
                streamingBoost.set(s.showTmdbId, s.rank)
            }
        }

        // Buscar IDs e campos de score de todas as produções que passam nos filtros
        const allForScoring = await prisma.production.findMany({
            where,
            select: { id: true, tmdbId: true, voteAverage: true },
        })

        // Score: produções no streaming dominam; dentro de cada grupo, voteAverage desempata
        // Boost: rank 1 → +1000, rank 10 → +100; base: voteAverage * 10 (máx 100)
        const scored = allForScoring
            .map(p => {
                const bestRank = p.tmdbId ? streamingBoost.get(p.tmdbId) : undefined
                const streamScore = bestRank !== undefined ? (11 - bestRank) * 100 : 0
                const baseScore = (p.voteAverage ?? 0) * 10
                return { id: p.id, score: streamScore + baseScore }
            })
            .sort((a, b) => b.score - a.score)

        const total = scored.length
        const pageIds = scored.slice(skip, skip + limit).map(p => p.id)

        // Buscar dados completos apenas para a página atual
        const pageProductions = await prisma.production.findMany({
            where: { id: { in: pageIds } },
            select: {
                id: true,
                titlePt: true,
                titleKr: true,
                type: true,
                year: true,
                imageUrl: true,
                backdropUrl: true,
                voteAverage: true,
                streamingPlatforms: true,
                ageRating: true,
            },
        })

        // Restaurar a ordem do score (findMany não garante ordem do IN)
        const prodById = new Map(pageProductions.map(p => [p.id, p]))
        const productions = pageIds.map(id => prodById.get(id)).filter(Boolean)

        return NextResponse.json({
            productions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } })
    }

    let orderBy: any
    switch (sortBy) {
        case 'rating':
            orderBy = [{ voteAverage: { sort: 'desc', nulls: 'last' } }, { year: 'desc' }]
            break
        case 'year':
            orderBy = [{ year: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]
            break
        case 'name':
            orderBy = { titlePt: 'asc' }
            break
        case 'newest':
        default:
            orderBy = { createdAt: 'desc' }
    }

    const [productions, total] = await Promise.all([
        prisma.production.findMany({
            where,
            take: limit,
            skip,
            orderBy,
            select: {
                id: true,
                titlePt: true,
                titleKr: true,
                type: true,
                year: true,
                imageUrl: true,
                backdropUrl: true,
                voteAverage: true,
                streamingPlatforms: true,
                ageRating: true,
            }
        }),
        prisma.production.count({ where }),
    ])

    return NextResponse.json({
        productions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } })
}

export const GET = withLogging(handler)
