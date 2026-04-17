import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/hidden?type=artists|productions|groups
 * Returns items hidden from the public site.
 */
export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const type = request.nextUrl.searchParams.get('type')

    if (type === 'artists') {
        const items = await prisma.artist.findMany({
            where: { isHidden: true },
            select: { id: true, nameRomanized: true, nameHangul: true, primaryImageUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ items: items.map(i => ({ ...i, updatedAt: i.updatedAt.toISOString() })) })
    }

    if (type === 'productions') {
        const items = await prisma.production.findMany({
            where: { isHidden: true },
            select: { id: true, titlePt: true, type: true, year: true, imageUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ items: items.map(i => ({ ...i, updatedAt: i.updatedAt.toISOString() })) })
    }

    if (type === 'groups') {
        const items = await prisma.musicalGroup.findMany({
            where: { isHidden: true },
            select: { id: true, name: true, nameHangul: true, profileImageUrl: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
        })
        return NextResponse.json({ items: items.map(i => ({ ...i, updatedAt: i.updatedAt.toISOString() })) })
    }

    return NextResponse.json({ error: 'type must be artists, productions, or groups' }, { status: 400 })
}
