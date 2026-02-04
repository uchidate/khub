import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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
    console.error('View tracking error:', error)
    // Don't fail if view tracking fails - it's not critical
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
