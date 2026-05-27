import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

export interface PendingCounts {
  reports: number
  comments: number
  attention: number
  automation: number
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
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [reports, comments, systemErrors, aiFailures] = await Promise.all([
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.comment.count({ where: { status: 'FLAGGED' } }),
      prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: since24h } } }),
      prisma.aiUsageLog.count({
        where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: since24h } },
      }),
    ])

    return NextResponse.json({
      reports,
      comments,
      attention: reports + comments,
      automation: systemErrors + aiFailures,
    } satisfies PendingCounts)
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
