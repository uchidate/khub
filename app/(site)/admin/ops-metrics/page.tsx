'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
  Activity, AlertTriangle, BarChart3, BookOpen, CheckCircle2,
  FileText, Film, Languages, Mic2, Newspaper, RefreshCw,
  UsersRound, Clock, Database, XCircle,
} from 'lucide-react'

type CronJob = { id: string; status: string; at: string }

type MetricData = {
  generatedAt: string
  summary: {
    catalogHealth: number
    editorialHealth: number
    cronHealth: number
    openIssues: number
  }
  cron: {
    total: number
    ok: number
    failed: number
    jobs: CronJob[]
  }
  database: Record<string, number>
  catalog: {
    artists: Record<string, number> & { coverage: Record<string, number> }
    groups: Record<string, number> & { coverage: Record<string, number> }
    productions: Record<string, number> & { coverage: Record<string, number> }
  }
  editorial: {
    news: Record<string, number>
    blog: Record<string, number>
    seo: Record<string, number>
  }
}

function fmt(value: number | null | undefined): string {
  if (value == null) return '-'
  if (value > 0 && value < 1) return `${(value * 100).toFixed(1)}%`
  return value.toLocaleString('pt-BR')
}

function HealthCard({ label, value, href }: { label: string; value: number; href: string }) {
  const tone = value >= 85 ? 'text-emerald-500' : value >= 65 ? 'text-amber-500' : 'text-red-500'
  return (
    <Link href={href} className="rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-hover">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone}`}>{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${value >= 85 ? 'bg-emerald-500' : value >= 65 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${value}%` }} />
      </div>
    </Link>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  )
}

