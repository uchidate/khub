import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const TRANSLATION_FEATURES = [
    'artist_translation',
    'group_translation',
    'production_translation',
    'news_translation',
] as const

// GET /api/admin/translations/cost
// Retorna custo histórico de tradução por feature e totais.
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        const [allTimeLogs, last30dLogs] = await Promise.all([
            prisma.aiUsageLog.findMany({
                where: {
                    feature: { in: TRANSLATION_FEATURES as unknown as string[] },
                    status: 'success',
                },
                select: { feature: true, cost: true, tokensIn: true, tokensOut: true },
            }),
            prisma.aiUsageLog.findMany({
                where: {
                    feature: { in: TRANSLATION_FEATURES as unknown as string[] },
                    status: 'success',
                    createdAt: { gte: since30d },
                },
                select: { feature: true, cost: true },
            }),
        ])

        const byFeature: Record<string, { cost: number; tokensIn: number; tokensOut: number }> = {}
        let allTimeTotal = 0
        for (const log of allTimeLogs) {
            if (!byFeature[log.feature]) byFeature[log.feature] = { cost: 0, tokensIn: 0, tokensOut: 0 }
            byFeature[log.feature].cost += log.cost
            byFeature[log.feature].tokensIn += log.tokensIn
            byFeature[log.feature].tokensOut += log.tokensOut
            allTimeTotal += log.cost
        }

        const last30dTotal = last30dLogs.reduce((sum, l) => sum + l.cost, 0)

        return NextResponse.json({
            allTime: allTimeTotal,
            last30d: last30dTotal,
            byFeature,
        })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
