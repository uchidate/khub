import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
    const session = await auth()
    if (!session || !['admin', 'editor'].includes(session.user.role?.toLowerCase() ?? '')) {
        return null
    }
    return session
}

// GET /api/admin/streaming?source=netflix_br&page=1
export async function GET(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const source = searchParams.get('source') ?? undefined
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit  = 20
    const skip   = (page - 1) * limit

    const where = source ? { source } : {}

    const [shows, total] = await Promise.all([
        prisma.streamingShow.findMany({
            where,
            orderBy: [{ source: 'asc' }, { rank: 'asc' }],
            skip,
            take: limit,
            include: { production: { select: { id: true, titlePt: true } } },
        }),
        prisma.streamingShow.count({ where }),
    ])

    return NextResponse.json({ data: shows, total, page, pages: Math.ceil(total / limit) })
}

// DELETE /api/admin/streaming?id=xxx
export async function DELETE(request: NextRequest) {
    if (!await requireAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    await prisma.streamingShow.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

// POST /api/admin/streaming/refresh — dispara o cron
export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({})) as { action?: string }
    if (body.action !== 'refresh') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const cronSecret = process.env.CRON_SECRET ?? process.env.NEXTAUTH_SECRET ?? ''
    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const res = await fetch(`${base}/api/cron/fetch-streaming-shows`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
}