function MetricRow({ label, value, href, danger = false }: { label: string; value: number | null; href?: string; danger?: boolean }) {
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2">
      <span className="truncate text-xs font-medium text-muted">{label}</span>
      <span className={`shrink-0 text-sm font-black ${danger && value ? 'text-red-500' : 'text-foreground'}`}>{fmt(value)}</span>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

function Coverage({ label, value }: { label: string; value: number }) {
  const tone = value >= 85 ? 'bg-emerald-500' : value >= 65 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="rounded-lg bg-background px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted">{label}</span>
        <span className="text-xs font-black text-foreground">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export default function OpsMetricsPage() {
  const [data, setData] = useState<MetricData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/ops-metrics')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <AdminLayout title="Métricas Operacionais" subtitle="Qualidade do catálogo, editorial e saúde das automações">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Activity className="h-4 w-4 text-accent" />
            {data ? `Atualizado em ${new Date(data.generatedAt).toLocaleString('pt-BR')} · auto-refresh a cada 5 min` : 'Carregando métricas...'}
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {!data ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-sm text-muted">Carregando...</div>
        ) : (
          <>
            {/* Health scores */}
            <div className="grid gap-3 md:grid-cols-4">
              <HealthCard label="Saúde do catálogo" value={data.summary.catalogHealth} href="/admin/enrichment" />
              <HealthCard label="Saúde editorial" value={data.summary.editorialHealth} href="/admin/pipeline" />
              <HealthCard label="Saúde das automações" value={data.summary.cronHealth} href="/admin/cron" />
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted"><AlertTriangle className="h-3.5 w-3.5" /> Pendências abertas</p>
                <p className="mt-2 text-3xl font-black text-foreground">{fmt(data.summary.openIssues)}</p>
                <p className="mt-2 text-xs text-muted">Catálogo + editorial. Monetização em <Link href="/admin/loja" className="underline hover:text-foreground">/loja</Link>.</p>
              </div>
            </div>

            {/* Cron health summary */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-bold text-foreground">Automações (últimas 48h)</h2>
                </div>
                <Link href="/admin/cron" className="text-xs text-muted hover:text-foreground transition-colors">
                  Ver detalhes
                </Link>
              </div>
              {data.cron.total === 0 ? (
                <p className="text-xs text-muted">Nenhum run registrado nas últimas 48h.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" /> {data.cron.ok} ok
                  </span>
                  {data.cron.failed > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-400">
                      <XCircle className="h-3 w-3" /> {data.cron.failed} falhou
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-border px-2.5 py-1 text-xs font-semibold text-muted">
                    {data.cron.total} jobs monitorados
                  </span>
                </div>
              )}
            </div>

            {/* Cobertura do catálogo */}
            <SectionCard title="Cobertura do Catálogo" icon={BarChart3}>
              <Coverage label="Artistas com imagem" value={data.catalog.artists.coverage.image} />
              <Coverage label="Artistas com bio" value={data.catalog.artists.coverage.bio} />
              <Coverage label="Artistas com hangul" value={data.catalog.artists.coverage.hangul} />
              <Coverage label="Grupos com imagem" value={data.catalog.groups.coverage.image} />
              <Coverage label="Grupos com bio" value={data.catalog.groups.coverage.bio} />
              <Coverage label="Grupos com membros" value={data.catalog.groups.coverage.members} />
              <Coverage label="Produções com poster" value={data.catalog.productions.coverage.poster} />
              <Coverage label="Produções com elenco" value={data.catalog.productions.coverage.cast} />
              <Coverage label="Produções com sinopse" value={data.catalog.productions.coverage.synopsis} />
              <Coverage label="Produções com streaming" value={data.catalog.productions.coverage.streaming} />
            </SectionCard>

            {/* Entidades */}
            <div className="grid gap-4 xl:grid-cols-3">
              <SectionCard title="Artistas" icon={Mic2}>
                <MetricRow label="Total visível" value={data.catalog.artists.total} href="/admin/artists" />
                <MetricRow label="Sem slug" value={data.catalog.artists.missingSlug} danger href="/admin/artists" />
                <MetricRow label="Sem imagem" value={data.catalog.artists.missingImage} danger href="/admin/artists?filter=no_photo" />
                <MetricRow label="Sem bio" value={data.catalog.artists.missingBio} danger href="/admin/enrichment" />
                <MetricRow label="Sem agência" value={data.catalog.artists.missingAgency} href="/admin/agencies" />
                <MetricRow label="Tradução pendente" value={data.catalog.artists.pendingTranslation} danger href="/admin/translations?tab=artist" />
                <MetricRow label="Tradução falhou" value={data.catalog.artists.failedTranslation} danger href="/admin/translations/log" />
              </SectionCard>

              <SectionCard title="Grupos" icon={UsersRound}>
                <MetricRow label="Total visível" value={data.catalog.groups.total} href="/admin/groups" />
                <MetricRow label="Sem slug" value={data.catalog.groups.missingSlug} danger href="/admin/groups" />
                <MetricRow label="Sem imagem" value={data.catalog.groups.missingImage} danger href="/admin/groups" />
                <MetricRow label="Sem bio" value={data.catalog.groups.missingBio} danger href="/admin/groups/enrich" />
                <MetricRow label="Sem membros" value={data.catalog.groups.missingMembers} danger href="/admin/artists/groups" />
                <MetricRow label="Sem agência" value={data.catalog.groups.missingAgency} href="/admin/agencies" />
              </SectionCard>

              <SectionCard title="Produções" icon={Film}>
                <MetricRow label="Total visível" value={data.catalog.productions.total} href="/admin/productions" />
                <MetricRow label="Sem poster" value={data.catalog.productions.missingPoster} danger href="/admin/productions" />
                <MetricRow label="Sem sinopse" value={data.catalog.productions.missingSynopsis} danger href="/admin/productions/enrich" />
                <MetricRow label="Sem elenco" value={data.catalog.productions.missingCast} danger href="/admin/productions/sync" />
                <MetricRow label="Sem streaming" value={data.catalog.productions.missingStreaming} href="/admin/streaming" />
                <MetricRow label="Precisa curadoria" value={data.catalog.productions.needsCuration} danger href="/admin/productions/moderation" />
                <MetricRow label="Adulto não verificado" value={data.catalog.productions.adultUnchecked} danger href="/admin/productions/moderation" />
                <MetricRow label="Tradução pendente" value={data.catalog.productions.pendingTranslation} danger href="/admin/translations" />
                <MetricRow label="Tradução falhou" value={data.catalog.productions.failedTranslation} danger href="/admin/translations/log" />
              </SectionCard>
            </div>

            {/* Editorial */}
            <div className="grid gap-4 xl:grid-cols-2">
              <SectionCard title="Notícias" icon={Newspaper}>
                <MetricRow label="Publicadas" value={data.editorial.news.published} href="/admin/news" />
                <MetricRow label="Draft/ready" value={data.editorial.news.draftReady} danger href="/admin/news" />
                <MetricRow label="Ocultas" value={data.editorial.news.hidden} href="/admin/news" />
                <MetricRow label="Sem imagem" value={data.editorial.news.missingImage} danger href="/admin/news" />
                <MetricRow label="Tradução pendente" value={data.editorial.news.pendingTranslation} danger href="/admin/translations" />
                <MetricRow label="Tradução falhou" value={data.editorial.news.failedTranslation} danger href="/admin/translations/log" />
                <MetricRow label="Sem nota editorial" value={data.editorial.news.withoutEditorialNote} href="/admin/news/reprocess" />
                <MetricRow label="Sem blog derivado" value={data.editorial.news.withoutGeneratedBlog} href="/admin/blog/inspiration" />
              </SectionCard>

              <SectionCard title="Blog e SEO" icon={BookOpen}>
                <MetricRow label="Posts publicados" value={data.editorial.blog.published} href="/admin/blog" />
                <MetricRow label="Rascunhos" value={data.editorial.blog.draft} href="/admin/blog" />
                <MetricRow label="Revisão pendente" value={data.editorial.blog.pendingReview} danger href="/admin/blog" />
                <MetricRow label="Sem capa" value={data.editorial.blog.missingCover} danger href="/admin/blog" />
                <MetricRow label="Sem categoria" value={data.editorial.blog.missingCategory} danger href="/admin/blog" />
                <MetricRow label="Sem vínculo com entidade" value={data.editorial.blog.withoutEntityLinks} danger href="/admin/blog" />
                <MetricRow label="Meta description faltando" value={data.editorial.seo.missingMetaDesc} danger href="/admin/seo" />
                <MetricRow label="Páginas noindex" value={data.editorial.seo.noIndex} href="/admin/seo" />
              </SectionCard>
            </div>

            {/* Base cadastrada (absorve /admin/database) */}
            <section className="rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-accent" />
                  <h2 className="text-sm font-bold text-foreground">Base cadastrada</h2>
                </div>
              </div>
              <div className="grid gap-2 p-4 sm:grid-cols-4">
                {([
                  ['Usuários', data.database.users, '/admin/users'],
                  ['Artistas', data.database.artists, '/admin/artists'],
                  ['Grupos', data.database.groups, '/admin/groups'],
                  ['Produções', data.database.productions, '/admin/productions'],
                  ['Agências', data.database.agencies, '/admin/agencies'],
                  ['Álbuns', data.database.albums, '/admin/albums'],
                  ['Notícias', data.database.news, '/admin/news'],
                  ['Blog posts', data.database.blogPosts, '/admin/blog'],
                ] as [string, number, string][]).map(([label, value, href]) => (
                  <Link key={label} href={href} className="flex items-center justify-between gap-3 rounded-lg bg-background px-3 py-2 hover:bg-surface-hover transition-colors">
                    <span className="truncate text-xs font-medium text-muted">{label}</span>
                    <span className="shrink-0 text-sm font-black text-foreground">{fmt(value)}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Guia de uso */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-foreground">Como usar este painel</h2>
              </div>
              <div className="grid gap-2 text-xs text-muted md:grid-cols-3">
                <p><FileText className="mr-1 inline h-3.5 w-3.5 text-accent" /> Priorize métricas vermelhas que afetam páginas com tráfego alto.</p>
                <p><Languages className="mr-1 inline h-3.5 w-3.5 text-accent" /> Tradução falhou é dívida de publicação — acionar via <Link href="/admin/translations/log" className="underline">log de traduções</Link>.</p>
                <p><Clock className="mr-1 inline h-3.5 w-3.5 text-accent" /> Automações com falha devem ser verificadas em <Link href="/admin/cron" className="underline">/admin/cron</Link>.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
