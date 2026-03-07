import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)

  // Stats endpoint
  if (searchParams.get('stats') === '1') {
    const counts = await prisma.report.groupBy({
      by: ['status'],
      _count: { id: true },
    })
    const map = Object.fromEntries(counts.map(c => [c.status, c._count.id]))
    return NextResponse.json({
      total:     (map.PENDING ?? 0) + (map.REVIEWED ?? 0) + (map.RESOLVED ?? 0) + (map.DISMISSED ?? 0),
      pending:   map.PENDING   ?? 0,
      reviewed:  map.REVIEWED  ?? 0,
      resolved:  map.RESOLVED  ?? 0,
      dismissed: map.DISMISSED ?? 0,
    })
  }

  const page       = Math.max(1, parseInt(searchParams.get('page')  || '1'))
  const limit      = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const status     = searchParams.get('status')     || undefined
  const entityType = searchParams.get('entityType') || undefined

  const where = {
    ...(status     ? { status }     : {}),
    ...(entityType ? { entityType } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.report.count({ where }),
  ])

  return NextResponse.json({ items, total, page, totalPages: Math.ceil(total / limit) })
}
