import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTISTS')

// POST → adicionar favorito (incrementa favoriteCount)
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.artist.update({
      where: { id: params.id },
      data: { favoriteCount: { increment: 1 } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Favorite increment error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// DELETE → remover favorito (decrementa favoriteCount, mínimo 0)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.$executeRaw`
      UPDATE "Artist"
      SET "favoriteCount" = GREATEST("favoriteCount" - 1, 0)
      WHERE id = ${params.id}
    `
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Favorite decrement error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
