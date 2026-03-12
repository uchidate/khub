import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAiSummary, getAiCostByDay, getAiRecentLogs, getMonthlySpend } from '@/lib/services/ai-stats-service'
import { getAllAiConfigs } from '@/lib/services/ai-config-service'

export const dynamic = 'force-dynamic'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const [summary30d, costByDay, monthlySpend, configs, recentLogs] = await Promise.all([
        getAiSummary(30),
        getAiCostByDay(14),
        getMonthlySpend(),
        getAllAiConfigs(),
        getAiRecentLogs({ limit: 20 }),
    ])

    return NextResponse.json({
        summary30d,
        costByDay,
        monthlySpend,
        configs,
        recentLogs: recentLogs.logs,
    })
}
