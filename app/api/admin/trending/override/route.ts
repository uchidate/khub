/**
 * PATCH /api/admin/trending/override
 *
 * Seta ou remove trendingBadgeOverride de um artista.
 * Body: { artistId: string, badge: 'HOT' | 'SUBINDO' | 'NOVO' | null }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

const VALID_BADGES = ['HOT', 'SUBINDO', 'NOVO', null]

export async function PATCH(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json().catch(() => null)
    if (!body?.artistId || !VALID_BADGES.includes(body.badge ?? null)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const artist = await prisma.artist.update({
        where: { id: body.artistId },
        data: { trendingBadgeOverride: body.badge ?? null },
        select: { id: true, trendingBadgeOverride: true },
    })

    return NextResponse.json({ ok: true, artist })
}
