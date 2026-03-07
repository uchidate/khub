'use server'

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function toggleFavorite(entityId: string, entityType: 'ARTIST' | 'PRODUCTION' | 'NEWS') {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Não autorizado")

    const userId = session.user.id

    const where = {
        userId,
        ...(entityType === 'ARTIST' ? { artistId: entityId } : {}),
        ...(entityType === 'PRODUCTION' ? { productionId: entityId } : {}),
        ...(entityType === 'NEWS' ? { newsId: entityId } : {}),
    }

    const existing = await (prisma as any).favorite.findFirst({ where })

    if (existing) {
        await (prisma as any).favorite.delete({ where: { id: existing.id } })
        await trackActivity(userId, 'UNLIKE', entityId, entityType)
    } else {
        await (prisma as any).favorite.create({
            data: {
                userId,
                ...(entityType === 'ARTIST' ? { artistId: entityId } : {}),
                ...(entityType === 'PRODUCTION' ? { productionId: entityId } : {}),
                ...(entityType === 'NEWS' ? { newsId: entityId } : {}),
            }
        })
        await trackActivity(userId, 'LIKE', entityId, entityType)
    }

    revalidatePath('/dashboard')
    revalidatePath('/favorites')
}

export async function trackActivity(userId: string, type: string, entityId?: string, entityType?: string, metadata?: any) {
    try {
        await (prisma as any).activity.create({
            data: {
                userId,
                type,
                entityId,
                entityType,
                metadata
            }
        })
    } catch (error) {
        console.error("Erro ao registrar atividade:", error)
    }
}

export async function getDashboardData() {
    const session = await auth()
    if (!session?.user?.id) return null

    const userId = session.user.id

    // Fetch favorite artist IDs for personalized news
    const favoriteArtistRows = await prisma.favorite.findMany({
        where: { userId, artistId: { not: null } },
        select: { artistId: true },
    })
    const favoriteArtistIds = favoriteArtistRows.map(f => f.artistId!).filter(Boolean)
    const hasFollowing = favoriteArtistIds.length > 0

    const [
        activities,
        latestNews,
        personalizedNews,
        trendingArtists,
        user,
        artistCount,
        productionCount,
        newsCount,
        groupCount,
        commentsCount,
        watchlistCount,
        watchingEntries,
    ] = await Promise.all([
        // Atividades recentes (com entityId para resolver nomes)
        (prisma as any).activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 12,
        }),
        // Últimas notícias genéricas (fallback)
        prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 4,
            select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true, source: true },
        }),
        // Notícias personalizadas (artistas favoritos)
        hasFollowing
            ? prisma.news.findMany({
                where: { artists: { some: { artistId: { in: favoriteArtistIds } } } },
                orderBy: { publishedAt: 'desc' },
                take: 4,
                select: {
                    id: true,
                    title: true,
                    imageUrl: true,
                    publishedAt: true,
                    tags: true,
                    source: true,
                    artists: {
                        select: { artist: { select: { nameRomanized: true } } },
                        take: 2,
                    },
                },
            })
            : Promise.resolve([]),
        // Trending artists (por trendingScore)
        prisma.artist.findMany({
            orderBy: { trendingScore: 'desc' },
            take: 6,
            select: { id: true, nameRomanized: true, primaryImageUrl: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true },
        }),
        // Stats por tipo
        prisma.favorite.count({ where: { userId, artistId: { not: null } } }),
        prisma.favorite.count({ where: { userId, productionId: { not: null } } }),
        prisma.favorite.count({ where: { userId, newsId: { not: null } } }),
        prisma.favorite.count({ where: { userId, groupId: { not: null } } }),
        prisma.comment.count({ where: { userId } }),
        prisma.watchEntry.count({ where: { userId } }),
        prisma.watchEntry.findMany({
            where: { userId, status: 'WATCHING' },
            orderBy: { updatedAt: 'desc' },
            take: 6,
            select: {
                productionId: true,
                production: { select: { id: true, titlePt: true, imageUrl: true, type: true, year: true } },
            },
        }),
    ])

    // Resolver nomes das entidades nas atividades
    const uniqueIds = (type: string) =>
        Array.from(new Set<string>(
            activities.filter((a: any) => a.entityType === type && a.entityId).map((a: any) => a.entityId as string)
        ))
    const entityIds = {
        ARTIST:     uniqueIds('ARTIST'),
        PRODUCTION: uniqueIds('PRODUCTION'),
        NEWS:       uniqueIds('NEWS'),
    }

    const [artistNames, productionNames, newsNames] = await Promise.all([
        entityIds.ARTIST.length > 0
            ? prisma.artist.findMany({ where: { id: { in: entityIds.ARTIST as string[] } }, select: { id: true, nameRomanized: true } })
            : Promise.resolve([]),
        entityIds.PRODUCTION.length > 0
            ? prisma.production.findMany({ where: { id: { in: entityIds.PRODUCTION as string[] } }, select: { id: true, titlePt: true } })
            : Promise.resolve([]),
        entityIds.NEWS.length > 0
            ? prisma.news.findMany({ where: { id: { in: entityIds.NEWS as string[] } }, select: { id: true, title: true } })
            : Promise.resolve([]),
    ])

    const nameMap: Record<string, string> = {}
    artistNames.forEach((a: any) => { nameMap[a.id] = a.nameRomanized })
    productionNames.forEach((p: any) => { nameMap[p.id] = p.titlePt })
    newsNames.forEach((n: any) => { nameMap[n.id] = n.title })

    const activitiesWithNames = activities.map((a: any) => ({
        ...a,
        entityName: a.entityId ? nameMap[a.entityId] : undefined,
    }))

    const stats = {
        favoritesCount: artistCount + productionCount + newsCount + groupCount,
        artistCount,
        productionCount,
        newsCount,
        groupCount,
        commentsCount,
        watchlistCount,
        joinDate: user?.createdAt,
    }

    return {
        activities: activitiesWithNames,
        latestNews,
        personalizedNews,
        hasFollowing,
        trendingArtists,
        watchingEntries,
        stats,
    }
}

