/**
 * GET /api/admin/artists/social-links
 * Returns paginated artists for social links management.
 * Supports: page, limit, search, filter (all | configured | missing)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '50'))
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all'

    const where = {
        ...(search ? {
            OR: [
                { nameRomanized: { contains: search, mode: 'insensitive' as const } },
                { nameHangul: { contains: search, mode: 'insensitive' as const } },
            ],
        } : {}),
        ...(filter === 'configured' ? { instagramFeedUrl: { not: null } } : {}),
        ...(filter === 'missing' ? { instagramFeedUrl: null } : {}),
    }

    const [artists, total, totalConfigured] = await Promise.all([
        prisma.artist.findMany({
            where,
            orderBy: [{ trendingScore: 'desc' }, { nameRomanized: 'asc' }],
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                socialLinks: true,
                instagramFeedUrl: true,
                instagramLastSync: true,
            },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.artist.count({ where }),
        prisma.artist.count({ where: { instagramFeedUrl: { not: null } } }),
    ])

    return NextResponse.json({ artists, total, totalConfigured, page, limit })
}
