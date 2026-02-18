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

    const [activities, latestNews, trendingArtists, user] = await Promise.all([
        (prisma as any).activity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        }),
        prisma.news.findMany({
            orderBy: { publishedAt: 'desc' },
            take: 4,
            select: { id: true, title: true, imageUrl: true, publishedAt: true, tags: true },
        }),
        prisma.artist.findMany({
            orderBy: { viewCount: 'desc' },
            take: 6,
            select: { id: true, nameRomanized: true, primaryImageUrl: true },
        }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true }
        })
    ])

    const stats = {
        favoritesCount: await (prisma as any).favorite.count({ where: { userId } }),
        activityScore: activities.length * 10,
        joinDate: user?.createdAt
    }

    return { activities, latestNews, trendingArtists, stats }
}

export async function registerInterest(tierName: string) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Não autorizado")

    await trackActivity(session.user.id, 'PREMIUM_INTEREST', undefined, undefined, { tier: tierName })
    return { success: true }
}
