'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  RefreshCw, CheckCircle2, Activity, Bot,
  Clock, Newspaper, Users, Film, Loader2, ChevronRight,
  Zap, Sparkles, PlugZap, ArrowRight, Server, ShieldAlert, Wrench, Share2,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminBadge, AdminLinkButton } from '@/components/admin'

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
  manualTriggerEnabled: boolean
  manualReviewReason: string | null
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
  activeLocks: Array<{
    jobId: string
    startedAt: string
    expiresAt: string
  }>
  incidents: {
    systemErrors: number
    aiFailures: number
    total: number
    since: string
  }
  timestamp: string
}

interface HealthData {
  ai: { hasProvider: boolean }
  monitoring: {
    tmdb: { configured: boolean; available: boolean }
    slack: { content: boolean; alerts: boolean; deploys: boolean }
  }
}

interface AiWidgetData {
  lastJobAt: string | null
  lastJobStatus: 'success' | 'failed' | null
  totalJobsToday: number
  activeProviders: string[]
}

interface EnrichmentData {
  counts: Record<string, number>
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

const MANUAL_RECOVERY_TOOLS = [
  {
    title: 'Metadados de produções',
    href: '/admin/productions/sync',
    icon: Film,
    badge: 'Revisar sobrescrita',
    description: 'Reparo TMDB em lote. O modo completo pode alterar campos já curados; use somente após conferir a proteção necessária.',
  },
  {
    title: 'Filmografias',
    href: '/admin/filmography',
    icon: Wrench,
    badge: 'Manual / legado',
    description: 'Pode criar ou associar produções por TMDB e fallback de IA. Não possui job dedicado ativo no workflow atual.',
  },
  {
    title: 'Redes sociais',
    href: '/admin/artists/social-links',
    icon: Share2,
    badge: 'Correção pontual',
    description: 'Edição e busca de links sociais; o preenchimento automático diário usa Wikidata.',
  },
] as const

function TimelineBar({ jobs }: { jobs: CronJob[] }) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Map job to UTC hours it runs
  function getRunHours(schedule: string): number[] {
    const [_minPart, hourPart] = schedule.split(' ')
    if (!hourPart) return []
    if (_minPart.startsWith('*/') && hourPart === '*') return hours
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
  const [health, setHealth] = useState<HealthData | null>(null)
  const [ai, setAi] = useState<AiWidgetData | null>(null)
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggerState, setTriggerState] = useState<TriggerState>({})
  const [loadError, setLoadError] = useState(false)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const responses = await Promise.allSettled([
        fetch('/api/admin/cron'),
        fetch('/api/admin/health'),
        fetch('/api/admin/ai/widget'),
        fetch('/api/admin/enrichment'),
      ])
      const [cronResponse, healthResponse, aiResponse, enrichmentResponse] = responses

      if (cronResponse.status === 'fulfilled' && cronResponse.value.ok) {
        setData(await cronResponse.value.json())
      } else {
        setLoadError(true)
      }
      if (healthResponse.status === 'fulfilled' && healthResponse.value.ok) {
        setHealth(await healthResponse.value.json())
      }
      if (aiResponse.status === 'fulfilled' && aiResponse.value.ok) {
        setAi(await aiResponse.value.json())
      }
      if (enrichmentResponse.status === 'fulfilled' && enrichmentResponse.value.ok) {
        setEnrichment(await enrichmentResponse.value.json())
      }
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
  const activeLocks = data?.activeLocks ?? []
  const enrichmentPending = enrichment
    ? Object.values(enrichment.counts).reduce((sum, count) => sum + count, 0)
    : null
  const integrationsHealthy = health
    ? Number(health.monitoring.tmdb.available) + Number(health.ai.hasProvider)
    : null

