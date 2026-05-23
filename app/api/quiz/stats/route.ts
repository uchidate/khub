import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const [totalGames, topScores, diffBreakdown, categoryBreakdown, recentAvg] = await Promise.all([
            prisma.quizResult.count(),

            prisma.quizResult.findMany({
                orderBy: { points: 'desc' },
                take: 10,
                select: { points: true, score: true, total: true, difficulty: true, createdAt: true, userId: true,
                    user: { select: { name: true } } },
            }),

            prisma.quizResult.groupBy({
                by: ['difficulty'],
                _avg: { score: true, total: true, points: true },
                _count: { id: true },
            }),

            // acerto médio por categoria (via categoryBreakdown JSON)
            prisma.$queryRaw<{ category: string; avg_pct: number; total_games: number }[]>`
                SELECT
                    key as category,
                    AVG((value->>'correct')::float / NULLIF((value->>'total')::float, 0)) as avg_pct,
                    COUNT(*) as total_games
                FROM "QuizResult",
                     jsonb_each("categoryBreakdown") AS kv(key, value)
                GROUP BY key
                ORDER BY avg_pct DESC
            `,

            prisma.quizResult.aggregate({
                _avg: { score: true, total: true },
                where: { createdAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
            }),
        ])

        const totalCorrect = topScores.reduce((s, r) => s + r.score, 0)
        const globalAvgPct = totalGames > 0
            ? await prisma.quizResult.aggregate({ _avg: { score: true, total: true } }).then(r =>
                r._avg.total ? Math.round(((r._avg.score ?? 0) / r._avg.total) * 100) : null)
            : null

        return NextResponse.json({
            totalGames,
            globalAvgPct,
            topScores: topScores.map(r => ({
                points: r.points,
                score: r.score,
                total: r.total,
                difficulty: r.difficulty,
                date: r.createdAt,
                name: r.user?.name ?? null,
            })),
            diffBreakdown: diffBreakdown.map(d => ({
                difficulty: d.difficulty,
                games: d._count.id,
                avgScore: d._avg.score ? Math.round((d._avg.score / (d._avg.total ?? 1)) * 100) : null,
                avgPoints: d._avg.points ? Math.round(d._avg.points) : null,
            })),
            categoryBreakdown: categoryBreakdown.map(c => ({
                category: c.category,
                avgPct: Math.round(Number(c.avg_pct) * 100),
                totalGames: Number(c.total_games),
            })),
            recentAvgPct: recentAvg._avg.total
                ? Math.round(((recentAvg._avg.score ?? 0) / recentAvg._avg.total) * 100)
                : null,
        })
    } catch (err) {
        console.error('[quiz/stats GET]', err)
        return NextResponse.json({ totalGames: 0 }, { status: 200 })
    }
}
