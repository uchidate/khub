import { logSystemEvent } from '@/lib/services/system-event-service'

export type CronRunStatus = 'success' | 'partial' | 'failed' | 'skipped'

export async function logCronRun(
  jobId: string,
  status: CronRunStatus,
  message: string,
  metrics?: Record<string, unknown>,
): Promise<void> {
  await logSystemEvent('INFO', 'CRON_RUN', message, {
    jobId,
    status,
    ...metrics,
  })
}
