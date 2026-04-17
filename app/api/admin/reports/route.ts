import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { logAudit } from '@/lib/services/audit-service'
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
  const category   = searchParams.get('category')   || undefined
  const search     = searchParams.get('search')      || undefined

  const where = {
    ...(status     ? { status }     : {}),
    ...(entityType ? { entityType } : {}),
    ...(category   ? { category }   : {}),
    ...(search     ? { entityName: { contains: search, mode: 'insensitive' as const } } : {}),
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

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json() as { ids: string[]; status: string }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
  }
  if (!['REVIEWED', 'RESOLVED', 'DISMISSED'].includes(body.status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const result = await prisma.report.updateMany({
    where: { id: { in: body.ids } },
    data:  { status: body.status },
  })

  await logAudit({ adminId: session!.user.id, action: body.status === 'DISMISSED' ? 'REJECT' : 'APPROVE', entity: 'Report', details: `Bulk ${body.status}: ${result.count} reporte(s)` })
  return NextResponse.json({ updated: result.count })
}

export async function DELETE(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const body = await req.json() as { ids: string[] }
  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: 'IDs obrigatórios' }, { status: 400 })
  }

  const result = await prisma.report.deleteMany({
    where: { id: { in: body.ids } },
  })

  await logAudit({ adminId: session!.user.id, action: 'DELETE', entity: 'Report', details: `Deletou ${result.count} reporte(s)` })
  return NextResponse.json({ deleted: result.count })
}
