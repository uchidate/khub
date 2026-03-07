/**
 * Utilitário para logging de erros fatais em cron jobs.
 * Combina stdout (createLogger) + persistência no banco (SystemEvent).
 *
 * Uso:
 *   runSomeJob(...).catch(onCronError(log, 'cron-fetch-news', 'Job failed'))
 */
import { logSystemEvent } from '@/lib/services/system-event-service'

type SimpleLogger = { error: (msg: string, meta?: Record<string, unknown>) => void }

export function onCronError(
    log: SimpleLogger,
    source: string,
    message: string,
) {
    return (err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : String(err)
        const stack = err instanceof Error ? err.stack?.slice(0, 800) : undefined
        log.error(message, { error: errorMsg })
        logSystemEvent('ERROR', source, `${message}: ${errorMsg}`, { error: errorMsg, stack }).catch(() => {})
    }
}
