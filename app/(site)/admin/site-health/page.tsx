'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Activity, AlertTriangle, CheckCircle2, ExternalLink, Gauge,
  Link2, Loader2, RefreshCw, Search,
  Server, ShieldCheck, Workflow, XCircle,
} from 'lucide-react'

type Severity = 'ok' | 'info' | 'warning' | 'error'
type HealthCheck = { id: string; label: string; status: Severity; message: string; href?: string }
type PublishIssue = { id: string; severity: 'error' | 'warning' | 'info'; area: string; message: string }
type PublishGuardItem = {
  id: string
  slug: string
  title: string
  status: string
  score: number
  publishable: boolean
  issues: PublishIssue[]
}
type Overview = {
  generatedAt: string
  score: number
  summary: { openIssues: number; publishErrors: number; publishWarnings: number; recent404: number; server5xx: number }
  wordpressGrade: Record<string, boolean>
  inventory: Record<string, number>
  top404: { path: string; count: number }[]
  publishGuard: PublishGuardItem[]
  checks: HealthCheck[]
}
type UrlHealth = {
  path: string
  url: string
  entityType: string
  title?: string
  exists: boolean
  score: number
  checks: HealthCheck[]
}

function tone(status: Severity) {
  if (status === 'ok') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
  if (status === 'warning') return 'text-amber-400 bg-amber-500/10 border-amber-500/25'
  if (status === 'error') return 'text-red-400 bg-red-500/10 border-red-500/25'
  return 'text-blue-400 bg-blue-500/10 border-blue-500/25'
}

function iconFor(status: Severity) {
  if (status === 'ok') return CheckCircle2
  if (status === 'error') return XCircle
  return AlertTriangle
}

function fmt(n: number) {
  return n.toLocaleString('pt-BR')
}

