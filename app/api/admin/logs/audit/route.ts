import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const sp = req.nextUrl.searchParams
    const entity = sp.get('entity') || ''
    const action = sp.get('action') || ''
    const days = parseInt(sp.get('days') || '30')
    const page = Math.max(1, parseInt(sp.get('page') || '1'))
    const limit = 30

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where = {
        createdAt: { gte: since },
        ...(entity ? { entity } : {}),
        ...(action ? { action } : {}),
    }

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: { admin: { select: { id: true, name: true, email: true, image: true } } },
        }),
        prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
}
