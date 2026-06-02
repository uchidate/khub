import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import type { CronRunStatus } from '@/lib/services/cron-execution-service'

export const dynamic = 'force-dynamic'

// Espelha os jobs atualmente agendados em .github/workflows/cron-jobs.yml.
export const CRON_JOBS = [
  {
    id: 'publish-scheduled',
    name: 'Publicar posts agendados',
    emoji: '📅',
    schedule: '*/5 * * * *',
    frequencyLabel: 'A cada 5 minutos',
    description: 'Publica artigos e conteúdos editoriais com horário programado',
    endpoint: '/api/cron/publish-scheduled',
    defaultLimit: null,
    color: 'green',
  },
  {
    id: 'fetch-news',
    name: 'Buscar notícias',
    emoji: '📰',
    schedule: '*/5 * * * *',
    frequencyLabel: 'A cada 5 minutos',
    description: 'Importa novas notícias das fontes configuradas',
    endpoint: '/api/cron/fetch-news',
    defaultLimit: null,
    color: 'blue',
  },
  {
    id: 'tag-news',
    name: 'Taguear notícias',
    emoji: '🏷️',
    schedule: '*/5 * * * *',
    frequencyLabel: 'Após busca de notícias',
    description: 'Completa tags das notícias novas por regras locais, sem IA generativa',
    endpoint: '/api/cron/tag-news',
    defaultLimit: null,
    color: 'purple',
  },
  {
    id: 'fetch-streaming-signals',
    name: 'Sinais de streaming',
    emoji: '📡',
    schedule: '*/15 * * * *',
    frequencyLabel: 'A cada 15 minutos',
    description: 'Atualiza sinais usados para tendências de streaming',
    endpoint: '/api/cron/fetch-streaming-signals',
    defaultLimit: null,
    color: 'amber',
  },
  {
    id: 'update-trending',
    name: 'Atualizar rankings',
    emoji: '📈',
    schedule: '0 */6 * * *',
    frequencyLabel: 'A cada 6 horas',
    description: 'Recalcula relevância de artistas, grupos e notícias usados na home, busca e listas',
    endpoint: '/api/cron/update-trending',
    defaultLimit: null,
    color: 'pink',
  },
  {
    id: 'discography',
    name: 'Discografia de artistas',
    emoji: '💿',
    schedule: '0 * * * *',
    frequencyLabel: 'A cada hora',
    description: 'Sincroniza discografias pendentes de artistas',
    endpoint: '/api/cron/sync-discography',
    defaultLimit: 5,
    color: 'pink',
  },
  {
    id: 'cast-sync',
    name: 'Elenco de produções',
    emoji: '🎭',
    schedule: '0 * * * *',
    frequencyLabel: 'A cada hora',
    description: 'Sincroniza elencos pendentes, priorizando produções recentes e recém-importadas',
    endpoint: '/api/cron/sync-cast',
    defaultLimit: 15,
    color: 'purple',
  },
  {
    id: 'social-links',
    name: 'Redes sociais de artistas',
    emoji: '🔗',
    schedule: '0 2 * * *',
    frequencyLabel: 'Diário 23:00 BRT',
    description: 'Busca links sociais de artistas no Wikidata',
    endpoint: '/api/cron/sync-social-links-wikidata',
    defaultLimit: null,
    color: 'green',
  },
  {
    id: 'artist-visibility',
    name: 'Visibilidade de artistas',
    emoji: '👁️',
    schedule: '0 2 * * *',
    frequencyLabel: 'Diário 23:00 BRT',
    description: 'Reavalia auto-ocultação e liberação de artistas',
    endpoint: '/api/cron/artist-visibility',
    defaultLimit: null,
    color: 'amber',
  },
  {
    id: 'digest',
    name: 'Email digest do blog',
    emoji: '📬',
    schedule: '0 2 * * *',
    frequencyLabel: 'Diário 23:00 BRT',
    description: 'Envia o resumo editorial para assinantes',
    endpoint: '/api/cron/digest',
    defaultLimit: null,
    color: 'blue',
  },
  {
    id: 'fetch-streaming-shows',
    name: 'Top shows de streaming',
    emoji: '🎬',
    schedule: '0 3 * * *',
    frequencyLabel: 'Diário 00:00 BRT',
    description: 'Atualiza títulos em destaque nas plataformas',
    endpoint: '/api/cron/fetch-streaming-shows',
    defaultLimit: null,
    color: 'orange',
  },
  {
    id: 'import-streaming-unmatched',
    name: 'Importar tops sem match',
    emoji: '🎬',
    schedule: '0 3 * * *',
    frequencyLabel: 'Após top streaming',
    description: 'Importa produções em alta nos streamings que ainda não existem no banco',
    endpoint: '/api/cron/import-streaming-unmatched',
    defaultLimit: null,
    color: 'orange',
  },
  {
    id: 'refresh-productions',
    name: 'Radar de produções',
    emoji: '🎞️',
    schedule: '0 11 * * *',
    frequencyLabel: 'Diário 08:00 BRT',
    description: 'Busca lançamentos recentes e futuros no TMDB, importa novidades e atualiza metadados',
    endpoint: '/api/cron/refresh-productions',
    defaultLimit: null,
    color: 'blue',
  },
  {
    id: 'sync-groups-discography',
    name: 'Discografia de grupos',
    emoji: '🎵',
    schedule: '0 10 * * *',
    frequencyLabel: 'Diário 07:00 BRT',
    description: 'Atualiza diariamente os catálogos Spotify dos grupos vinculados',
    endpoint: '/api/cron/sync-groups-discography',
    defaultLimit: null,
    color: 'pink',
  },
  {
    id: 'sync-filmography',
    name: 'Filmografias desatualizadas',
    emoji: '🎬',
    schedule: '0 7 * * 0',
    frequencyLabel: 'Domingo 04:00 BRT',
    description: 'Sincroniza vínculos de produções e artistas via TMDB',
    endpoint: '/api/cron/sync-filmography',
    defaultLimit: null,
    color: 'purple',
  },
  {
    id: 'sync-ml',
    name: 'Sincronizar loja ML',
    emoji: '🛒',
    schedule: '0 */2 * * *',
    frequencyLabel: 'A cada 2 horas',
    description: 'Busca novos produtos K-Pop no Mercado Livre, atualiza preços, desativa esgotados e vincula a artistas/grupos automaticamente',
    endpoint: '/api/cron/sync-ml',
    defaultLimit: null,
    color: 'amber',
  },
] as const

