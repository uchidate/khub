'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw, CheckCircle2, Activity,
  Clock, Newspaper, Users, Film, Loader2, ChevronRight,
  Zap,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

interface CronJob {
  id: string
  name: string
  emoji: string
  schedule: string
  frequencyLabel: string
  description: string
  endpoint: string
  defaultLimit: number | null
  color: string
  nextRuns: string[]
}

interface Stats {
  totalNews: number
  newsLast24h: number
  newsLast7days: number
  totalArtists: number
  artistsLast24h: number
  totalProductions: number
  productionsLast24h: number
  averageNewsPerDay: string
}

interface RecentNews {
  id: string
  title: string
  createdAt: string
  source?: string | null
}

interface CronData {
  jobs: CronJob[]
  stats: Stats
  recentNews: RecentNews[]
  timestamp: string
}

type TriggerState = Record<string, 'idle' | 'running' | 'ok' | 'error'>

const COLOR_MAP: Record<string, { badge: string; dot: string; ring: string }> = {
  blue:   { badge: 'bg-blue-500/15 text-blue-300 border-blue-500/20',   dot: 'bg-blue-400',   ring: 'ring-blue-500/30' },
  purple: { badge: 'bg-purple-500/15 text-purple-300 border-purple-500/20', dot: 'bg-purple-400', ring: 'ring-purple-500/30' },
  amber:  { badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20',  dot: 'bg-amber-400',  ring: 'ring-amber-500/30' },
  green:  { badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
  pink:   { badge: 'bg-pink-500/15 text-pink-300 border-pink-500/20',    dot: 'bg-pink-400',   ring: 'ring-pink-500/30' },
  orange: { badge: 'bg-orange-500/15 text-orange-300 border-orange-500/20', dot: 'bg-orange-400', ring: 'ring-orange-500/30' },
}

function TimelineBar({ jobs }: { jobs: CronJob[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Map job to UTC hours it runs
  function getRunHours(schedule: string): number[] {
    const [_minPart, hourPart] = schedule.split(' ')
    if (!hourPart) return []
    if (hourPart.startsWith('*/')) {
      const interval = parseInt(hourPart.slice(2))
      return hours.filter(h => h % interval === 0)
    }
    if (!isNaN(parseInt(hourPart))) return [parseInt(hourPart)]
    return []
  }

  return (
    <div className="space-y-2">
      {/* Hour labels */}
      <div className="flex text-[9px] text-muted font-mono select-none">
        {hours.map(h => (
          <div key={h} className="flex-1 text-center">{h.toString().padStart(2,'0')}</div>
        ))}
      </div>
      {/* One row per job */}
      {jobs.map(job => {
        const runHours = getRunHours(job.schedule)
        const colors = COLOR_MAP[job.color] ?? COLOR_MAP.blue
        return (
          <div key={job.id} className="flex items-center gap-2">
            <span className="w-28 text-[10px] text-muted truncate shrink-0 text-right">{job.emoji} {job.name.split(' ').slice(-1)[0]}</span>
            <div className="flex flex-1">
              {hours.map(h => {
                const active = runHours.includes(h)
                return (
                  <div
                    key={h}
                    className={`flex-1 h-4 mx-px rounded-sm ${active ? `${colors.dot} opacity-80` : 'bg-surface'}`}
                    title={active ? `${job.name} às ${h.toString().padStart(2,'0')}:00 UTC` : undefined}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminCronPage() {
  const [data, setData] = useState<CronData | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggerState, setTriggerState] = useState<TriggerState>({})

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cron')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function trigger(jobId: string) {
    setTriggerState(s => ({ ...s, [jobId]: 'running' }))
    try {
      const res = await fetch('/api/admin/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      setTriggerState(s => ({ ...s, [jobId]: res.ok ? 'ok' : 'error' }))
      setTimeout(() => setTriggerState(s => ({ ...s, [jobId]: 'idle' })), 3000)
    } catch {
      setTriggerState(s => ({ ...s, [jobId]: 'error' }))
      setTimeout(() => setTriggerState(s => ({ ...s, [jobId]: 'idle' })), 3000)
    }
  }

  const jobs = data?.jobs ?? []
  const stats = data?.stats

  return (
    <AdminLayout title="Cron Jobs">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Agendamentos</h1>
            {data && (
              <p className="text-xs text-muted mt-0.5">
                Atualizado {new Date(data.timestamp).toLocaleString('pt-BR')} · {jobs.length} jobs via GitHub Actions
              </p>
            )}
          </div>
          <button
            onClick={fetch_}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Notícias', icon: Newspaper, total: stats?.totalNews, delta: stats?.newsLast24h, sub: `~${stats?.averageNewsPerDay}/dia`, color: 'text-purple-400' },
            { label: 'Artistas', icon: Users,     total: stats?.totalArtists,     delta: stats?.artistsLast24h,     sub: 'visíveis',    color: 'text-emerald-400' },
            { label: 'Produções', icon: Film,     total: stats?.totalProductions,  delta: stats?.productionsLast24h, sub: 'visíveis',    color: 'text-blue-400' },
            { label: 'Notícias 7d', icon: Activity, total: stats?.newsLast7days,  delta: stats?.newsLast24h,        sub: 'últimos 7 dias', color: 'text-amber-400' },
          ].map(({ label, icon: Icon, total, delta, sub, color }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted uppercase tracking-widest font-black">{label}</span>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <p className="text-2xl font-black text-foreground tabular-nums">{total ?? '—'}</p>
              <p className="text-[10px] text-muted mt-0.5">
                {delta != null && delta > 0 && <span className="text-emerald-400">+{delta} hoje · </span>}
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {jobs.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted" />
              <h2 className="text-sm font-bold text-foreground">Timeline 24h (UTC)</h2>
            </div>
            <TimelineBar jobs={jobs} />
            <p className="text-[10px] text-muted mt-3">Cada bloco colorido = execução agendada naquela hora UTC</p>
          </div>
        )}

        {/* Jobs grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.map(job => {
            const colors = COLOR_MAP[job.color] ?? COLOR_MAP.blue
            const state = triggerState[job.id] ?? 'idle'
            const nextRun = job.nextRuns?.[0]
            const nextRunDelta = nextRun
              ? Math.round((new Date(nextRun).getTime() - Date.now()) / 60000)
              : null

            return (
              <div key={job.id} className={`bg-surface border border-border rounded-xl p-4 transition-all hover:border-border ring-0 ${state === 'ok' ? `ring-1 ${colors.ring}` : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg">{job.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground leading-tight">{job.name}</h3>
                      <p className="text-[10px] text-muted mt-0.5 leading-tight">{job.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => trigger(job.id)}
                    disabled={state === 'running'}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      state === 'running' ? 'bg-surface text-muted cursor-wait' :
                      state === 'ok'      ? `${colors.badge} border` :
                      state === 'error'   ? 'bg-red-500/15 text-red-300 border border-red-500/20' :
                      'bg-surface text-muted hover:bg-surface hover:text-foreground border border-transparent'
                    }`}
                    title="Disparar agora"
                  >
                    {state === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                     state === 'ok'      ? <CheckCircle2 className="w-3 h-3" /> :
                     state === 'error'   ? '✗' :
                     <><Zap className="w-3 h-3" />Disparar</>}
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border ${colors.badge}`}>
                    {job.schedule}
                  </span>
                  <span className="text-[10px] text-muted">{job.frequencyLabel}</span>
                </div>

                {nextRunDelta != null && (
                  <div className="flex items-center gap-1 mt-2.5 text-[10px] text-muted">
                    <ChevronRight className="w-3 h-3" />
                    Próxima em{' '}
                    <span className="text-muted font-mono">
                      {nextRunDelta < 60
                        ? `${nextRunDelta}min`
                        : `${Math.floor(nextRunDelta / 60)}h${nextRunDelta % 60 > 0 ? `${nextRunDelta % 60}m` : ''}`}
                    </span>
                    <span className="text-muted">·</span>
                    <span>{new Date(nextRun!).toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })} UTC</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Recent news */}
        {data?.recentNews && data.recentNews.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-muted" />
              <h2 className="text-sm font-bold text-foreground">Últimas Notícias Criadas</h2>
            </div>
            <div className="space-y-1.5">
              {data.recentNews.map((news, i) => (
                <div key={news.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
                  <span className="text-[10px] text-muted tabular-nums w-4 shrink-0">{i + 1}</span>
                  <p className="text-xs text-foreground truncate flex-1">{news.title}</p>
                  <span className="text-[10px] text-muted shrink-0">
                    {new Date(news.createdAt).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
          </div>
        )}

      </div>
    </AdminLayout>
  )
}
