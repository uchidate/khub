import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('NEWS-FAVORITE')

export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        await prisma.favorite.upsert({
            where: { userId_newsId: { userId: session.user.id, newsId: params.id } },
            create: { userId: session.user.id, newsId: params.id },
            update: {},
        })

        await prisma.activity.create({
            data: { userId: session.user.id, type: 'FAVORITE_ADD', entityId: params.id, entityType: 'NEWS' },
        }).catch(() => {})

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('News favorite error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        await prisma.favorite.deleteMany({
            where: { userId: session.user.id, newsId: params.id },
        })

        await prisma.activity.create({
            data: { userId: session.user.id, type: 'FAVORITE_REMOVE', entityId: params.id, entityType: 'NEWS' },
        }).catch(() => {})

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('News unfavorite error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
