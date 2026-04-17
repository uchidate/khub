import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const sp = req.nextUrl.searchParams
    const level = sp.get('level') || ''
    const source = sp.get('source') || ''
    const days = parseInt(sp.get('days') || '7')
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const limit = 30

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        createdAt: { gte: since },
        ...(level ? { level } : {}),
        ...(source ? { source } : {}),
    }

    const [events, total] = await Promise.all([
        prisma.systemEvent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.systemEvent.count({ where }),
    ])

    return NextResponse.json({ events, total, page, pages: Math.ceil(total / limit) })
}
