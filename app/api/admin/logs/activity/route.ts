import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.user.role?.toLowerCase() !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const sp = req.nextUrl.searchParams
    const type = sp.get('type') || ''
    const days = parseInt(sp.get('days') || '7')
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const limit = 30

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        createdAt: { gte: since },
        ...(type ? { type } : {}),
    }

    const [logs, total] = await Promise.all([
        prisma.activity.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
        }),
        prisma.activity.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
