import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 100), 250)

    const candidates = await prisma.storeProductCandidate.findMany({
        where: {
            ...(status && { status }),
            ...(entityType && { entityType }),
            ...(entityId && { entityId }),
        },
        orderBy: [{ matchScore: 'desc' }, { updatedAt: 'desc' }],
        take: limit,
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                    affiliateUrl: true,
                    store: true,
                    category: true,
                    isActive: true,
                    isHidden: true,
                    rating: true,
                    reviewCount: true,
                    clickCount: true,
                },
            },
        },
    })

    return NextResponse.json(candidates)
}

export async function PATCH(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const id = typeof body.id === 'string' ? body.id : ''
    const status = typeof body.status === 'string' ? body.status : ''
    if (!id || !['candidate', 'approved', 'rejected', 'expired'].includes(status)) {
        return NextResponse.json({ error: 'id/status inválidos' }, { status: 400 })
    }

    const candidate = await prisma.storeProductCandidate.update({
        where: { id },
        data: { status, source: 'manual' },
    })

    if (status === 'approved') {
        await prisma.storeProductLink.upsert({
            where: {
                productId_entityType_entityId: {
                    productId: candidate.productId,
                    entityType: candidate.entityType,
                    entityId: candidate.entityId,
                },
            },
            create: {
                productId: candidate.productId,
                entityType: candidate.entityType,
                entityId: candidate.entityId,
                score: Math.max(0.1, Math.min(1, candidate.matchScore / 100)),
                source: 'manual',
            },
            update: {
                score: Math.max(0.1, Math.min(1, candidate.matchScore / 100)),
                source: 'manual',
            },
        })
    }

    return NextResponse.json(candidate)
}
