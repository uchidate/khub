import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { isAffiliatePlacement } from '@/lib/store/affiliate-placements'

export const dynamic = 'force-dynamic'

type ImpressionPayload = {
    productId?: unknown
    placement?: unknown
    entityType?: unknown
    entityId?: unknown
    pagePath?: unknown
    position?: unknown
    sessionId?: unknown
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}))
    const rawItems = Array.isArray(body.items) ? body.items : []
    const items = rawItems
        .map((item: ImpressionPayload) => ({
            productId: typeof item.productId === 'string' ? item.productId : '',
            placement: isAffiliatePlacement(item.placement) ? item.placement : 'unknown',
            entityType: typeof item.entityType === 'string' ? item.entityType : null,
            entityId: typeof item.entityId === 'string' ? item.entityId : null,
            pagePath: typeof item.pagePath === 'string' ? item.pagePath.slice(0, 500) : null,
            position: typeof item.position === 'number' ? item.position : null,
            sessionId: typeof item.sessionId === 'string' ? item.sessionId.slice(0, 128) : null,
        }))
        .filter((item: { productId: string }) => item.productId)
        .slice(0, 50)

    if (!items.length) return NextResponse.json({ ok: true, created: 0 })

    try {
        await prisma.storeProductImpression.createMany({ data: items })
        return NextResponse.json({ ok: true, created: items.length })
    } catch {
        return NextResponse.json({ ok: false, created: 0 })
    }
}
