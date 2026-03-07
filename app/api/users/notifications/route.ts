import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('USER-NOTIFICATIONS')

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/notifications
 * Returns last 20 IN_APP notifications with unread count
 */
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const [notifications, unreadCount] = await Promise.all([
            prisma.notificationHistory.findMany({
                where: { userId: session.user.id, type: 'IN_APP' },
                include: {
                    news: { select: { id: true, title: true, imageUrl: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: 20,
            }),
            prisma.notificationHistory.count({
                where: { userId: session.user.id, type: 'IN_APP', readAt: null },
            }),
        ])

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        log.error('Get notifications error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/users/notifications
 * Mark notifications as read
 * Body: { ids?: string[], markAllRead?: boolean }
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { ids, markAllRead } = z.object({
            ids: z.array(z.string()).optional(),
            markAllRead: z.boolean().optional(),
        }).parse(body)

        const readAt = new Date()

        if (markAllRead) {
            await prisma.notificationHistory.updateMany({
                where: { userId: session.user.id, type: 'IN_APP', readAt: null },
                data: { readAt },
            })
        } else if (ids && ids.length > 0) {
            await prisma.notificationHistory.updateMany({
                where: { userId: session.user.id, id: { in: ids }, type: 'IN_APP' },
                data: { readAt },
            })
        }

        return NextResponse.json({ ok: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Mark notifications read error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