  return (
    <AdminLayout title="Central de Automação" hideTitle>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-accent">Automação e eficiência</p>
            <h1 className="text-2xl lg:text-3xl font-black text-foreground mt-1">Central de automação</h1>
            {data && (
              <p className="text-sm text-muted mt-1">
                {jobs.length} jobs configurados · atualizado {new Date(data.timestamp).toLocaleString('pt-BR')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AdminLinkButton href="/admin/infrastructure" size="sm">
              <Server size={13} />
              Infraestrutura
            </AdminLinkButton>
            <button
              onClick={fetch_}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-foreground hover:bg-surface-hover text-xs font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            Não foi possível carregar os agendamentos. Atualize para tentar novamente.
          </div>
        )}

        {data && data.incidents.total > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/admin/cron/failures"
              className="flex-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 transition-colors hover:bg-red-500/10"
            >
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-bold text-foreground">{data.incidents.total} incidente{data.incidents.total !== 1 ? 's' : ''} nas últimas 24h</p>
                  <p className="text-[11px] text-muted">{data.incidents.systemErrors} sistema · {data.incidents.aiFailures} IA</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-red-500">
                Reexecutar falhas <ArrowRight size={12} />
              </span>
            </Link>
            <Link
              href="/admin/inbox#operacao"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs text-muted hover:text-foreground transition-colors"
            >
              Ver na Caixa <ArrowRight size={11} />
            </Link>
          </div>
        )}

        {/* Operational overview */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            {
              label: 'Em execução', icon: Activity, value: activeLocks.length,
              sub: activeLocks.length ? 'jobs com lock ativo agora' : 'nenhum job executando',
              color: activeLocks.length ? 'text-blue-500' : 'text-emerald-500', href: null,
            },
            {
              label: 'Fila editorial', icon: Sparkles, value: enrichmentPending,
              sub: enrichment ? 'curadoria manual via Gemini' : 'carregando fila',
              color: enrichmentPending ? 'text-amber-500' : 'text-emerald-500', href: '/admin/enrichment',
            },
            {
              label: 'IA hoje', icon: Bot, value: ai?.totalJobsToday,
              sub: ai?.lastJobStatus === 'failed' ? 'última chamada falhou' : `${ai?.activeProviders.length ?? 0} providers recentes`,
              color: ai?.lastJobStatus === 'failed' ? 'text-red-500' : 'text-accent', href: '/admin/ai',
            },
            {
              label: 'Dependências', icon: PlugZap, value: integrationsHealthy == null ? undefined : `${integrationsHealthy}/2`,
              sub: health?.monitoring.tmdb.available && health?.ai.hasProvider ? 'TMDB disponível e IA configurada' : 'revisar integrações',
              color: integrationsHealthy === 2 ? 'text-emerald-500' : 'text-amber-500', href: '/admin/infrastructure',
            },
          ].map(({ label, icon: Icon, value, sub, color, href }) => {
            const contents = (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted uppercase tracking-widest font-black">{label}</span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-2xl font-black tabular-nums ${color}`}>{value ?? '—'}</p>
                <p className="text-[11px] text-muted mt-1">{sub}</p>
              </>
            )
            return href ? (
              <Link key={label} href={href} className="group bg-surface border border-border hover:border-accent/30 rounded-xl p-4 transition-colors">
                {contents}
              </Link>
            ) : (
              <div key={label} className="bg-surface border border-border rounded-xl p-4">
                {contents}
              </div>
            )
          })}
        </div>

