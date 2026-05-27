import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/hidden?type=summary|artists|productions|groups
 * Returns items hidden from the public site.
 */
export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const type = request.nextUrl.searchParams.get('type')

    if (type === 'summary') {
        const [
            hiddenArtists,
            autoHiddenArtists,
            hiddenProductions,
            activeTakedowns,
            hiddenGroups,
            hiddenStoreProducts,
        ] = await Promise.all([
            prisma.artist.count({ where: { isHidden: true } }),
            prisma.artist.count({ where: { isHidden: true, autoHidden: true } }),
            prisma.production.count({ where: { isHidden: true } }),
            prisma.productionTakedown.count({ where: { isActive: true } }),
            prisma.musicalGroup.count({ where: { isHidden: true } }),
            prisma.storeProduct.count({ where: { isHidden: true } }),
        ])

        return NextResponse.json({
            hiddenArtists,
            autoHiddenArtists,
            hiddenProductions,
            activeTakedowns,
            hiddenGroups,
            hiddenStoreProducts,
        })
    }

    if (type === 'artists') {
        const items = await prisma.artist.findMany({
            where: { isHidden: true },
            select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, autoHidden: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ items: items.map(i => ({ ...i, updatedAt: i.updatedAt.toISOString() })) })
    }

    if (type === 'productions') {
        const items = await prisma.production.findMany({
            where: { isHidden: true },
            select: {
                id: true,
                titlePt: true,
                type: true,
                year: true,
                imageUrl: true,
                isTakenDown: true,
                updatedAt: true,
                _count: { select: { takedowns: { where: { isActive: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({
            items: items.map(({ _count, ...item }) => ({
                ...item,
                hasActiveTakedown: item.isTakenDown || _count.takedowns > 0,
                updatedAt: item.updatedAt.toISOString(),
            })),
        })
    }

    if (type === 'groups') {
        const items = await prisma.musicalGroup.findMany({
            where: { isHidden: true },
            select: { id: true, name: true, nameHangul: true, profileImageUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ items: items.map(i => ({ ...i, updatedAt: i.updatedAt.toISOString() })) })
    }

    return NextResponse.json({ error: 'type must be summary, artists, productions, or groups' }, { status: 400 })
}
