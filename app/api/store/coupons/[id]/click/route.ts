import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAffiliatePlacement } from '@/lib/store/affiliate-placements'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const placement = isAffiliatePlacement(body.placement) ? body.placement : 'store_coupon'

    try {
        await prisma.storeAffiliateClick.create({
            data: { couponId: id, placement },
        })
        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ ok: false })
    }
}