export async function getProfileData() {
    const session = await auth()
    if (!session?.user?.id) return null

    const userId = session.user.id

    const [
        favoriteArtists,
        favoriteProductions,
        favoriteNews,
        totalComments,
        recentComments,
        recentFavoriteArtistsRaw,
        recentFavoriteProductionsRaw,
        user,
        heroFavorite,
        trendingArtists,
    ] = await Promise.all([
        prisma.favorite.count({ where: { userId, artistId: { not: null } } }),
        prisma.favorite.count({ where: { userId, productionId: { not: null } } }),
        prisma.favorite.count({ where: { userId, newsId: { not: null } } }),
        prisma.comment.count({ where: { userId } }),
        prisma.comment.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true, content: true, createdAt: true,
                news: { select: { id: true, title: true, imageUrl: true } },
            },
        }),
        prisma.favorite.findMany({
            where: { userId, artistId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 6,
            select: {
                createdAt: true,
                artist: { select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, roles: true } },
            },
        }),
        prisma.favorite.findMany({
            where: { userId, productionId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select: {
                createdAt: true,
                production: { select: { id: true, titlePt: true, type: true, year: true, imageUrl: true, voteAverage: true } },
            },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true, bio: true } }),
        // Primeira artista favoritada (mais antiga) para o hero banner
        prisma.favorite.findFirst({
            where: { userId, artistId: { not: null } },
            orderBy: { createdAt: 'asc' },
            select: { artist: { select: { primaryImageUrl: true } } },
        }),
        // Trending artists para o fallback da FavoritesGallery
        prisma.artist.findMany({
            orderBy: { trendingScore: 'desc' },
            take: 6,
            select: { id: true, nameRomanized: true, primaryImageUrl: true },
        }),
    ])

    return {
        stats: { favoriteArtists, favoriteProductions, favoriteNews, totalComments },
        recentComments: recentComments
            .filter(c => c.news)
            .map(c => ({ id: c.id, content: c.content, createdAt: c.createdAt.toISOString(), news: c.news! })),
        recentFavoriteArtists: recentFavoriteArtistsRaw
            .filter(f => f.artist)
            .map(f => ({ ...f.artist!, favoritedAt: f.createdAt.toISOString() })),
        recentFavoriteProductions: recentFavoriteProductionsRaw
            .filter(f => f.production)
            .map(f => ({ ...f.production!, favoritedAt: f.createdAt.toISOString() })),
        memberSince: user?.createdAt.toISOString() ?? null,
        bio: user?.bio ?? null,
        heroImageUrl: heroFavorite?.artist?.primaryImageUrl ?? null,
        trendingArtists,
    }
}

export async function registerInterest(tierName: string) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            console.warn('[registerInterest] No session found for tierName:', tierName)
            return { success: false, error: 'unauthorized' as const }
        }

        await trackActivity(session.user.id, 'PREMIUM_INTEREST', undefined, undefined, { tier: tierName })
        return { success: true, error: null }
    } catch (e) {
        console.error('[registerInterest] Unexpected error:', e)
        return { success: false, error: 'internal' as const }
    }
}
