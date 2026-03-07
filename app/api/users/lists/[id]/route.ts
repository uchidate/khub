import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('USER-LISTS')

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    isPublic: z.boolean().optional(),
})

async function getOwnedList(userId: string, listId: string) {
    const list = await prisma.userList.findUnique({ where: { id: listId } })
    if (!list || list.userId !== userId) return null
    return list
}

/**
 * GET /api/users/lists/[id]
 * Returns a list with its items
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const list = await prisma.userList.findUnique({
            where: { id: params.id },
            include: { items: { orderBy: { addedAt: 'desc' } } },
        })

        if (!list || list.userId !== session.user.id) {
            return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
        }

        return NextResponse.json(list)
    } catch (error) {
        log.error('Get list error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/users/lists/[id]
 * Update list name/description/visibility
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const owned = await getOwnedList(session.user.id, params.id)
        if (!owned) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })

        const body = await request.json()
        const validated = updateSchema.parse(body)

        const updated = await prisma.userList.update({ where: { id: params.id }, data: validated })
        return NextResponse.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Update list error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/users/lists/[id]
 * Delete a list and all its items
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const owned = await getOwnedList(session.user.id, params.id)
        if (!owned) return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })

        await prisma.userList.delete({ where: { id: params.id } })
        return NextResponse.json({ ok: true })
    } catch (error) {
        log.error('Delete list error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
