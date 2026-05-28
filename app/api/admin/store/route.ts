import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'
import { captureStoreProductSnapshot } from '@/lib/store/product-quality'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const store = searchParams.get('store') || undefined
    const active = searchParams.get('active')

    const products = await prisma.storeProduct.findMany({
        where: {
            ...(category && { category }),
            ...(store && { store }),
            ...(active !== null && active !== '' && { isActive: active === 'true' }),
        },
        orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { name, description, price, originalPrice, imageUrl, affiliateUrl,
        store, category, badge, rating, soldCount, reviewCount, externalId,
        isActive, isHidden, featured, position, tags } = body

    if (!name || !imageUrl || !affiliateUrl || !category) {
        return NextResponse.json({ error: 'Campos obrigatórios: name, imageUrl, affiliateUrl, category' }, { status: 400 })
    }

    const finalStore = store || 'shopee'
    const canPublish = finalStore !== 'mercadolivre' || isOfficialMercadoLivreAffiliateUrl(affiliateUrl)

    if (isActive === true && !canPublish) {
        return NextResponse.json({
            error: 'Produtos do Mercado Livre só podem ficar ativos com link oficial de afiliado (meli.la ou /social/... com matt_word/ref).',
        }, { status: 400 })
    }

    const data = {
        name, description, price,
        originalPrice: originalPrice || null,
        imageUrl, affiliateUrl,
        store: finalStore,
        category, badge: badge || null,
        rating: rating ? parseFloat(rating) : null,
        soldCount: soldCount || null,
        reviewCount: reviewCount != null ? Number(reviewCount) : null,
        externalId: externalId || null,
        isActive: canPublish ? (isActive ?? true) : false,
        isHidden: isHidden ?? false,
        featured: canPublish ? (featured ?? false) : false,
        position: position ?? 0,
        tags: tags || [],
    }

    const product = externalId
        ? await prisma.storeProduct.upsert({
            where: { externalId },
            update: data,
            create: data,
        })
        : await prisma.storeProduct.create({ data })

    await captureStoreProductSnapshot(product)

    revalidatePath('/')
    revalidatePath('/loja')
    return NextResponse.json(product, { status: 201 })
}
