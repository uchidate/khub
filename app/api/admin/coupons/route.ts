import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

function endOfDayBRT(offsetDays = 0): Date {
    const now = new Date()
    const brt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    brt.setDate(brt.getDate() + offsetDays)
    brt.setHours(23, 59, 59, 999)
    // Convert back to UTC
    const diffMs = now.getTime() - new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })).getTime()
    return new Date(brt.getTime() + diffMs)
}

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const coupons = await prisma.storeCoupon.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
    })
    return NextResponse.json(coupons)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { code, description, discount, minPurchase, store, affiliateUrl, expiresAt } = body

    if (!code || !description || !discount || !affiliateUrl) {
        return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const coupon = await prisma.storeCoupon.create({
        data: {
            code: code.trim().toUpperCase(),
            description: description.trim(),
            discount: discount.trim(),
            minPurchase: minPurchase?.trim() || null,
            store: store || 'shopee',
            affiliateUrl: affiliateUrl.trim(),
            expiresAt: expiresAt ? new Date(expiresAt) : endOfDayBRT(),
        },
    })
    return NextResponse.json(coupon, { status: 201 })
}
