import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import { snapshotPost } from '@/lib/services/blog-version'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
    note: z.string().max(300).optional(),
    label: z.string().max(100).optional().nullable(),
    pinned: z.boolean().optional(),
})

/**
 * POST /api/admin/blog/:id/snapshot
 *
 * Cria manualmente um snapshot do estado atual do post.
 * Deve ser chamado ANTES de qualquer operação destrutiva direta no banco.
 *
 * Usado por: scripts admin, skills /db-insert, operações manuais de manutenção.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error, session } = await requireEditorOrAdmin()
    if (error) return error

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { note, label, pinned } = bodySchema.parse(body)

    const versionId = await snapshotPost(id, {
        savedById: session!.user.id,
        note: note ?? '(manual snapshot)',
        label: label ?? undefined,
        pinned: pinned ?? false,
    })

    if (!versionId) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, versionId })
}
