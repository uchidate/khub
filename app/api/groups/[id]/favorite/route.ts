import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('GROUPS')

// POST → adicionar favorito de grupo
export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    await prisma.$transaction(async (tx) => {
      await tx.musicalGroup.update({
        where: { id: params.id },
        data: { favoriteCount: { increment: 1 } },
      })

      if (session?.user?.id) {
        await tx.favorite.upsert({
          where: { userId_groupId: { userId: session.user.id, groupId: params.id } },
          create: { userId: session.user.id, groupId: params.id },
          update: {},
        })
      }
    })

    if (session?.user?.id) {
      await prisma.activity.create({
        data: { userId: session.user.id, type: 'FAVORITE_ADD', entityId: params.id, entityType: 'GROUP' },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Group favorite increment error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// DELETE → remover favorito de grupo
export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "MusicalGroup"
        SET "favoriteCount" = GREATEST("favoriteCount" - 1, 0)
        WHERE id = ${params.id}
      `

      if (session?.user?.id) {
        await tx.favorite.deleteMany({
          where: { userId: session.user.id, groupId: params.id },
        })
      }
    })

    if (session?.user?.id) {
      await prisma.activity.create({
        data: { userId: session.user.id, type: 'FAVORITE_REMOVE', entityId: params.id, entityType: 'GROUP' },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Group favorite decrement error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
