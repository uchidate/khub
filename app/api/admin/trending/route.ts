/**
 * GET /api/admin/trending
 *
 * Retorna top 50 artistas rankeados por trendingScore com dados de
 * streaming signals e stats gerais para o painel admin.
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const [artists, statsRaw] = await Promise.all([
        prisma.artist.findMany({
            where: { isHidden: false, flaggedAsNonKorean: false },
            orderBy: { trendingScore: 'desc' },
            take: 50,
            select: {
                id: true,
                nameRomanized: true,
                nameHangul: true,
                primaryImageUrl: true,
                trendingScore: true,
                trendingRank: true,
                trendingRankPrev: true,
                trendingBadgeOverride: true,
                viewCount: true,
                favoriteCount: true,
                createdAt: true,
                streamingSignals: {
                    where: { expiresAt: { gt: new Date() } },
                    orderBy: { rank: 'asc' },
                    select: { showTitle: true, rank: true, source: true },
                    take: 3,
                },
            },
        }),
        prisma.artist.aggregate({
            where: { isHidden: false, flaggedAsNonKorean: false, trendingRank: { not: null } },
            _count: { id: true },
            _avg: { trendingScore: true },
        }),
    ])

    const withSignals = await prisma.artist.count({
        where: {
            isHidden: false,
            flaggedAsNonKorean: false,
            streamingSignals: { some: { expiresAt: { gt: new Date() } } },
        },
    })

    const withBadgeOverride = await prisma.artist.count({
        where: { trendingBadgeOverride: { not: null } },
    })

    return NextResponse.json({
        artists,
        stats: {
            total: statsRaw._count.id,
            withSignals,
            withBadgeOverride,
            avgScore: statsRaw._avg.trendingScore ?? 0,
        },
    })
}
