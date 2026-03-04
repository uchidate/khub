/**
 * GET /api/admin/artists/social-links
 * Returns paginated artists for social links management.
 * Supports: page, limit, search, filter (all | pending | attempted | complete)
 *
 * - pending:  nunca sincronizados E sem links
 * - attempted: sincronizados mas sem links (Wikidata não encontrou)
 * - complete:  tem pelo menos um link social registrado
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const search = searchParams.get('search') || ''
    const filter = searchParams.get('filter') || 'all'  // all | pending | attempted | complete

    // Base: apenas artistas coreanos
    const baseWhere: Prisma.ArtistWhereInput = { flaggedAsNonKorean: false }

    // Filtro de status (server-side)
    const filterWhere: Prisma.ArtistWhereInput =
        filter === 'pending'
            ? { socialLinksUpdatedAt: null, socialLinks: { equals: Prisma.DbNull } }
            : filter === 'attempted'
            ? { socialLinksUpdatedAt: { not: null }, socialLinks: { equals: Prisma.DbNull } }
            : filter === 'complete'
            ? { NOT: { socialLinks: { equals: Prisma.DbNull } } }
            : {}

    const where: Prisma.ArtistWhereInput = {
        AND: [
            baseWhere,
            filterWhere,
            ...(search
                ? [{ OR: [
                    { nameRomanized: { contains: search, mode: 'insensitive' as const } },
                    { nameHangul:    { contains: search, mode: 'insensitive' as const } },
                ]}]
                : []),
        ],
    }

    // Stats globais (ignoram filtro atual, mas respeitam base)
    const [artists, total, statTotal, statPending, statAttempted, statComplete] = await Promise.all([
        prisma.artist.findMany({
            where,
            orderBy: [{ trendingScore: 'desc' }, { nameRomanized: 'asc' }],
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
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.artist.count({ where }),
        prisma.artist.count({ where: baseWhere }),
        prisma.artist.count({ where: { ...baseWhere, socialLinksUpdatedAt: null, socialLinks: { equals: Prisma.DbNull } } }),
        prisma.artist.count({ where: { ...baseWhere, socialLinksUpdatedAt: { not: null }, socialLinks: { equals: Prisma.DbNull } } }),
        prisma.artist.count({ where: { AND: [baseWhere, { NOT: { socialLinks: { equals: Prisma.DbNull } } }] } }),
    ])

    return NextResponse.json({
        artists,
        total,
        pages: Math.ceil(total / limit),
        page,
        globalStats: {
            total:    statTotal,
            pending:  statPending,
            attempted: statAttempted,
            complete: statComplete,
        },
    })
}
