/**
 * POST /api/cron/sync-filmography
 *
 * Sincroniza filmografias desatualizadas (>30 dias) via TMDB — estratégia INCREMENTAL.
 * Processa no máximo 20 artistas por execução, concorrência 3.
 *
 * Frequência: semanal (dom 07:00 UTC = 04:00 BRT)
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getFilmographySyncService } from '@/lib/services/filmography-sync-service'
import { createLogger } from '@/lib/utils/logger'
import { logSystemEvent } from '@/lib/services/system-event-service'
import { logCronRun } from '@/lib/services/cron-execution-service'

export const maxDuration = 300

const log = createLogger('CRON-SYNC-FILMOGRAPHY')

function verifyToken(request: NextRequest): boolean {
    const authToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!expectedToken || !authToken) return false
    if (authToken.length !== expectedToken.length) return false
    try {
        return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
    } catch {
        return false
    }
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staleDays = Number(request.nextUrl.searchParams.get('staleDays') ?? '30')
    const limit     = Math.min(Number(request.nextUrl.searchParams.get('limit')    ?? '20'), 50)
    const concurrency = 3

    log.info('Iniciando sync de filmografias', { staleDays, limit, concurrency })

    try {
        const service = getFilmographySyncService()
        const result = await service.syncOutdatedFilmographies(staleDays, limit, concurrency)

        log.info('Sync concluído', {
            total: result.total,
            success: result.successCount,
            failures: result.failureCount,
            duration: result.duration,
        })
        if (result.failureCount > 0) {
            await logSystemEvent('ERROR', 'cron-sync-filmography', `Filmografias concluídas com ${result.failureCount} falha(s)`, {
                total: result.total,
                successCount: result.successCount,
                failureCount: result.failureCount,
            })
        }
        await logCronRun(
            'sync-filmography',
            result.failureCount > 0 ? 'partial' : 'success',
            `${result.successCount}/${result.total} filmografia(s) sincronizada(s), ${result.failureCount} falha(s)`,
            { total: result.total, successCount: result.successCount, failureCount: result.failureCount, durationMs: result.duration },
        )

        return NextResponse.json({
            ok: true,
            total: result.total,
            success: result.successCount,
            failures: result.failureCount,
            durationMs: result.duration,
        })
    } catch (error: any) {
        log.error('Erro no sync de filmografias', { error: error.message })
        await logSystemEvent('ERROR', 'cron-sync-filmography', `Sync de filmografias falhou: ${error.message}`)
        await logCronRun('sync-filmography', 'failed', 'Sincronização de filmografias falhou')
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    return POST(request)
}
