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
    const status  = searchParams.get('status') ?? 'errors' // '4xx' | '5xx' | 'all' | 'errors'
    const path    = searchParams.get('path') ?? ''
    const limit   = Math.min(parseInt(searchParams.get('limit') ?? '150'), 500)
    const page    = Math.max(1, parseInt(searchParams.get('page') ?? '1'))

    const statusWhere =
        status === '4xx'    ? { status: { gte: 400, lt: 500 } } :
        status === '5xx'    ? { status: { gte: 500 } } :
        status === 'errors' ? { status: { gte: 400 } } :
        {}

    const where = {
        ...statusWhere,
        ...(path ? { path: { contains: path, mode: 'insensitive' as const } } : {}),
    }

    const [logs, total, counts] = await Promise.all([
        prisma.serverLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.serverLog.count({ where }),
        // Contagens reais por categoria para stats
        Promise.all([
            prisma.serverLog.count({ where: { status: { gte: 400 } } }),
            prisma.serverLog.count({ where: { status: { gte: 500 } } }),
            prisma.serverLog.count({ where: { status: { gte: 400, lt: 500 } } }),
            prisma.serverLog.count(),
        ]),
    ])

    return NextResponse.json({
        logs,
        total,
        page,
        pages: Math.ceil(total / limit),
        counts: {
            errors: counts[0],
            fivexx: counts[1],
            fourxx: counts[2],
            all:    counts[3],
        },
    })
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const olderThanDays = parseInt(searchParams.get('days') ?? '7')

    if (olderThanDays === 0) {
        // Limpar tudo
        const { count } = await prisma.serverLog.deleteMany({})
        return NextResponse.json({ deleted: count })
    }

    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    const { count } = await prisma.serverLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ deleted: count })
}
