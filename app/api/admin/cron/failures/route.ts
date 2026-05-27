import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { canManuallyTriggerJob, CRON_JOBS } from '@/app/api/admin/cron/route'
import { FEATURE_LABELS } from '@/lib/ai/ai-features'
import type { CronRunStatus } from '@/lib/services/cron-execution-service'

export const dynamic = 'force-dynamic'

// Maps SystemEvent source → CRON_JOBS id
const SOURCE_TO_JOB: Record<string, string> = {
  'CRON-FETCH-NEWS':          'fetch-news',
  'cron-fetch-news':          'fetch-news',
  'CRON-TAG-NEWS':            'tag-news',
  'cron-tag-news':            'tag-news',
  'CRON-PUBLISH-SCHEDULED':   'publish-scheduled',
  'cron-publish-scheduled':   'publish-scheduled',
  'CRON-UPDATE-TRENDING':     'update-trending',
  'cron-update-trending':     'update-trending',
  'CRON-STREAMING-SIGNALS':   'fetch-streaming-signals',
  'cron-fetch-streaming-signals': 'fetch-streaming-signals',
  'CRON-STREAMING-SHOWS':     'fetch-streaming-shows',
  'cron-fetch-streaming-shows': 'fetch-streaming-shows',
  'CRON-SYNC-FILMOGRAPHY':    'sync-filmography',
  'cron-sync-filmography':    'sync-filmography',
  'cron-sync-discography':    'discography',
  'cron-sync-cast':           'cast-sync',
  'cron-sync-wikidata':       'social-links',
  'cron-sync-social-links':   'social-links',
  'cron-sync-groups-discography': 'sync-groups-discography',
  'CRON_ARTIST_VISIBILITY':   'artist-visibility',
  'cron-artist-visibility':   'artist-visibility',
  'DIGEST':                   'digest',
  'cron-digest':              'digest',
  'CRON':                     '', // generic, skip
}

// Maps AiFeature → CRON_JOBS id (best guess for automated features)
const FEATURE_TO_JOB: Record<string, string> = {
  'news_translation': 'fetch-news',
  'news_generation':  'fetch-news',
  'news_tagging':     'tag-news',
}

export type FailureEntry = {
  type: 'system' | 'ai'
  jobId: string | null
  jobName: string | null
  jobEndpoint: string | null
  label: string
  count: number
  lastAt: string
  lastMessage: string | null
  canRetrigger: boolean
  recoveryStatus: CronRunStatus | null
  recoveredAt: string | null
}

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const since = new Date(Date.now() - 48 * 3600_000)

  const [systemErrors, aiErrors, runEvents] = await Promise.all([
    prisma.systemEvent.groupBy({
      by: ['source'],
      where: { level: 'ERROR', createdAt: { gte: since } },
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.aiUsageLog.groupBy({
      by: ['feature'],
      where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: since } },
      _count: { id: true },
      _max: { createdAt: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.systemEvent.findMany({
      where: { source: 'CRON_RUN', level: 'INFO', createdAt: { gte: since } },
      select: { createdAt: true, metadata: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ])

  const latestRunByJob = new Map<string, { status: CronRunStatus; at: Date }>()
  for (const event of runEvents) {
    const metadata = event.metadata as { jobId?: unknown; status?: unknown } | null
    if (
      metadata
      && typeof metadata.jobId === 'string'
      && ['success', 'partial', 'failed', 'skipped'].includes(String(metadata.status))
      && !latestRunByJob.has(metadata.jobId)
    ) {
      latestRunByJob.set(metadata.jobId, { status: metadata.status as CronRunStatus, at: event.createdAt })
    }
  }

  function recoveryAfterFailure(jobId: string | null, lastAt: Date) {
    const run = jobId ? latestRunByJob.get(jobId) : undefined
    if (!run || run.at <= lastAt) return { recoveryStatus: null, recoveredAt: null }
    return {
      recoveryStatus: run.status,
      recoveredAt: run.status === 'success' ? run.at.toISOString() : null,
    }
  }

  // Fetch last error message for each source/feature
  const [sampleSystemErrors, sampleAiErrors] = await Promise.all([
    systemErrors.length > 0
      ? prisma.systemEvent.findMany({
          where: { level: 'ERROR', source: { in: systemErrors.map(r => r.source) }, createdAt: { gte: since } },
          select: { source: true, message: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : [],
    aiErrors.length > 0
      ? prisma.aiUsageLog.findMany({
          where: { status: { in: ['error', 'circuit_open'] }, feature: { in: aiErrors.map(r => r.feature) }, createdAt: { gte: since } },
          select: { feature: true, errorMsg: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      : [],
  ])

  const lastSystemMsg = new Map<string, string>()
  for (const row of sampleSystemErrors) {
    if (!lastSystemMsg.has(row.source)) lastSystemMsg.set(row.source, row.message)
  }
  const lastAiMsg = new Map<string, string>()
  for (const row of sampleAiErrors) {
    if (!lastAiMsg.has(row.feature) && row.errorMsg) lastAiMsg.set(row.feature, row.errorMsg)
  }

  const failures: FailureEntry[] = []

  for (const row of systemErrors) {
    const jobId = SOURCE_TO_JOB[row.source] ?? null
    const job = jobId ? CRON_JOBS.find(j => j.id === jobId) : null
    const lastAt = row._max.createdAt ?? since
    const recovery = recoveryAfterFailure(jobId, lastAt)
    failures.push({
      type: 'system',
      jobId: jobId ?? null,
      jobName: job?.name ?? null,
      jobEndpoint: job?.endpoint ?? null,
      label: row.source,
      count: row._count.id,
      lastAt: lastAt.toISOString(),
      lastMessage: lastSystemMsg.get(row.source) ?? null,
      canRetrigger: canManuallyTriggerJob(jobId) && !recovery.recoveredAt,
      ...recovery,
    })
  }

  for (const row of aiErrors) {
    const jobId = FEATURE_TO_JOB[row.feature] ?? null
    const job = jobId ? CRON_JOBS.find(j => j.id === jobId) : null
    const featureLabel = FEATURE_LABELS[row.feature as keyof typeof FEATURE_LABELS] ?? row.feature
    const lastAt = row._max.createdAt ?? since
    const recovery = recoveryAfterFailure(jobId, lastAt)
    failures.push({
      type: 'ai',
      jobId: jobId ?? null,
      jobName: job?.name ?? null,
      jobEndpoint: job?.endpoint ?? null,
      label: `IA · ${featureLabel}`,
      count: row._count.id,
      lastAt: lastAt.toISOString(),
      lastMessage: lastAiMsg.get(row.feature) ?? null,
      canRetrigger: canManuallyTriggerJob(jobId) && !recovery.recoveredAt,
      ...recovery,
    })
  }

  failures.sort((a, b) => b.count - a.count)

  return NextResponse.json({
    failures,
    total: failures.reduce((s, f) => s + f.count, 0),
    since: since.toISOString(),
  })
}
