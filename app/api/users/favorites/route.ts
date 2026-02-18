import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/favorites
 * Returns the list of favorited artist IDs for the authenticated user.
 * Used by useFavorites hook to sync state from DB on login.
 */
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ artistIds: [] })
    }

    const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id, artistId: { not: null } },
        select: { artistId: true },
    })

    return NextResponse.json({
        artistIds: favorites.map(f => f.artistId as string),
    })
}
