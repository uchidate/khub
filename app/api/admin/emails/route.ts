import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (session?.user?.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const days = parseInt(searchParams.get('days') || '30')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 20

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
        createdAt: { gte: since },
    }

    const [logs, total] = await Promise.all([
        prisma.emailLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                to: true,
                subject: true,
                type: true,
                templateSlug: true,
                status: true,
                resendId: true,
                errorMessage: true,
                sentAt: true,
                createdAt: true,
                user: { select: { id: true, name: true } },
            },
        }),
        prisma.emailLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
