import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('NEWS-VIEW')

export async function POST(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params

        await prisma.news.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        log.error('News view tracking error', { error: getErrorMessage(error) })
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
