import prisma from '@/lib/prisma'

export interface AiDayStat {
    date: string   // 'YYYY-MM-DD'
    cost: number
    calls: number
}

export interface AiSummary {
    totalCalls:      number
    successCalls:    number
    errorCalls:      number
    successRate:     number   // 0-100
    totalCostUsd:    number
    avgLatencyMs:    number
    callsByProvider: Record<string, number>
    callsByFeature:  Record<string, number>
    costByProvider:  Record<string, number>
}

/** Estatísticas resumidas dos últimos N dias */
export async function getAiSummary(days: number): Promise<AiSummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [agg, byProvider, byFeature, costByProvider] = await Promise.all([
        prisma.aiUsageLog.aggregate({
            where: { createdAt: { gte: since } },
            _count: { _all: true },
            _avg:   { durationMs: true },
            _sum:   { cost: true },
        }),
        prisma.aiUsageLog.groupBy({
            by:    ['provider'],
            where: { createdAt: { gte: since } },
            _count: { _all: true },
        }),
        prisma.aiUsageLog.groupBy({
            by:    ['feature'],
            where: { createdAt: { gte: since } },
            _count: { _all: true },
        }),
        prisma.aiUsageLog.groupBy({
            by:    ['provider'],
            where: { createdAt: { gte: since } },
            _sum:  { cost: true },
        }),
    ])

    const totalCalls   = agg._count._all
    const successCalls = await prisma.aiUsageLog.count({
        where: { createdAt: { gte: since }, status: 'success' },
    })

    return {
        totalCalls,
        successCalls,
        errorCalls:      totalCalls - successCalls,
        successRate:     totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100,
        totalCostUsd:    agg._sum.cost ?? 0,
        avgLatencyMs:    Math.round(agg._avg.durationMs ?? 0),
        callsByProvider: Object.fromEntries(byProvider.map(r => [r.provider, r._count._all])),
        callsByFeature:  Object.fromEntries(byFeature.map(r => [r.feature, r._count._all])),
        costByProvider:  Object.fromEntries(costByProvider.map(r => [r.provider, r._sum.cost ?? 0])),
    }
}

/** Custo e chamadas por dia nos últimos N dias */
export async function getAiCostByDay(days: number): Promise<AiDayStat[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const rows = await prisma.$queryRaw<Array<{ date: Date; cost: number; calls: bigint }>>`
        SELECT
            DATE_TRUNC('day', "createdAt") AS date,
            SUM(cost)::float               AS cost,
            COUNT(*)                       AS calls
        FROM ai_usage_log
        WHERE "createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
    `
    return rows.map(r => ({
        date:  r.date.toISOString().slice(0, 10),
        cost:  r.cost,
        calls: Number(r.calls),
    }))
}

/** Gasto acumulado no mês corrente por provider */
export async function getMonthlySpend(): Promise<{ byProvider: Record<string, number>; total: number }> {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const rows = await prisma.aiUsageLog.groupBy({
        by:    ['provider'],
        where: { createdAt: { gte: startOfMonth } },
        _sum:  { cost: true },
    })

    const byProvider = Object.fromEntries(rows.map(r => [r.provider, r._sum.cost ?? 0]))
    const total      = Object.values(byProvider).reduce((a, b) => a + b, 0)
    return { byProvider, total }
}

/** Logs recentes com filtros opcionais */
export async function getAiRecentLogs(opts: {
    limit:     number
    page?:     number
    provider?: string
    feature?:  string
    status?:   string
}) {
    const where: Record<string, unknown> = {}
    if (opts.provider) where.provider = opts.provider
    if (opts.feature)  where.feature  = opts.feature
    if (opts.status)   where.status   = opts.status

    const skip = ((opts.page ?? 1) - 1) * opts.limit
    const [logs, total] = await Promise.all([
        prisma.aiUsageLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take:    opts.limit,
            skip,
        }),
        prisma.aiUsageLog.count({ where }),
    ])

    return { logs, total, pages: Math.ceil(total / opts.limit) }
}
