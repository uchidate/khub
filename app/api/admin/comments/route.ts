import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-helpers'

export const dynamic = 'force-dynamic'

// GET /api/admin/comments — lista paginada com filtros
export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const skip   = (page - 1) * limit
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined  // 'ACTIVE' | 'FLAGGED' | 'REMOVED'
    const newsId = searchParams.get('newsId') || undefined
    const userId = searchParams.get('userId') || undefined
    const sortBy = searchParams.get('sortBy') || 'newest'   // 'newest' | 'oldest'

    const where: Record<string, unknown> = {}
    if (status)  where.status = status
    if (newsId)  where.newsId = newsId
    if (userId)  where.userId = userId
    if (search)  where.content = { contains: search, mode: 'insensitive' }

    const orderBy = sortBy === 'oldest'
        ? { createdAt: 'asc' as const }
        : { createdAt: 'desc' as const }

    const [comments, total, stats] = await Promise.all([
        prisma.comment.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            select: {
                id:             true,
                content:        true,
                status:         true,
                moderationNote: true,
                moderatedAt:    true,
                createdAt:      true,
                user: {
                    select: { id: true, name: true, email: true, image: true, role: true },
                },
                news: {
                    select: { id: true, title: true },
                },
            },
        }),
        prisma.comment.count({ where }),
        // stats globais (sem filtros de texto/news/user para refletir totais reais)
        prisma.comment.groupBy({
            by: ['status'],
            _count: { id: true },
        }),
    ])

    const statsMap = Object.fromEntries(
        stats.map(s => [s.status, s._count.id])
    )

    return NextResponse.json({
        comments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: {
            total:   (statsMap.ACTIVE ?? 0) + (statsMap.FLAGGED ?? 0) + (statsMap.REMOVED ?? 0),
            active:  statsMap.ACTIVE  ?? 0,
            flagged: statsMap.FLAGGED ?? 0,
            removed: statsMap.REMOVED ?? 0,
        },
    })
}

// DELETE /api/admin/comments — exclusão em massa
export async function DELETE(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json() as { ids: string[] }
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
    }

    const result = await prisma.comment.deleteMany({
        where: { id: { in: body.ids } },
    })

    return NextResponse.json({ deleted: result.count })
}
