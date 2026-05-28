import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { AFFILIATE_PLACEMENTS } from '@/lib/store/affiliate-placements'

export const dynamic = 'force-dynamic'

export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [placements, impressions, entityClicks, pendingCandidates] = await Promise.all([
        prisma.storeAffiliateClick.groupBy({
            by: ['placement'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        prisma.storeProductImpression.groupBy({
            by: ['placement'],
            where: { createdAt: { gte: since } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        }),
        prisma.storeAffiliateClick.groupBy({
            by: ['entityType', 'entityId'],
            where: {
                createdAt: { gte: since },
                entityType: { not: null },
                entityId: { not: null },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 20,
        }),
        prisma.storeProductCandidate.count({
            where: { status: 'candidate' },
        }),
    ])

    const impressionByPlacement = new Map(impressions.map(item => [item.placement, item._count.id]))

    const items = placements.map(item => ({
        placement: item.placement,
        label: AFFILIATE_PLACEMENTS[item.placement as keyof typeof AFFILIATE_PLACEMENTS] ?? item.placement,
        clicks: item._count.id,
        impressions: impressionByPlacement.get(item.placement) ?? 0,
        ctr: impressionByPlacement.get(item.placement)
            ? item._count.id / (impressionByPlacement.get(item.placement) ?? 1)
            : null,
    }))

    for (const impression of impressions) {
        if (items.some(item => item.placement === impression.placement)) continue
        items.push({
            placement: impression.placement,
            label: AFFILIATE_PLACEMENTS[impression.placement as keyof typeof AFFILIATE_PLACEMENTS] ?? impression.placement,
            clicks: 0,
            impressions: impression._count.id,
            ctr: 0,
        })
    }

    return NextResponse.json({
        periodDays: 30,
        clicks: items.reduce((total, item) => total + item.clicks, 0),
        impressions: items.reduce((total, item) => total + item.impressions, 0),
        pendingCandidates,
        placements: items,
        entities: entityClicks.map(item => ({
            entityType: item.entityType,
            entityId: item.entityId,
            clicks: item._count.id,
        })),
    })
}
