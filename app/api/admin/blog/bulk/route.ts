import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type BulkAction = 'publish' | 'archive' | 'delete' | 'review'

/**
 * POST /api/admin/blog/bulk
 * Body: { ids: string[], action: BulkAction }
 *
 * Executa ação em lote sobre posts do blog.
 */
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { ids, action } = await req.json() as { ids: string[]; action: BulkAction }

    if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids obrigatório' }, { status: 400 })
    }
    if (!['publish', 'archive', 'delete', 'review'].includes(action)) {
        return NextResponse.json({ error: 'action inválida' }, { status: 400 })
    }

    let affected = 0

    if (action === 'delete') {
        const result = await prisma.blogPost.deleteMany({ where: { id: { in: ids } } })
        affected = result.count
    } else {
        const statusMap: Record<BulkAction, string> = {
            publish: 'PUBLISHED',
            archive: 'ARCHIVED',
            review:  'PENDING_REVIEW',
            delete:  '',
        }
        const data: Record<string, unknown> = { status: statusMap[action] }
        if (action === 'publish') data.publishedAt = new Date()

        const result = await prisma.blogPost.updateMany({
            where: { id: { in: ids } },
            data,
        })
        affected = result.count
    }

    return NextResponse.json({ ok: true, affected })
}
