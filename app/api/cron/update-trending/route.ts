/**
 * POST /api/cron/update-trending
 *
 * Recalcula trendingScore para Artist, MusicalGroup e News
 * com base em atividade dos últimos 7 dias.
 *
 * Fórmula: score = views_7d * 0.6 + favorites_7d * 0.3 + comments_7d * 0.1
 * O score é normalizado para [0, 100] dentro de cada categoria.
 *
 * Auth: Bearer CRON_SECRET
 * Cron sugerido: a cada 6 horas
 */
import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

export const maxDuration = 120

const log = createLogger('CRON-UPDATE-TRENDING')

function verifyToken(request: NextRequest): boolean {
    const authToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!expectedToken || !authToken) return false
    if (authToken.length !== expectedToken.length) return false
    try {
        return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
    } catch {
        return false
    }
}

function normalize(scores: Map<string, number>): Map<string, number> {
    if (scores.size === 0) return scores
    const values = Array.from(scores.values())
    const max = Math.max(...values)
    if (max === 0) return scores
    const normalized = new Map<string, number>()
    Array.from(scores.entries()).forEach(([id, score]) => {
        normalized.set(id, Math.round((score / max) * 100 * 100) / 100)
    })
    return normalized
}

async function updateArtistTrending(since7d: Date): Promise<number> {
    // Contar favoritos recentes por artista (via Favorite model)
    const recentFavs = await prisma.favorite.groupBy({
        by: ['artistId'],
        where: {
            artistId: { not: null },
            createdAt: { gte: since7d },
        },
        _count: { artistId: true },
    })

    const scores = new Map<string, number>()

    for (const fav of recentFavs) {
        if (!fav.artistId) continue
        const current = scores.get(fav.artistId) ?? 0
        scores.set(fav.artistId, current + fav._count.artistId * 0.3)
    }

    // Obter viewCount atual de todos os artistas (proxy de views)
    // Ponderamos viewCount total para refletir popularidade acumulada + recente
    const artists = await prisma.artist.findMany({
        select: { id: true, viewCount: true, favoriteCount: true },
    })

    for (const artist of artists) {
        const fav = scores.get(artist.id) ?? 0
        // viewCount normalizado contribui 0.6, favoriteCount contribui 0.3 (se não há recentes)
        const base = artist.viewCount * 0.6 + artist.favoriteCount * 0.3
        scores.set(artist.id, base + fav)
    }

    const normalized = normalize(scores)

    // Batch update
    let updated = 0
    for (const entry of Array.from(normalized.entries())) {
        await prisma.artist.update({
            where: { id: entry[0] },
            data: { trendingScore: entry[1] },
        })
        updated++
    }

    return updated
}

async function updateGroupTrending(since7d: Date): Promise<number> {
    const recentFavs = await prisma.favorite.groupBy({
        by: ['groupId'],
        where: {
            groupId: { not: null },
            createdAt: { gte: since7d },
        },
        _count: { groupId: true },
    })

    const scores = new Map<string, number>()

    for (const fav of recentFavs) {
        if (!fav.groupId) continue
        scores.set(fav.groupId, (scores.get(fav.groupId) ?? 0) + fav._count.groupId * 0.3)
    }

    const groups = await prisma.musicalGroup.findMany({
        select: { id: true, viewCount: true, favoriteCount: true },
    })

    for (const group of groups) {
        const fav = scores.get(group.id) ?? 0
        scores.set(group.id, group.viewCount * 0.6 + group.favoriteCount * 0.3 + fav)
    }

    const normalized = normalize(scores)

    let updated = 0
    for (const entry of Array.from(normalized.entries())) {
        await prisma.musicalGroup.update({
            where: { id: entry[0] },
            data: { trendingScore: entry[1] },
        })
        updated++
    }

    return updated
}

async function updateNewsTrending(since7d: Date): Promise<number> {
    // Favoritos recentes de news
    const recentFavs = await prisma.favorite.groupBy({
        by: ['newsId'],
        where: {
            newsId: { not: null },
            createdAt: { gte: since7d },
        },
        _count: { newsId: true },
    })

    // Comentários recentes por news
    const recentComments = await prisma.comment.groupBy({
        by: ['newsId'],
        where: { createdAt: { gte: since7d } },
        _count: { newsId: true },
    })

    const favMap = new Map(recentFavs.filter(f => f.newsId).map(f => [f.newsId!, f._count.newsId]))
    const commentMap = new Map(recentComments.map(c => [c.newsId, c._count.newsId]))

    const news = await prisma.news.findMany({
        select: { id: true, viewCount: true },
    })

    const scores = new Map<string, number>()
    for (const item of news) {
        const fav = favMap.get(item.id) ?? 0
        const comments = commentMap.get(item.id) ?? 0
        scores.set(item.id, item.viewCount * 0.6 + fav * 0.3 + comments * 0.1)
    }

    const normalized = normalize(scores)

    let updated = 0
    for (const entry of Array.from(normalized.entries())) {
        await prisma.news.update({
            where: { id: entry[0] },
            data: { trendingScore: entry[1] },
        })
        updated++
    }

    return updated
}

async function runUpdateTrending() {
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [artistsUpdated, groupsUpdated, newsUpdated] = await Promise.all([
        updateArtistTrending(since7d),
        updateGroupTrending(since7d),
        updateNewsTrending(since7d),
    ])

    return { artistsUpdated, groupsUpdated, newsUpdated }
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const requestId = `update-trending-${Date.now()}`
    log.info('Trending update started', { requestId })

    runUpdateTrending()
        .then(result => log.info('Trending update completed', { requestId, ...result }))
        .catch(err => log.error('Trending update failed', { requestId, error: getErrorMessage(err) }))

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
