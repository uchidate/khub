import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-helpers'

// PATCH /api/admin/comments/[id] — alterar status ou nota
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error, session } = await requireAdmin()
    if (error) return error

    const body = await request.json() as {
        status?: 'ACTIVE' | 'FLAGGED' | 'REMOVED'
        moderationNote?: string
    }

    if (body.status && !['ACTIVE', 'FLAGGED', 'REMOVED'].includes(body.status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (body.status) {
        data.status       = body.status
        data.moderatedById = session!.user.id
        data.moderatedAt   = new Date()
    }
    if (body.moderationNote !== undefined) {
        data.moderationNote = body.moderationNote || null
    }

    const comment = await prisma.comment.update({
        where: { id: params.id },
        data,
        select: { id: true, status: true, moderationNote: true, moderatedAt: true },
    })

    return NextResponse.json(comment)
}

// DELETE /api/admin/comments/[id] — exclusão individual
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    const { error } = await requireAdmin()
    if (error) return error

    await prisma.comment.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
}
