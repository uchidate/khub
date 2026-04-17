/**
 * POST /api/internal/server-error-log
 *
 * Endpoint interno chamado pelo instrumentation.ts (onRequestError) para persistir
 * erros de API que não passam pelo withLogging HOF.
 * Autenticado com NEXTAUTH_SECRET via header x-internal-secret.
 */

import { NextRequest, NextResponse } from 'next/server'
import { persistServerError } from '@/lib/server/withLogging'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const secret = request.headers.get('x-internal-secret')
    const expected = process.env.NEXTAUTH_SECRET

    if (!expected || secret !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json() as {
            method: string
            path: string
            status: number
            duration: number
            error: string
            userAgent?: string
            ip?: string
        }

        await persistServerError({
            method: body.method,
            path: body.path,
            status: body.status ?? 500,
            duration: body.duration ?? 0,
            error: body.error,
            userAgent: body.userAgent,
            ip: body.ip,
        })

        return NextResponse.json({ ok: true })
    } catch {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
