import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTISTS')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    await prisma.artist.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    if (session?.user?.id) {
      await prisma.activity.create({
        data: { userId: session.user.id, type: 'VIEW', entityId: id, entityType: 'ARTIST' },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('View tracking error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
