import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTIONS-FAVORITE')

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        await prisma.favorite.upsert({
            where: { userId_productionId: { userId: session.user.id, productionId: params.id } },
            create: { userId: session.user.id, productionId: params.id },
            update: {},
        })

        await (prisma as any).activity.create({
            data: { userId: session.user.id, type: 'LIKE', entityId: params.id, entityType: 'PRODUCTION' },
        }).catch(() => {})

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Production favorite error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
        }

        await prisma.favorite.deleteMany({
            where: { userId: session.user.id, productionId: params.id },
        })

        await (prisma as any).activity.create({
            data: { userId: session.user.id, type: 'UNLIKE', entityId: params.id, entityType: 'PRODUCTION' },
        }).catch(() => {})

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Production unfavorite error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
