import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role?.toLowerCase() !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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
