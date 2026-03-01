import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTIONS-VIEW')

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (session?.user?.id) {
            await prisma.activity.create({
                data: { userId: session.user.id, type: 'VIEW', entityId: params.id, entityType: 'PRODUCTION' },
            }).catch(() => {})
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('Production view tracking error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
