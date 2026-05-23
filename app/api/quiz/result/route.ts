import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const body = await request.json()

        const { sessionId, score, total, points, difficulty, category, timeHistory, categoryBreakdown } = body

        if (!sessionId || score === undefined || !total || points === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const result = await prisma.quizResult.create({
            data: {
                userId: session?.user?.id ?? null,
                sessionId,
                score: Number(score),
                total: Number(total),
                points: Number(points),
                difficulty: difficulty ?? 'medium',
                category: category ?? 'all',
                timeHistory: timeHistory ?? [],
                categoryBreakdown: categoryBreakdown ?? {},
            },
        })

        return NextResponse.json({ id: result.id })
    } catch (err) {
        console.error('[quiz/result POST]', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
