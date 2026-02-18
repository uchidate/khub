import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/users/favorites/sync
 * Bulk-syncs a list of unknown IDs from localStorage → DB.
 * Resolves the type (artist/production/news) of each ID by querying all three tables,
 * then upserts the appropriate Favorite records.
 */
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ synced: 0 }, { status: 401 })
    }

    let ids: string[]
    try {
        const body = await request.json()
        ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : []
    } catch {
        return NextResponse.json({ synced: 0 }, { status: 400 })
    }

    if (ids.length === 0) return NextResponse.json({ synced: 0 })

    const userId = session.user.id

    // Resolve type for each ID in parallel
    const [artists, productions, newsList] = await Promise.all([
        prisma.artist.findMany({ where: { id: { in: ids } }, select: { id: true } }),
        prisma.production.findMany({ where: { id: { in: ids } }, select: { id: true } }),
        prisma.news.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    ])

    const artistIds = new Set(artists.map(a => a.id))
    const productionIds = new Set(productions.map(p => p.id))
    const newsIds = new Set(newsList.map(n => n.id))

    // Upsert in parallel — unique constraints prevent duplicates
    const upserts: Promise<unknown>[] = []

    for (const id of Array.from(artistIds)) {
        upserts.push(
            prisma.favorite.upsert({
                where: { userId_artistId: { userId, artistId: id } },
                create: { userId, artistId: id },
                update: {},
            })
        )
    }
    for (const id of Array.from(productionIds)) {
        upserts.push(
            prisma.favorite.upsert({
                where: { userId_productionId: { userId, productionId: id } },
                create: { userId, productionId: id },
                update: {},
            })
        )
    }
    for (const id of Array.from(newsIds)) {
        upserts.push(
            prisma.favorite.upsert({
                where: { userId_newsId: { userId, newsId: id } },
                create: { userId, newsId: id },
                update: {},
            })
        )
    }

    await Promise.all(upserts)

    return NextResponse.json({ synced: upserts.length })
}
