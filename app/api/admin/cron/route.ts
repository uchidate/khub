import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

// Definição canônica de todos os cron jobs do GitHub Actions
export const CRON_JOBS = [
  {
    id: 'update',
    name: 'Auto Update Content',
    emoji: '🔄',
    schedule: '0 */2 * * *',
    frequencyLabel: 'A cada 2 horas',
    description: 'Busca notícias RSS, extrai artistas, sincroniza catálogos, atualiza trending',
    endpoint: '/api/cron/update',
    defaultLimit: null,
    color: 'blue',
  },
  {
    id: 'cast-sync',
    name: 'Sync Production Cast',
    emoji: '🎬',
    schedule: '50 */2 * * *',
    frequencyLabel: 'A cada 2 horas (:50)',
    description: 'Sincroniza elenco de produções via TMDB',
    endpoint: '/api/cron/sync-cast',
    defaultLimit: 10,
    color: 'purple',
  },
  {
    id: 'match-productions',
    name: 'Match Productions TMDB',
    emoji: '🔍',
    schedule: '20 */6 * * *',
    frequencyLabel: 'A cada 6 horas (:20)',
    description: 'Associa produções sem tmdbId usando busca no TMDB',
    endpoint: '/api/cron/match-productions',
    defaultLimit: 10,
    color: 'amber',
  },
  {
    id: 'social-links',
    name: 'Sync Social Links',
    emoji: '🔗',
    schedule: '30 0 * * *',
    frequencyLabel: 'Diário 00:30 UTC',
    description: 'Atualiza Instagram, Twitter, YouTube etc. dos artistas via TMDB',
    endpoint: '/api/cron/sync-social-links',
    defaultLimit: 10,
    color: 'green',
  },
  {
    id: 'discography',
    name: 'Sync Artist Discography',
    emoji: '🎵',
    schedule: '0 1 * * *',
    frequencyLabel: 'Diário 01:00 UTC',
    description: 'Sincroniza discografia via MusicBrainz + IA como fallback',
    endpoint: '/api/cron/sync-discography',
    defaultLimit: 5,
    color: 'pink',
  },
  {
    id: 'backfill-images',
    name: 'Backfill News Images',
    emoji: '🖼️',
    schedule: '0 3 * * *',
    frequencyLabel: 'Diário 03:00 UTC',
    description: 'Extrai og:image de páginas de notícias sem imagem',
    endpoint: '/api/cron/backfill-images',
    defaultLimit: 20,
    color: 'orange',
  },
] as const

type CronJobId = typeof CRON_JOBS[number]['id']

function getNextRuns(schedule: string, count = 3): string[] {
  const now = new Date()
  const results: string[] = []
  const parts = schedule.split(' ')
  const [minPart, hourPart] = parts

  // Handle */N patterns
  const isMinInterval = minPart.startsWith('*/')
  const isHourInterval = hourPart.startsWith('*/')
  const isDailyFixed = !isMinInterval && !isHourInterval && hourPart !== '*'

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
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1)
    for (let i = 0; i < count; i++) {
      results.push(next.toISOString())
      next.setUTCDate(next.getUTCDate() + 1)
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

    const [totalNews, newsLast24h, newsLast7days, totalArtists, artistsLast24h, totalProductions, productionsLast24h, recentNews] = await Promise.all([
      prisma.news.count(),
      prisma.news.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.news.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.artist.count({ where: { isHidden: false } }),
      prisma.artist.count({ where: { isHidden: false, createdAt: { gte: oneDayAgo } } }),
      prisma.production.count({ where: { isHidden: false } }),
      prisma.production.count({ where: { isHidden: false, createdAt: { gte: oneDayAgo } } }),
      prisma.news.findMany({ take: 8, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true, source: true } }),
    ])

    const jobs = CRON_JOBS.map(job => ({
      ...job,
      nextRuns: getNextRuns(job.schedule),
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

    const secret = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.hallyuhub.com.br'
    const params = limit != null ? `?limit=${limit}` : job.defaultLimit != null ? `?limit=${job.defaultLimit}` : ''
    const url = `${baseUrl}${job.endpoint}${params}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${secret}`, 'Content-Type': 'application/json' },
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: res.ok, status: res.status, requestId: data.requestId ?? null, message: res.ok ? 'Job disparado com sucesso' : 'Falha ao disparar job' })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
