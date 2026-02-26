import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * POST /api/track/search
 *
 * Persiste busca no modelo Activity para usuários autenticados.
 * Usuários anônimos já são cobertos pelo GA4 via useAnalytics.trackSearch().
 *
 * Rate limit implícito: ignora queries < 3 chars (feito no cliente).
 * Deduplicação: ignora query idêntica do mesmo usuário nos últimos 30s.
 */
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)

    // Anônimos: GA4 já registrou — retornar 200 silencioso
    if (!session?.user?.email) {
        return NextResponse.json({ ok: true })
    }

    try {
        const { query, context } = await request.json()

        if (!query || typeof query !== 'string' || query.trim().length < 3) {
            return NextResponse.json({ ok: true })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        })

        if (!user) return NextResponse.json({ ok: true })

        // Deduplicação: ignorar mesma query nos últimos 30s
        const thirtySecondsAgo = new Date(Date.now() - 30_000)
        const recent = await prisma.activity.findFirst({
            where: {
                userId: user.id,
                type: 'SEARCH',
                createdAt: { gte: thirtySecondsAgo },
                metadata: { path: ['query'], equals: query.trim() },
            },
            select: { id: true },
        })

        if (recent) return NextResponse.json({ ok: true })

        await prisma.activity.create({
            data: {
                userId: user.id,
                type: 'SEARCH',
                metadata: {
                    query: query.trim(),
                    context: context ?? 'unknown',
                },
            },
        })

        return NextResponse.json({ ok: true })
    } catch {
        // Search tracking is best-effort — never fail the client
        return NextResponse.json({ ok: true })
    }
}
