import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { CRON_JOBS } from '@/app/api/admin/cron/route'
import { FEATURE_LABELS } from '@/lib/ai/ai-features'

export const dynamic = 'force-dynamic'

// Maps SystemEvent source → CRON_JOBS id
const SOURCE_TO_JOB: Record<string, string> = {
  'CRON-FETCH-NEWS':          'fetch-news',
  'CRON-TAG-NEWS':            'tag-news',
  'CRON-PUBLISH-SCHEDULED':   'publish-scheduled',
  'CRON-UPDATE-TRENDING':     'update-trending',
  'CRON-STREAMING-SIGNALS':   'fetch-streaming-signals',
  'CRON-STREAMING-SHOWS':     'fetch-streaming-shows',
  'CRON-SYNC-FILMOGRAPHY':    'sync-filmography',
  'CRON_ARTIST_VISIBILITY':   'artist-visibility',
  'DIGEST':                   'digest',
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
}

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const since = new Date(Date.now() - 48 * 3600_000)

  const [systemErrors, aiErrors] = await Promise.all([
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
  ])

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
    failures.push({
      type: 'system',
      jobId: jobId ?? null,
      jobName: job?.name ?? null,
      jobEndpoint: job?.endpoint ?? null,
      label: row.source,
      count: row._count.id,
      lastAt: (row._max.createdAt ?? since).toISOString(),
      lastMessage: lastSystemMsg.get(row.source) ?? null,
      canRetrigger: !!job && !['tag-news', 'artist-visibility', 'digest', 'sync-groups-discography'].includes(jobId ?? ''),
    })
  }

  for (const row of aiErrors) {
    const jobId = FEATURE_TO_JOB[row.feature] ?? null
    const job = jobId ? CRON_JOBS.find(j => j.id === jobId) : null
    const featureLabel = FEATURE_LABELS[row.feature as keyof typeof FEATURE_LABELS] ?? row.feature
    failures.push({
      type: 'ai',
      jobId: jobId ?? null,
      jobName: job?.name ?? null,
      jobEndpoint: job?.endpoint ?? null,
      label: `IA · ${featureLabel}`,
      count: row._count.id,
      lastAt: (row._max.createdAt ?? since).toISOString(),
      lastMessage: lastAiMsg.get(row.feature) ?? null,
      canRetrigger: !!job,
    })
  }

  failures.sort((a, b) => b.count - a.count)

  return NextResponse.json({
    failures,
    total: failures.reduce((s, f) => s + f.count, 0),
    since: since.toISOString(),
  })
}
