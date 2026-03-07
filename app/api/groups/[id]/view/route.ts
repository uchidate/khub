import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('GROUPS')

export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    await prisma.musicalGroup.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    })

    if (session?.user?.id) {
      await prisma.activity.create({
        data: { userId: session.user.id, type: 'VIEW', entityId: params.id, entityType: 'GROUP' },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Group view increment error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
