import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'
import { revalidatePath } from 'next/cache'
import type { NewsBlock } from '@/lib/types/blocks'

const log = createLogger('ADMIN-NEWS-BLOCKS')

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/admin/news/[id]/blocks
 * Save the block-based content for a news article.
 * Body: { blocks: NewsBlock[] }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const { id } = await params
        const body = await req.json() as { blocks: NewsBlock[] }

        if (!Array.isArray(body.blocks)) {
            return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const news = await (prisma.news as any).update({
            where: { id },
            data: { blocks: body.blocks },
            select: { id: true, blocks: true },
        })

        // Revalidate the public news page
        revalidatePath(`/news/${id}`)

        return NextResponse.json(news)
    } catch (error) {
        log.error('Save news blocks error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
