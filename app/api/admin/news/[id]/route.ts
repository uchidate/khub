import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('ADMIN-NEWS-ID')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/news/[id]
 * Fetch a single news article by ID (used to open edit modal via deep link)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        artists: {
          include: {
            artist: {
              select: { id: true, nameRomanized: true, primaryImageUrl: true },
            },
          },
          take: 6,
        },
      },
    })

    if (!news) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(news)
  } catch (error) {
    log.error('Get news by id error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
