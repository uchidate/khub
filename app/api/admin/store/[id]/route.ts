import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await request.json()

    const product = await prisma.storeProduct.update({
        where: { id },
        data: {
            ...body,
            rating: body.rating !== undefined ? (body.rating ? parseFloat(body.rating) : null) : undefined,
            updatedAt: new Date(),
        },
    }).catch(() => null)

    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    return NextResponse.json(product)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.storeProduct.delete({ where: { id } }).catch(() => null)
    return NextResponse.json({ ok: true })
}
