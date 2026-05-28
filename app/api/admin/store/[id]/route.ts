import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'
import { captureStoreProductSnapshot } from '@/lib/store/product-quality'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const existing = await prisma.storeProduct.findUnique({
        where: { id },
        select: { store: true, affiliateUrl: true },
    })

    if (!existing) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const nextStore = body.store ?? existing.store
    const nextAffiliateUrl = body.affiliateUrl ?? existing.affiliateUrl
    if (
        nextStore === 'mercadolivre' &&
        body.isActive === true &&
        !isOfficialMercadoLivreAffiliateUrl(nextAffiliateUrl)
    ) {
        return NextResponse.json({
            error: 'Produtos do Mercado Livre só podem ficar ativos com link oficial de afiliado (meli.la ou /social/... com matt_word/ref).',
        }, { status: 400 })
    }

    const product = await prisma.storeProduct.update({
        where: { id },
        data: {
            ...body,
            rating: body.rating !== undefined ? (body.rating ? parseFloat(body.rating) : null) : undefined,
            updatedAt: new Date(),
        },
    }).catch(() => null)

    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    await captureStoreProductSnapshot(product)
    revalidatePath('/'); revalidatePath('/loja')
    return NextResponse.json(product)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    await prisma.storeProduct.delete({ where: { id } }).catch(() => null)
    revalidatePath('/'); revalidatePath('/loja')
    return NextResponse.json({ ok: true })
}
