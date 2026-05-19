import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/quiz/questions?category=all&difficulty=medium&limit=15
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl
    const category = searchParams.get('category') || 'all'
    const difficulty = searchParams.get('difficulty') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 50)

    const where: Record<string, unknown> = { isActive: true }

    if (category !== 'all') {
        where.category = category
    }

    if (difficulty === 'easy') {
        where.difficulty = 'easy'
    } else if (difficulty === 'hard') {
        where.difficulty = { in: ['medium', 'hard'] }
    }
    // difficulty 'medium' or 'all' = no filter

    const questions = await prisma.quizQuestion.findMany({
        where,
        select: {
            id: true,
            question: true,
            options: true,
            correct: true,
            explanation: true,
            category: true,
            difficulty: true,
            relatedHref: true,
            relatedLabel: true,
        },
        orderBy: [
            { position: 'asc' },
            { createdAt: 'asc' },
        ],
    })

    // Shuffle and slice server-side so each request returns a different set
    const shuffled = shuffle(questions).slice(0, limit)

    return NextResponse.json(shuffled)
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}
