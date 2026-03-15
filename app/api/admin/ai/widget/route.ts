import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/ai/widget
 * Dados resumidos para o widget de IA no dashboard.
 * Propositalmente leve: 3 queries.
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const [lastJob, totalToday, recentProviders] = await Promise.all([
      prisma.aiUsageLog.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, status: true, feature: true, provider: true },
      }),
      prisma.aiUsageLog.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.aiUsageLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 86400_000) },
          status: 'success',
        },
        select: { provider: true },
        distinct: ['provider'],
        take: 3,
      }),
    ])

    return NextResponse.json({
      lastJobAt: lastJob?.createdAt ?? null,
      lastJobStatus: lastJob?.status === 'success' ? 'success' : lastJob ? 'failed' : null,
      lastJobType: lastJob?.feature ?? null,
      totalJobsToday: totalToday,
      activeProviders: recentProviders.map((r: { provider: string }) => r.provider),
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
