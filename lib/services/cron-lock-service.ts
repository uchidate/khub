import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('CRON')
const CRON_LOCK_TTL_MS = 30 * 60 * 1000 // 30 minutos TTL para auto-recuperação

/**
 * Adquire lock via banco de dados (sobrevive a reinícios do processo).
 * Usa upsert atômico com TTL para auto-recuperação se processo morrer.
 */
export async function acquireCronLock(): Promise<string | null> {
    const requestId = `cron-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CRON_LOCK_TTL_MS)

    try {
        const existing = await prisma.cronLock.findUnique({
            where: { id: 'cron-update' }
        })

        if (existing && existing.expiresAt > now) {
            const elapsedSec = Math.floor((now.getTime() - existing.lockedAt.getTime()) / 1000)
            log.warn(`Já existe uma execução ativa (${elapsedSec}s atrás). Pulando.`, { requestId: existing.lockedBy, elapsedSec })
            return null
        }

        if (existing && existing.expiresAt <= now) {
            log.warn('Lock expirado (processo anterior travou?). Liberando e continuando.', { requestId: existing.lockedBy })
        }

        await prisma.cronLock.upsert({
            where: { id: 'cron-update' },
            update: { lockedBy: requestId, lockedAt: now, expiresAt },
            create: { id: 'cron-update', lockedBy: requestId, lockedAt: now, expiresAt },
        })

        log.info('Lock adquirido', { requestId })
        return requestId
    } catch (error: any) {
        log.error(`Failed to acquire lock: ${error.message}`)
        return null
    }
}

export async function releaseCronLock(requestId: string): Promise<void> {
    try {
        const lock = await prisma.cronLock.findUnique({
            where: { id: 'cron-update' }
        })
        if (lock?.lockedBy === requestId) {
            await prisma.cronLock.delete({ where: { id: 'cron-update' } })
            log.info('Lock liberado', { requestId })
        }
    } catch (error: any) {
        log.error(`Failed to release lock: ${error.message}`, { requestId })
    }
}