function ScoreCard({ score }: { score: number }) {
  const color = score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
        <Gauge className="h-4 w-4" /> Score
      </div>
      <p className={`mt-3 text-5xl font-black ${color}`}>{score}</p>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${score >= 85 ? 'bg-emerald-500' : score >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function CheckRow({ check }: { check: HealthCheck }) {
  const Icon = iconFor(check.status)
  const body = (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${check.status === 'ok' ? 'text-emerald-400' : check.status === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-foreground">{check.label}</p>
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${tone(check.status)}`}>{check.status}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{check.message}</p>
      </div>
      {check.href && <ExternalLink className="h-3.5 w-3.5 text-muted" />}
    </div>
  )
  return check.href ? <Link href={check.href}>{body}</Link> : body
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Icon className="h-4 w-4 text-accent" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-foreground">{fmt(value)}</p>
    </div>
  )
}

export default function SiteHealthPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [urlHealth, setUrlHealth] = useState<UrlHealth | null>(null)
  const [path, setPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkingUrl, setCheckingUrl] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/site-health')
    if (res.ok) {
      const data = await res.json()
      setOverview(data.overview)
    }
    setLoading(false)
  }, [])

  async function inspectUrl() {
    const value = path.trim()
    if (!value) return
    setCheckingUrl(true)
    const res = await fetch(`/api/admin/site-health?path=${encodeURIComponent(value)}`)
    if (res.ok) {
      const data = await res.json()
      setUrlHealth(data.urlHealth)
    }
    setCheckingUrl(false)
  }

  useEffect(() => { load() }, [load])

  return (
    <AdminLayout title="Site Health" subtitle="Auditoria WordPress-grade de SEO, Ads, imagens, redirects, publicação e cache">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Activity className="h-4 w-4 text-accent" />
            {overview ? `Atualizado em ${new Date(overview.generatedAt).toLocaleString('pt-BR')}` : 'Carregando...'}
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {!overview ? (
          <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Carregando Site Health...
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <ScoreCard score={overview.score} />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Stat label="Pendências abertas" value={overview.summary.openIssues} icon={AlertTriangle} />
                <Stat label="Erros publish guard" value={overview.summary.publishErrors} icon={Workflow} />
                <Stat label="404 recentes" value={overview.summary.recent404} icon={Link2} />
                <Stat label="5xx recentes" value={overview.summary.server5xx} icon={Server} />
              </div>
            </div>

            <section className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground">Checks Operacionais</h2>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {overview.checks.map(check => <CheckRow key={check.id} check={check} />)}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground">Auditoria Por URL</h2>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inspectUrl()}
                  placeholder="/blog/meu-post ou https://www.hallyuhub.com.br/artists/..."
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
                <button onClick={inspectUrl} disabled={checkingUrl || !path.trim()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  {checkingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Verificar
                </button>
              </div>
              {urlHealth && (
                <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{urlHealth.entityType}</p>
                    <p className="mt-2 line-clamp-2 text-sm font-bold text-foreground">{urlHealth.title ?? urlHealth.path}</p>
                    <p className={`mt-3 text-4xl font-black ${urlHealth.score >= 85 ? 'text-emerald-400' : urlHealth.score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{urlHealth.score}</p>
                    <a href={urlHealth.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
                      Abrir URL <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {urlHealth.checks.map(check => <CheckRow key={check.id} check={check} />)}
                  </div>
                </div>
              )}
            </section>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-bold text-foreground">Publish Guard</h2>
                </div>
                <div className="space-y-2">
                  {overview.publishGuard.length === 0 ? (
                    <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">Nenhum post com pendência relevante.</p>
                  ) : overview.publishGuard.map(post => (
                    <Link key={post.id} href={`/admin/blog/${post.id}/edit`} className="block rounded-lg border border-border bg-surface p-4 hover:bg-surface-hover">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{post.title}</p>
                          <p className="mt-1 text-xs text-muted">{post.status} · score {post.score}</p>
                        </div>
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${post.publishable ? tone('warning') : tone('error')}`}>
                          {post.publishable ? 'avisos' : 'bloqueio'}
                        </span>
                      </div>
                      <ul className="mt-3 space-y-1">
                        {post.issues.slice(0, 3).map(issue => (
                          <li key={issue.id} className="text-xs text-muted">{issue.area}: {issue.message}</li>
                        ))}
                      </ul>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-bold text-foreground">404 e Redirects Candidatos</h2>
                </div>
                <div className="space-y-2">
                  {overview.top404.length === 0 ? (
                    <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">Sem 404 recente persistido.</p>
                  ) : overview.top404.map(item => (
                    <Link key={item.path} href={`/admin/server-logs?status=4xx&path=${encodeURIComponent(item.path)}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 hover:bg-surface-hover">
                      <span className="min-w-0 truncate font-mono text-xs text-foreground">{item.path}</span>
                      <span className="rounded bg-red-500/10 px-2 py-1 text-xs font-black text-red-400">{fmt(item.count)}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <CheckRow check={{ id: 'image-audit', label: 'Auditoria de imagens', status: overview.inventory.blogMissingCover ? 'warning' : 'ok', message: `${fmt(overview.inventory.blogMissingCover)} posts publicados sem capa.`, href: '/admin/image-audit' }} />
              <CheckRow check={{ id: 'adsense', label: 'AdSense', status: 'ok', message: 'Elegibilidade e canais estão centralizados; patrocinado/thin/adulto ficam protegidos.', href: '/admin/ads' }} />
              <CheckRow check={{ id: 'cache', label: 'Cache e estabilidade', status: overview.summary.server5xx ? 'warning' : 'ok', message: '5xx recentes são usados como proxy de instabilidade de rota/cache.', href: '/admin/server-logs?status=5xx' }} />
              <CheckRow check={{ id: 'internal-links', label: 'Linkagem interna', status: overview.inventory.blogWithoutLinks ? 'warning' : 'ok', message: `${fmt(overview.inventory.blogWithoutLinks)} posts publicados sem vínculo com entidades.`, href: '/admin/blog' }} />
              <CheckRow check={{ id: 'thin', label: 'Thin content', status: overview.inventory.thinArtists + overview.inventory.thinGroups ? 'warning' : 'ok', message: `${fmt(overview.inventory.thinArtists)} artistas e ${fmt(overview.inventory.thinGroups)} grupos thin.`, href: '/admin/seo/content-quality' }} />
              <CheckRow check={{ id: 'adult', label: 'Conteúdo adulto', status: overview.inventory.adultProductions ? 'info' : 'ok', message: `${fmt(overview.inventory.adultProductions)} produções adultas devem ficar sem index/ads.`, href: '/admin/productions/moderation' }} />
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
