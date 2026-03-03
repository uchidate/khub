import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/watchlist
 * Returns all WatchEntry records for the authenticated user.
 *
 * Query params:
 *   ?compact=true  → returns only { productionId, status, rating } (for hook initialization)
 *   ?status=WATCHING  → filter by status
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ entries: [] })
    }

    const compact = request.nextUrl.searchParams.get('compact') === 'true'
    const statusFilter = request.nextUrl.searchParams.get('status')

    const where = {
        userId: session.user.id,
        ...(statusFilter ? { status: statusFilter as 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'DROPPED' } : {}),
    }

    if (compact) {
        const entries = await prisma.watchEntry.findMany({
            where,
            select: { productionId: true, status: true, rating: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ entries })
    }

    const entries = await prisma.watchEntry.findMany({
        where,
        select: {
            id: true,
            productionId: true,
            status: true,
            rating: true,
            notes: true,
            watchedAt: true,
            createdAt: true,
            updatedAt: true,
            production: {
                select: {
                    id: true,
                    titlePt: true,
                    titleKr: true,
                    imageUrl: true,
                    type: true,
                    year: true,
                    episodeCount: true,
                    productionStatus: true,
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ entries })
}
