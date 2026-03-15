import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/news/stats
 * Returns news stats in a single round-trip (4 parallel Prisma queries).
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [total, hidden, today, queue] = await Promise.all([
      prisma.news.count(),
      prisma.news.count({ where: { isHidden: true } }),
      prisma.news.count({ where: { publishedAt: { gte: todayStart } } }),
      prisma.news.count({ where: { status: { in: ['draft', 'ready'] } } }),
    ])

    return NextResponse.json({ total, hidden, today, queue })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
