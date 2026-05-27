import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAffiliatePlacement } from '@/lib/store/affiliate-placements'

export const dynamic = 'force-dynamic'

// POST /api/store/[id]/click — incrementa contador de clique (público, sem auth)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const placement = isAffiliatePlacement(body.placement) ? body.placement : 'unknown'
    try {
        await prisma.$transaction([
            prisma.storeProduct.update({
                where: { id },
                data: { clickCount: { increment: 1 } },
            }),
            prisma.storeAffiliateClick.create({
                data: { productId: id, placement },
            }),
        ])
        return NextResponse.json({ ok: true })
    } catch {
        // Silencia erro se produto não existir — não bloqueia o redirect
        return NextResponse.json({ ok: false })
    }
}
