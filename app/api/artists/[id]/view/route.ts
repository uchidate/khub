import { NextRequest, NextResponse } from 'next/server'
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

    // Increment view count
    await prisma.artist.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('View tracking error', { error: getErrorMessage(error) })
    // Don't fail if view tracking fails - it's not critical
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
