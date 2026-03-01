import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('CRON')
const CRON_LOCK_TTL_MS = 30 * 60 * 1000 // 30 minutos TTL para auto-recuperação

/**
 * Adquire lock via banco de dados para um cron específico.
 * Usa upsert atômico com TTL para auto-recuperação se processo morrer.
 *
 * @param cronName  Identificador único do cron (ex: 'cron-update', 'cron-sync-cast')
 * @returns         requestId único se lock adquirido, null se já em execução
 */
export async function acquireCronLock(cronName: string): Promise<string | null> {
    const requestId = `${cronName}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + CRON_LOCK_TTL_MS)

    try {
        const existing = await prisma.cronLock.findUnique({
            where: { id: cronName }
        })

        if (existing && existing.expiresAt > now) {
            const elapsedSec = Math.floor((now.getTime() - existing.lockedAt.getTime()) / 1000)
            log.warn(`[${cronName}] Já existe uma execução ativa (${elapsedSec}s atrás). Pulando.`, { requestId: existing.lockedBy, elapsedSec })
            return null
        }

        if (existing && existing.expiresAt <= now) {
            log.warn(`[${cronName}] Lock expirado (processo anterior travou?). Liberando e continuando.`, { requestId: existing.lockedBy })
        }

        await prisma.cronLock.upsert({
            where: { id: cronName },
            update: { lockedBy: requestId, lockedAt: now, expiresAt },
            create: { id: cronName, lockedBy: requestId, lockedAt: now, expiresAt },
        })

        log.info(`[${cronName}] Lock adquirido`, { requestId })
        return requestId
    } catch (error: any) {
        log.error(`[${cronName}] Failed to acquire lock: ${error.message}`)
        return null
    }
}

/**
 * Libera o lock de um cron específico.
 * Só deleta se o requestId bater (evita liberar lock de outra execução).
 */
export async function releaseCronLock(cronName: string, requestId: string): Promise<void> {
    try {
        const lock = await prisma.cronLock.findUnique({
            where: { id: cronName }
        })
        if (lock?.lockedBy === requestId) {
            await prisma.cronLock.delete({ where: { id: cronName } })
            log.info(`[${cronName}] Lock liberado`, { requestId })
        }
    } catch (error: any) {
        log.error(`[${cronName}] Failed to release lock: ${error.message}`, { requestId })
    }
}
