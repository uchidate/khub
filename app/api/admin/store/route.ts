import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

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
        store, category, badge, rating, soldCount, isActive, featured, position, tags } = body

    if (!name || !price || !imageUrl || !affiliateUrl || !category) {
        return NextResponse.json({ error: 'Campos obrigatórios: name, price, imageUrl, affiliateUrl, category' }, { status: 400 })
    }

    const product = await prisma.storeProduct.create({
        data: {
            name, description, price,
            originalPrice: originalPrice || null,
            imageUrl, affiliateUrl,
            store: store || 'shopee',
            category, badge: badge || null,
            rating: rating ? parseFloat(rating) : null,
            soldCount: soldCount || null,
            isActive: isActive ?? true,
            featured: featured ?? false,
            position: position ?? 0,
            tags: tags || [],
        },
    })

    return NextResponse.json(product, { status: 201 })
}
