import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAffiliatePlacement } from '@/lib/store/affiliate-placements'

export const dynamic = 'force-dynamic'

// POST /api/store/[id]/click — incrementa contador de clique (público, sem auth)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const placement = isAffiliatePlacement(body.placement) ? body.placement : 'unknown'
    const entityType = typeof body.entityType === 'string' ? body.entityType : null
    const entityId = typeof body.entityId === 'string' ? body.entityId : null
    const pagePath = typeof body.pagePath === 'string' ? body.pagePath.slice(0, 500) : null
    const position = typeof body.position === 'number' ? body.position : null
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 128) : null
    try {
        await prisma.$transaction([
            prisma.storeProduct.update({
                where: { id },
                data: { clickCount: { increment: 1 } },
            }),
            prisma.storeAffiliateClick.create({
                data: { productId: id, placement, entityType, entityId, pagePath, position, sessionId },
            }),
        ])
        return NextResponse.json({ ok: true })
    } catch {
        // Silencia erro se produto não existir — não bloqueia o redirect
        return NextResponse.json({ ok: false })
    }
}
