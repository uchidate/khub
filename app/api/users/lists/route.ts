import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('USER-LISTS')

export const dynamic = 'force-dynamic'

const listSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    isPublic: z.boolean().optional(),
})

/**
 * GET /api/users/lists
 * Returns authenticated user's lists with item counts
 */
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const lists = await prisma.userList.findMany({
            where: { userId: session.user.id },
            include: { _count: { select: { items: true } } },
            orderBy: { updatedAt: 'desc' },
        })

        return NextResponse.json(lists.map(l => ({ ...l, itemCount: l._count.items })))
    } catch (error) {
        log.error('Get lists error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * POST /api/users/lists
 * Create a new list
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const validated = listSchema.parse(body)

        const list = await prisma.userList.create({
            data: { ...validated, userId: session.user.id },
        })

        return NextResponse.json(list, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Create list error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
