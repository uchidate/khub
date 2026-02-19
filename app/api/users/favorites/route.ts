import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/favorites
 * Returns all favorited IDs (artists, productions, news) for the authenticated user.
 *
 * Query params:
 *   ?full=true  → also returns full entity data (id, title, imageUrl) for each favorite
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ allIds: [], artistIds: [], productionIds: [], newsIds: [] })
    }

    const full = request.nextUrl.searchParams.get('full') === 'true'

    const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: {
            artistId: true,
            productionId: true,
            newsId: true,
            groupId: true,
            ...(full ? {
                artist: { select: { id: true, nameRomanized: true, primaryImageUrl: true } },
                production: { select: { id: true, titlePt: true, imageUrl: true } },
                news: { select: { id: true, title: true, imageUrl: true } },
                group: { select: { id: true, name: true, profileImageUrl: true } },
            } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: full ? 8 : undefined,
    })

    const artistIds = favorites.filter(f => f.artistId).map(f => f.artistId as string)
    const productionIds = favorites.filter(f => f.productionId).map(f => f.productionId as string)
    const newsIds = favorites.filter(f => f.newsId).map(f => f.newsId as string)
    const groupIds = favorites.filter(f => f.groupId).map(f => f.groupId as string)

    if (!full) {
        return NextResponse.json({
            allIds: [...artistIds, ...productionIds, ...newsIds, ...groupIds],
            artistIds,
            productionIds,
            newsIds,
            groupIds,
        })
    }

    // Full mode: return entity data for rendering cards
    const items = favorites
        .map(f => {
            if (f.artistId && (f as any).artist) {
                return { id: f.artistId, type: 'artist' as const, ...(f as any).artist }
            }
            if (f.productionId && (f as any).production) {
                return { id: f.productionId, type: 'production' as const, title: (f as any).production.titlePt, imageUrl: (f as any).production.imageUrl }
            }
            if (f.newsId && (f as any).news) {
                return { id: f.newsId, type: 'news' as const, ...(f as any).news }
            }
            if (f.groupId && (f as any).group) {
                return { id: f.groupId, type: 'group' as const, nameRomanized: (f as any).group.name, primaryImageUrl: (f as any).group.profileImageUrl }
            }
            return null
        })
        .filter(Boolean)

    return NextResponse.json({
        allIds: [...artistIds, ...productionIds, ...newsIds, ...groupIds],
        artistIds,
        productionIds,
        newsIds,
        groupIds,
        items,
    })
}
