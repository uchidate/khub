import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')  // '4xx' | '5xx' | 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

    const where = status === '4xx'
        ? { status: { gte: 400, lt: 500 } }
        : status === '5xx'
            ? { status: { gte: 500 } }
            : status === 'errors'
                ? { status: { gte: 400 } }
                : {}

    const [logs, total] = await Promise.all([
        prisma.serverLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
        prisma.serverLog.count({ where }),
    ])

    return NextResponse.json({ logs, total })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const olderThanDays = parseInt(searchParams.get('days') ?? '7')
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)

    const { count } = await prisma.serverLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ deleted: count })
}
