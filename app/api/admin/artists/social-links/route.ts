/**
 * GET /api/admin/artists/social-links
 * Returns all artists with just the fields needed for social links management.
 * No pagination cap — returns the full list sorted by trending score.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const artists = await prisma.artist.findMany({
        orderBy: [
            { trendingScore: 'desc' },
            { nameRomanized: 'asc' },
        ],
        select: {
            id: true,
            nameRomanized: true,
            nameHangul: true,
            primaryImageUrl: true,
            socialLinks: true,
            socialLinksUpdatedAt: true,
            instagramFeedUrl: true,
            instagramLastSync: true,
        },
    })

    return NextResponse.json({ artists })
}
