import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTISTS')

// POST → adicionar favorito
// - Incrementa favoriteCount no Artist (para trending)
// - Cria registro em Favorite se autenticado (para perfil)
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    await prisma.$transaction(async (tx) => {
      await tx.artist.update({
        where: { id: params.id },
        data: { favoriteCount: { increment: 1 } },
      })

      if (session?.user?.id) {
        await tx.favorite.upsert({
          where: { userId_artistId: { userId: session.user.id, artistId: params.id } },
          create: { userId: session.user.id, artistId: params.id },
          update: {},
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Favorite increment error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// DELETE → remover favorito
// - Decrementa favoriteCount no Artist (para trending)
// - Remove registro de Favorite se autenticado (para perfil)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE "Artist"
        SET "favoriteCount" = GREATEST("favoriteCount" - 1, 0)
        WHERE id = ${params.id}
      `

      if (session?.user?.id) {
        await tx.favorite.deleteMany({
          where: { userId: session.user.id, artistId: params.id },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Favorite decrement error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
