/**
 * POST /api/internal/bot-log
 *
 * Endpoint interno chamado pelo middleware (Edge) para persistir crawls de bots.
 * Autenticado com NEXTAUTH_SECRET via header x-internal-secret.
 * Roda em Node.js runtime (não Edge) para ter acesso ao Prisma.
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // Verificar secret interno
    const secret = request.headers.get('x-internal-secret')
    const expected = process.env.NEXTAUTH_SECRET

    if (!expected || secret !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json() as {
            bot: string
            path: string
            ip?: string
            userAgent: string
            referer?: string
        }

        if (!body.bot || !body.path || !body.userAgent) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        await prisma.botCrawlLog.create({
            data: {
                bot: body.bot,
                path: body.path.slice(0, 1000),
                ip: body.ip?.slice(0, 45) ?? null,
                userAgent: body.userAgent.slice(0, 2000),
                referer: body.referer?.slice(0, 500) ?? null,
            },
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
