/**
 * withLogging — Higher-Order Function para logar requisições de API.
 *
 * - Loga TODAS as requisições (método, path, status, duração) no stdout.
 * - Persiste no DB apenas respostas 4xx/5xx (com body truncado para diagnóstico).
 * - Mantém apenas os últimos 500 logs no DB (cleanup automático).
 *
 * Uso:
 *   export const GET = withLogging(async (req) => { ... })
 *   export const POST = withLogging(async (req) => { ... })
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createLogger } from '@/lib/utils/logger'
import prisma from '@/lib/prisma'

const logger = createLogger('API')

// NextJS 15: second argument is always present (even for non-dynamic routes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (req: NextRequest, ctx: any) => Promise<NextResponse | Response>

const MAX_BODY_LENGTH = 500  // chars
const MAX_LOGS_IN_DB = 500

export async function persistServerError(data: {
    method: string
    path: string
    status: number
    duration: number
    error?: string
    body?: string
    userAgent?: string
    ip?: string
}) {
    try {
        await prisma.serverLog.create({ data })
        // Cleanup assíncrono — não bloqueia a resposta
        prisma.serverLog.count().then(count => {
            if (count > MAX_LOGS_IN_DB + 50) {
                prisma.serverLog.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip: MAX_LOGS_IN_DB,
                    select: { id: true },
                }).then(old => {
                    if (old.length > 0) {
                        prisma.serverLog.deleteMany({
                            where: { id: { in: old.map(r => r.id) } },
                        }).catch(() => {})
                    }
                }).catch(() => {})
            }
        }).catch(() => {})
    } catch {
        // Nunca deixar log falhar a resposta principal
    }
}

export function withLogging(handler: Handler): Handler {
    return async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
        const start = Date.now()
        const method = req.method
        const path = req.nextUrl.pathname
        const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? undefined
        const ip = (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            ?? req.headers.get('x-real-ip')
            ?? undefined)

        let response: NextResponse | Response
        let errorText: string | undefined
        let bodyText: string | undefined

        try {
            response = await handler(req, ctx)
        } catch (err) {
            const duration = Date.now() - start
            errorText = err instanceof Error ? err.message : String(err)
            logger.error('Unhandled exception', { method, path, duration, error: errorText })
            await persistServerError({ method, path, status: 500, duration, error: errorText, userAgent, ip })
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
        }

        const duration = Date.now() - start
        const status = response.status

        // Log all requests to stdout
        logger.info(`${method} ${path} → ${status} (${duration}ms)`)

        // Persist 4xx/5xx to DB for admin visibility
        if (status >= 400) {
            try {
                const cloned = response.clone()
                const text = await cloned.text()
                bodyText = text.length > MAX_BODY_LENGTH ? text.slice(0, MAX_BODY_LENGTH) + '…' : text
            } catch { /* body não legível */ }

            logger.warn(`Error response: ${method} ${path} → ${status}`, { body: bodyText, userAgent })
            await persistServerError({ method, path, status, duration, error: bodyText, body: bodyText, userAgent, ip })
        }

        return response
    }
}
