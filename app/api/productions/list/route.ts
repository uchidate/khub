import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { withLogging } from '@/lib/server/withLogging'

export const dynamic = 'force-dynamic'

const TYPE_MAP: Record<string, string[]> = {
    MOVIE:  ['FILME'],
    SERIES: ['SERIE'],
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
    const ids = searchParams.get('ids') || undefined  // comma-separated IDs for bulk resolve
    const type = searchParams.get('type') || undefined
    const ageRating = searchParams.get('ageRating') || undefined
    const sortBy = searchParams.get('sortBy') || 'popular'

    const where: any = ids
        ? { id: { in: ids.split(',').map(s => s.trim()).filter(Boolean) } }
        : {
            // Filtrar produções marcadas como não-relevantes ou ocultas pelo admin
            flaggedAsNonKorean: false,
            isHidden: false,
        }

    if (!ids && search) {
        where.OR = [
            { titlePt: { contains: search, mode: 'insensitive' } },
            { titleKr: { contains: search, mode: 'insensitive' } },
            { synopsis: { contains: search, mode: 'insensitive' } },
        ]
    }

    if (!ids && type) {
        // Map filter values to the actual DB values (legacy data uses PT names)
        const dbValues = TYPE_MAP[type]
        where.type = dbValues ? { in: dbValues } : type
    }

    // Aplicar filtro de classificação etária (respeita SystemSettings + UserContentPreferences)
    if (!ids) {
        const ageRatingFilter = await applyAgeRatingFilter(ageRating)
        Object.assign(where, ageRatingFilter)
    }

    // Sort "popular": boost produções presentes no Top 10 dos streamings
    if (sortBy === 'popular') {
        // Prioridade de plataforma: Netflix > Disney+ > Amazon > Apple
        const PLATFORM_SCORE: Record<string, number> = {
            'netflix_br':  30000,
            'disney_br':   20000,
            'prime_br':    10000,
            'apple_br':     5000,
        }
        // Faixas de score:
        //   Live-action em streaming: 100000 + platformScore + rankScore + yearBonus
        //   Animações em streaming:    50000 + platformScore + rankScore + yearBonus
        //   Fora do streaming:              0-200 (voteScore + voteCountScore + yearScore)
        const LIVE_ACTION_BASE = 100000
        const ANIMATION_BASE   =  50000
        const ANIMATION_TAGS   = new Set(['animação', 'animation', 'animated', 'cartoon', 'animado'])

        // Buscar shows ativos das plataformas de streaming
        const activeShows = await prisma.streamingShow.findMany({
            where: { expiresAt: { gt: new Date() } },
            select: { productionId: true, tmdbId: true, rank: true, source: true },
        })

        // Melhor boost por productionId e tmdbId (platformScore + rankScore maior vence)
        type BoostEntry = { platformScore: number; rankScore: number }
        const boostByProductionId = new Map<string, BoostEntry>()
        const boostByTmdbId = new Map<string, BoostEntry>()

        for (const s of activeShows) {
            const platformScore = PLATFORM_SCORE[s.source] ?? 0
            if (!platformScore) continue
            // Curva quadrática: rank 1 = 5000, rank 5 = 1800, rank 10 = 50
            const r = 11 - Math.min(s.rank, 10)
            const rankScore = r * r * 50
            const total = platformScore + rankScore
            const update = (map: Map<string, BoostEntry>, key: string) => {
                const cur = map.get(key)
                if (!cur || total > cur.platformScore + cur.rankScore)
                    map.set(key, { platformScore, rankScore })
            }
            if (s.productionId) update(boostByProductionId, s.productionId)
            update(boostByTmdbId, s.tmdbId)
        }

        // Buscar IDs e campos de score de todas as produções que passam nos filtros
        const allForScoring = await prisma.production.findMany({
            where,
            select: { id: true, tmdbId: true, voteAverage: true, voteCount: true, year: true, tags: true },
        })

        // Score final:
        //   Streaming live-action: LIVE_ACTION_BASE + platformScore + rankScore + yearBonus*0.5
        //   Streaming animação:    ANIMATION_BASE   + platformScore + rankScore + yearBonus*0.5
        //   Fora do streaming:     voteScore + voteCountScore + yearBonus*0.1  (max ~200)
        const scored = allForScoring
            .map(p => {
                const boost = boostByProductionId.get(p.id)
                    ?? (p.tmdbId ? boostByTmdbId.get(p.tmdbId) : undefined)
                const yearBonus = p.year ? Math.max(0, p.year - 2000) : 0

                let score: number
                if (boost) {
                    const isAnimated = p.tags.some(t => ANIMATION_TAGS.has(t.toLowerCase()))
                    const base = isAnimated ? ANIMATION_BASE : LIVE_ACTION_BASE
                    score = base + boost.platformScore + boost.rankScore + yearBonus * 0.5
                } else {
                    const voteScore      = (p.voteAverage ?? 0) * 10
                    const voteCountScore = Math.log10((p.voteCount ?? 0) + 1) * 5
                    score = voteScore + voteCountScore + yearBonus * 0.1
                }
                return { id: p.id, score }
            })
            .sort((a, b) => b.score - a.score)

        const total = scored.length
        const pageIds = scored.slice(skip, skip + limit).map(p => p.id)

        // Buscar dados completos apenas para a página atual
        const pageProductions = await prisma.production.findMany({
            where: { id: { in: pageIds } },
            select: {
                id: true,
                slug: true,
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
                slug: true,
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
