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

    const placements = await prisma.storeAffiliateClick.groupBy({
        by: ['placement'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
    })

    const items = placements.map(item => ({
        placement: item.placement,
        label: AFFILIATE_PLACEMENTS[item.placement as keyof typeof AFFILIATE_PLACEMENTS] ?? item.placement,
        clicks: item._count.id,
    }))

    return NextResponse.json({
        periodDays: 30,
        clicks: items.reduce((total, item) => total + item.clicks, 0),
        placements: items,
    })
}
