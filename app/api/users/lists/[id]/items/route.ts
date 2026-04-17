import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('USER-LIST-ITEMS')

export const dynamic = 'force-dynamic'

const addItemSchema = z.object({
    entityType: z.enum(['ARTIST', 'PRODUCTION', 'GROUP']),
    entityId: z.string().min(1),
    note: z.string().max(300).optional().nullable(),
})

const removeItemSchema = z.object({
    entityType: z.enum(['ARTIST', 'PRODUCTION', 'GROUP']),
    entityId: z.string().min(1),
})

/**
 * POST /api/users/lists/[id]/items
 * Add an item to a list
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const list = await prisma.userList.findUnique({ where: { id: params.id } })
        if (!list || list.userId !== session.user.id) {
            return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
        }

        const body = await request.json()
        const { entityType, entityId, note } = addItemSchema.parse(body)

        const item = await prisma.userListItem.upsert({
            where: { listId_entityType_entityId: { listId: params.id, entityType, entityId } },
            create: { listId: params.id, entityType, entityId, note },
            update: { note },
        })

        // Update list updatedAt
        await prisma.userList.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Add list item error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/users/lists/[id]/items
 * Remove an item from a list
 * Body: { entityType, entityId }
 */
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const list = await prisma.userList.findUnique({ where: { id: params.id } })
        if (!list || list.userId !== session.user.id) {
            return NextResponse.json({ error: 'Lista não encontrada' }, { status: 404 })
        }

        const body = await request.json()
        const { entityType, entityId } = removeItemSchema.parse(body)

        await prisma.userListItem.delete({
            where: { listId_entityType_entityId: { listId: params.id, entityType, entityId } },
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Remove list item error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
