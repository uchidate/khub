import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export interface PendingCounts {
  reports: number
  comments: number
}

/**
 * GET /api/admin/pending-counts
 * Retorna contagens de itens que precisam de atenção imediata.
 * Usado pelo AdminLayout para exibir badges no sidebar.
 * Cache leve: chamado a cada 60s pelo sidebar.
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const [reports, comments] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.comment.count({ where: { status: 'FLAGGED' } }),
    ])

    return NextResponse.json({ reports, comments } satisfies PendingCounts)
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
