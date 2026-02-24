import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
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
