import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { detectBot } from '@/lib/utils/bot-detector'

const log = createLogger('NEWS-VIEW')

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { id } = params
        const session  = await getServerSession(authOptions)
        const isBot    = !!detectBot(request.headers.get('user-agent'))
        const isAdmin  = session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR'

        if (!isBot && !isAdmin) {
            const now = new Date()
            const today = new Date(now); today.setUTCHours(0, 0, 0, 0)
            const slot = Math.floor(now.getUTCHours() * 4 + now.getUTCMinutes() / 15)
            await Promise.all([
                prisma.news.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
                prisma.viewEvent.upsert({
                    where: { entityType_entityId_date: { entityType: 'news', entityId: id, date: today } },
                    update: { count: { increment: 1 } },
                    create: { entityType: 'news', entityId: id, date: today, count: 1 },
                }),
                prisma.viewEventHourly.upsert({
                    where: { entityType_entityId_date_slot: { entityType: 'news', entityId: id, date: today, slot } },
                    update: { count: { increment: 1 } },
                    create: { entityType: 'news', entityId: id, date: today, slot, count: 1 },
                }),
            ])
        }

        if (session?.user?.id) {
            await prisma.activity.create({
                data: { userId: session.user.id, type: 'VIEW', entityId: id, entityType: 'NEWS' },
            }).catch(() => {})
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('News view tracking error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