        {/* Work queue and integrations */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] text-muted uppercase tracking-widest font-black">Produção automatizada</p>
                <p className="text-xs text-muted mt-1">Sinais recentes gerados pelos fluxos automáticos.</p>
              </div>
              <Link href="/admin/pipeline" className="text-xs text-muted hover:text-accent flex items-center gap-1 transition-colors">
                Pipeline <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Notícias 24h', icon: Newspaper, total: stats?.newsLast24h, sub: `~${stats?.averageNewsPerDay ?? '—'}/dia`, color: 'text-accent' },
                { label: 'Artistas 24h', icon: Users, total: stats?.artistsLast24h, sub: 'novos visíveis', color: 'text-emerald-500' },
                { label: 'Produções 24h', icon: Film, total: stats?.productionsLast24h, sub: 'novas visíveis', color: 'text-blue-500' },
                { label: 'Notícias 7d', icon: Activity, total: stats?.newsLast7days, sub: 'últimos 7 dias', color: 'text-amber-500' },
              ].map(({ label, icon: Icon, total, sub, color }) => (
                <div key={label} className="rounded-lg bg-background border border-border p-3">
                  <Icon className={`w-3.5 h-3.5 mb-2 ${color}`} />
                  <p className="text-xl font-black text-foreground tabular-nums">{total ?? '—'}</p>
                  <p className="text-[10px] text-muted font-semibold">{label}</p>
                  <p className="text-[10px] text-muted mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted uppercase tracking-widest font-black mb-3">Dependências</p>
            <div className="space-y-3">
              {[
                { label: 'TMDB', ready: health?.monitoring.tmdb.available, configured: health?.monitoring.tmdb.configured },
                { label: 'Provider de IA', ready: health?.ai.hasProvider, configured: health?.ai.hasProvider, configuredOnly: true },
                { label: 'Slack alertas', ready: health?.monitoring.slack.alerts, configured: health?.monitoring.slack.alerts },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted">{item.label}</span>
                  {!health ? (
                    <AdminBadge variant="neutral">Verificando</AdminBadge>
                  ) : item.ready ? (
                    <AdminBadge variant="success" dot>{item.configuredOnly ? 'Configurado' : 'Disponível'}</AdminBadge>
                  ) : item.configured ? (
                    <AdminBadge variant="error" dot>Indisponível</AdminBadge>
                  ) : (
                    <AdminBadge variant="warning" dot>Não configurado</AdminBadge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="space-y-3">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Proteção da curadoria manual</h2>
              <p className="text-[11px] text-muted mt-1 leading-relaxed">
                O fluxo principal de conteúdo é a fila de enriquecimento com prompt e retorno do Gemini. Rotinas que podem alterar catálogo, tags, biografia ou visibilidade permanecem visíveis para monitoramento, mas não podem ser disparadas rapidamente nesta central sem revisão.
              </p>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-black">Recuperações manuais controladas</p>
            <p className="text-xs text-muted mt-1">Abra somente quando houver uma pendência identificada e confirme quais campos podem ser alterados.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {MANUAL_RECOVERY_TOOLS.map(({ title, href, icon: Icon, badge, description }) => (
              <Link key={href} href={href} className="rounded-xl border border-border bg-surface p-4 hover:border-amber-500/30 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Icon className="w-4 h-4 text-muted" />
                  <AdminBadge variant="warning" shape="pill">{badge}</AdminBadge>
                </div>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
                <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{description}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-accent mt-3">
                  Abrir ferramenta <ArrowRight size={11} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Timeline */}
        {jobs.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-muted mr-2" />
                <h2 className="text-sm font-bold text-foreground">Agenda 24h (UTC)</h2>
              </div>
              <span className="text-[10px] text-muted">blocos coloridos indicam execução prevista</span>
            </div>
            <TimelineBar jobs={jobs} />
          </div>
        )}

        {/* Jobs grid */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest font-black">Jobs configurados</p>
            <p className="text-xs text-muted mt-1">Monitore os jobs ativos; disparos sensíveis exigem revisão antes de qualquer reprocessamento.</p>
          </div>
          <Link href="/admin/activity?tab=system" className="text-xs text-muted hover:text-accent transition-colors">
            Ver eventos do sistema
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.map(job => {
            const colors = COLOR_MAP[job.color] ?? COLOR_MAP.blue
            const state = triggerState[job.id] ?? 'idle'
            const activeRun = activeLocks.find(lock => lock.jobId === job.id)
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
                      {activeRun && (
                        <p className="text-[10px] text-blue-500 mt-1">
                          Em execução desde {new Date(activeRun.startedAt).toLocaleTimeString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => trigger(job.id)}
                    disabled={state === 'running' || !!activeRun || !job.manualTriggerEnabled}
                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      state === 'running' || activeRun ? 'bg-blue-500/10 text-blue-500 cursor-wait' :
                      !job.manualTriggerEnabled ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-not-allowed' :
                      state === 'ok'      ? `${colors.badge} border` :
                      state === 'error'   ? 'bg-red-500/15 text-red-300 border border-red-500/20' :
                      'bg-surface text-muted hover:bg-surface hover:text-foreground border border-transparent'
                    }`}
                    title="Disparar agora"
                  >
                    {state === 'running' || activeRun ? <><Loader2 className="w-3 h-3 animate-spin" />Executando</> :
                     !job.manualTriggerEnabled ? <><ShieldAlert className="w-3 h-3" />Revisar</> :
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
                {job.manualReviewReason && (
                  <p className="mt-2.5 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                    Disparo manual bloqueado: {job.manualReviewReason}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        {/* Recent output */}
        {data?.recentNews && data.recentNews.length > 0 && (
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="w-4 h-4 text-muted" />
              <h2 className="text-sm font-bold text-foreground">Últimas notícias produzidas</h2>
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