export type CronJobId = typeof CRON_JOBS[number]['id']

const MANUAL_TRIGGER_REVIEW: Partial<Record<CronJobId, string>> = {
  'tag-news': 'Altera tags editoriais; revisar antes de executar manualmente.',
  discography: 'Atualiza catálogo musical via fonte externa; revisar antes de disparar manualmente.',
  'cast-sync': 'Pode criar novos artistas e preencher biografia a partir do TMDB.',
  'import-streaming-unmatched': 'Pode criar produções e artistas a partir dos tops de streaming; use o workflow quando precisar forçar.',
  'refresh-productions': 'Pode criar produções e artistas em lote; o radar diário automático é o caminho preferencial.',
  'artist-visibility': 'Altera visibilidade; trate exceções na Central de Visibilidade.',
  digest: 'Configurado no workflow, mas a rota ainda requer revisão de método antes de ativar.',
  'sync-groups-discography': 'Atualiza catálogo musical; executar após revisão da estratégia de catálogo.',
  'sync-filmography': 'Pode criar ou associar produções via TMDB; executar a partir da revisão de filmografias.',
}

export function canManuallyTriggerJob(jobId: string | null): jobId is CronJobId {
  const job = CRON_JOBS.find(candidate => candidate.id === jobId)
  return !!job && !MANUAL_TRIGGER_REVIEW[job.id]
}

const LOCK_JOB_IDS: Record<string, CronJobId> = {
  'cron-sync-cast': 'cast-sync',
  'cron-import-streaming-unmatched': 'import-streaming-unmatched',
  'cron-refresh-productions': 'refresh-productions',
  'cron-sync-social-links': 'social-links',
  'cron-sync-discography': 'discography',
  'cron-sync-groups-discography': 'sync-groups-discography',
  'cron:artist-visibility': 'artist-visibility',
}

function getNextRuns(schedule: string, count = 3): string[] {
  if (schedule === 'manual') return []

  const now = new Date()
  const results: string[] = []
  const parts = schedule.split(' ')
  const [minPart, hourPart, , , weekdayPart] = parts

  // Handle */N patterns
  const isMinInterval = minPart.startsWith('*/')
  const isHourInterval = hourPart.startsWith('*/')
  const isDailyFixed = !isMinInterval && !isHourInterval && hourPart !== '*'

  if (isMinInterval && hourPart === '*') {
    const intervalM = parseInt(minPart.slice(2))
    const next = new Date(now)
    next.setUTCSeconds(0, 0)
    next.setUTCMinutes(next.getUTCMinutes() + (intervalM - (next.getUTCMinutes() % intervalM)))
    if (next <= now) next.setUTCMinutes(next.getUTCMinutes() + intervalM)
    for (let i = 0; i < count; i++) {
      results.push(next.toISOString())
      next.setUTCMinutes(next.getUTCMinutes() + intervalM)
    }
    return results
  }

  if (isHourInterval) {
    const intervalH = parseInt(hourPart.slice(2))
    const offsetMin = parseInt(minPart) || 0
    const next = new Date(now)
    // find next slot
    next.setUTCMinutes(offsetMin, 0, 0)
    if (next <= now) next.setUTCHours(next.getUTCHours() + intervalH)
    // align to interval
    while (next.getUTCHours() % intervalH !== 0) next.setUTCHours(next.getUTCHours() + 1)
    for (let i = 0; i < count; i++) {
      results.push(next.toISOString())
      next.setUTCHours(next.getUTCHours() + intervalH)
    }
  } else if (isDailyFixed) {
    const hour = parseInt(hourPart)
    const min = parseInt(minPart) || 0
    const next = new Date(now)
    next.setUTCHours(hour, min, 0, 0)
    if (weekdayPart && weekdayPart !== '*') {
      const targetDay = parseInt(weekdayPart)
      const daysUntilRun = (targetDay - next.getUTCDay() + 7) % 7
      next.setUTCDate(next.getUTCDate() + daysUntilRun)
      if (next <= now) next.setUTCDate(next.getUTCDate() + 7)
    } else if (next <= now) {
      next.setUTCDate(next.getUTCDate() + 1)
    }
    for (let i = 0; i < count; i++) {
      results.push(next.toISOString())
      next.setUTCDate(next.getUTCDate() + (weekdayPart && weekdayPart !== '*' ? 7 : 1))
    }
  } else {
    results.push(new Date(now.getTime() + 3600000).toISOString())
  }
  return results
}

