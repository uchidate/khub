import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/favorites
 * Returns all favorited IDs (artists, productions, news) for the authenticated user.
 * Used by useFavorites hook to sync state from DB on login.
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ allIds: [], artistIds: [], productionIds: [], newsIds: [] })
    }

    const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { artistId: true, productionId: true, newsId: true },
    })

    const artistIds = favorites.filter(f => f.artistId).map(f => f.artistId as string)
    const productionIds = favorites.filter(f => f.productionId).map(f => f.productionId as string)
    const newsIds = favorites.filter(f => f.newsId).map(f => f.newsId as string)

    return NextResponse.json({
        allIds: [...artistIds, ...productionIds, ...newsIds],
        artistIds,
        productionIds,
        newsIds,
    })
}