export async function GET(_req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 86400000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000)

    const [totalNews, newsLast24h, newsLast7days, totalArtists, artistsLast24h, totalProductions, productionsLast24h, recentNews, locks, systemErrors, aiFailures, runEvents] = await Promise.all([
      prisma.news.count(),
      prisma.news.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.news.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.artist.count({ where: { isHidden: false } }),
      prisma.artist.count({ where: { isHidden: false, createdAt: { gte: oneDayAgo } } }),
      prisma.production.count({ where: { isHidden: false } }),
      prisma.production.count({ where: { isHidden: false, createdAt: { gte: oneDayAgo } } }),
      prisma.news.findMany({ take: 8, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true, source: true } }),
      prisma.cronLock.findMany({
        where: { expiresAt: { gt: now } },
        select: { id: true, lockedAt: true, expiresAt: true },
      }),
      prisma.systemEvent.count({ where: { level: 'ERROR', createdAt: { gte: oneDayAgo } } }),
      prisma.aiUsageLog.count({
        where: { status: { in: ['error', 'circuit_open'] }, createdAt: { gte: oneDayAgo } },
      }),
      prisma.systemEvent.findMany({
        where: { source: 'CRON_RUN', level: 'INFO' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { createdAt: true, message: true, metadata: true },
      }),
    ])

    const latestRunByJob = new Map<string, { at: Date; message: string; status: CronRunStatus }>()
    for (const event of runEvents) {
      const metadata = event.metadata as { jobId?: unknown; status?: unknown } | null
      if (
        metadata
        && typeof metadata.jobId === 'string'
        && ['success', 'partial', 'failed', 'skipped'].includes(String(metadata.status))
        && !latestRunByJob.has(metadata.jobId)
      ) {
        latestRunByJob.set(metadata.jobId, {
          at: event.createdAt,
          message: event.message,
          status: metadata.status as CronRunStatus,
        })
      }
    }

    const jobs = CRON_JOBS.map(job => ({
      ...job,
      nextRuns: getNextRuns(job.schedule),
      manualTriggerEnabled: !MANUAL_TRIGGER_REVIEW[job.id],
      manualReviewReason: MANUAL_TRIGGER_REVIEW[job.id] ?? null,
      lastExecution: latestRunByJob.get(job.id) ?? null,
    }))

    return NextResponse.json({
      jobs,
      stats: {
        totalNews, newsLast24h, newsLast7days,
        totalArtists, artistsLast24h,
        totalProductions, productionsLast24h,
        averageNewsPerDay: newsLast7days > 0 ? (newsLast7days / 7).toFixed(1) : '0',
      },
      recentNews,
      activeLocks: locks
        .filter(lock => LOCK_JOB_IDS[lock.id])
        .map(lock => ({
          jobId: LOCK_JOB_IDS[lock.id],
          startedAt: lock.lockedAt,
          expiresAt: lock.expiresAt,
        })),
      incidents: {
        systemErrors,
        aiFailures,
        total: systemErrors + aiFailures,
        since: oneDayAgo.toISOString(),
      },
      timestamp: now.toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

// POST /api/admin/cron — trigger a job manually
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const { jobId, limit } = await req.json() as { jobId: CronJobId; limit?: number }
    const job = CRON_JOBS.find(j => j.id === jobId)
    if (!job) return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
    if (MANUAL_TRIGGER_REVIEW[job.id]) {
      return NextResponse.json({ error: MANUAL_TRIGGER_REVIEW[job.id] }, { status: 409 })
    }

    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })

    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin || 'https://www.hallyuhub.com.br'
    const params = limit != null ? `?limit=${limit}` : job.defaultLimit != null ? `?limit=${job.defaultLimit}` : ''
    const url = `${baseUrl}${job.endpoint}${params}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        requestId: data.requestId ?? null,
        message: res.ok ? 'Job disparado com sucesso' : (data.error ?? data.message ?? 'Falha ao disparar job'),
      },
      { status: res.ok ? 200 : res.status },
    )
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
