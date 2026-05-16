'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Search, Eye, Newspaper, Music2, Users,
    BarChart3, RefreshCw, BookOpen, UserPlus, Loader2, Heart, Globe,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeseriesRow {
    date:   string
    blog:   number
    artist: number
    news:   number
    group:  number
    total:  number
}

interface IntradayRow {
    slot:   number
    label:  string   // "HH:MM"
    blog:   number
    artist: number
    news:   number
    group:  number
    total:  number
}

type BlogItem    = { id: string; slug: string; title: string; viewCount: number; coverImageUrl: string | null; publishedAt: string | null; category: { name: string } | null; todayViews?: number }
type ArtistItem  = { id: string; nameRomanized: string; viewCount: number; trendingScore: number; primaryImageUrl: string | null; todayViews?: number }
type NewsItem    = { id: string; title: string; viewCount: number; source: string | null; publishedAt: string; todayViews?: number }
type GroupItem   = { id: string; name: string; viewCount: number; trendingScore: number; profileImageUrl: string | null; todayViews?: number }

interface AnalyticsData {
    timeseries:  TimeseriesRow[]
    intraday:    IntradayRow[]
    topBlog:     BlogItem[]
    topArtists:  ArtistItem[]
    topNews:     NewsItem[]
    topGroups:   GroupItem[]
    topBlogToday:    BlogItem[]
    topArtistsToday: ArtistItem[]
    topNewsToday:    NewsItem[]
    topGroupsToday:  GroupItem[]
    totals:      { blog: number; artist: number; news: number; group: number }
    users:       { total: number; new7d: number; new30d: number }
    published7d: { posts: number; news: number }
    activityByType30d: { type: string; _count: { id: number } }[]
    topSearchTerms:    { term: string; count: number }[]
}

type Period = '0' | '7' | '30' | '90'

interface Ga4Metrics { sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionDuration: number }
interface Ga4Page    { path: string; title?: string; pageviews: number; users: number; bounceRate?: number }
interface Ga4Country { country: string; users: number; pageviews: number }
interface Ga4Device  { device: string; users: number; sessions: number }
interface Ga4Source  { channel: string; sessions: number; users: number }
interface Ga4NvR     { type: string; users: number; sessions: number }
interface Ga4Search  { term: string; sessions: number; users: number }
interface Ga4Section { section: string; pageviews: number; users: number; avgDuration: number; engagementRate: number }
interface Ga4ExitPage { path: string; sessions: number }
interface Ga4Data {
    metrics: Ga4Metrics
    activeUsers: number
    blogPosts: Ga4Page[]
    productions: Ga4Page[]
    artists: Ga4Page[]
    countries: Ga4Country[]
    devices: Ga4Device[]
    sources: Ga4Source[]
    newVsReturning: Ga4NvR[]
    searchTerms: Ga4Search[]
    sectionEngagement: Ga4Section[]
    exitPages: Ga4ExitPage[]
    landingPages: Ga4Page[]
    days: number
}

// ─── Bar Chart (CSS) ──────────────────────────────────────────────────────────

type ChartRow = { label?: string; date?: string; slot?: number; blog: number; artist: number; news: number; group: number; total: number }

function BarChart({ data, height = 120, labelEveryN }: { data: ChartRow[]; height?: number; labelEveryN?: number }) {
    const max = Math.max(...data.map(d => d.total), 1)
    const every = labelEveryN ?? (data.length <= 7 ? 1 : data.length <= 30 ? 7 : data.length <= 96 ? 8 : 14)

    return (
        <div className="space-y-2">
            <div className="flex items-end gap-px" style={{ height }}>
                {data.map((row, idx) => {
                    const pct       = (row.total / max) * 100
                    const blogPct   = row.total > 0 ? (row.blog   / row.total) * pct : 0
                    const artistPct = row.total > 0 ? (row.artist / row.total) * pct : 0
                    const newsPct   = row.total > 0 ? (row.news   / row.total) * pct : 0
                    const groupPct  = row.total > 0 ? (row.group  / row.total) * pct : 0
                    const tooltipLabel = row.label ?? (row.date ? new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR') : String(idx))

                    return (
                        <div
                            key={row.label ?? row.date ?? idx}
                            className="flex-1 flex flex-col justify-end group relative"
                            style={{ height: '100%' }}
                        >
                            <div className="w-full flex flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${pct}%`, minHeight: row.total > 0 ? 2 : 0 }}>
                                <div style={{ height: `${groupPct  / pct * 100}%` }} className="bg-purple-500/70" />
                                <div style={{ height: `${newsPct   / pct * 100}%` }} className="bg-green-500/70" />
                                <div style={{ height: `${artistPct / pct * 100}%` }} className="bg-blue-500/70" />
                                <div style={{ height: `${blogPct   / pct * 100}%` }} className="bg-orange-500/70" />
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                <div className="bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                                    <p className="font-bold text-foreground">{row.total.toLocaleString('pt-BR')} views</p>
                                    <p className="text-muted">{tooltipLabel}</p>
                                    {row.total > 0 && (
                                        <p className="text-muted/70">
                                            blog {row.blog} · art {row.artist} · news {row.news} · grp {row.group}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {/* Labels */}
            <div className="flex items-center" style={{ gap: 0 }}>
                {data.map((row, i) => (
                    <div key={row.label ?? row.date ?? i} className="flex-1 text-center">
                        {i % every === 0 && (
                            <span className="text-[9px] text-muted">
                                {row.label ?? (row.date ? new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '')}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'text-foreground', bg = 'bg-surface' }: {
    icon: React.ElementType
    label: string
    value: number | string
    sub?: string
    color?: string
    bg?: string
}) {
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-border ${bg}`}>
            <Icon size={15} className={`${color} shrink-0`} />
            <div>
                <p className={`text-xl font-black leading-none ${color}`}>
                    {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                </p>
                <p className="text-[11px] text-muted mt-0.5">{label}</p>
                {sub && <p className="text-[10px] text-muted/70">{sub}</p>}
            </div>
        </div>
    )
}

// ─── Top List ─────────────────────────────────────────────────────────────────

function TopList<T extends { id: string; viewCount: number }>({
    items, title, icon: Icon, renderItem, emptyMsg,
}: {
    items: T[]
    title: string
    icon: React.ElementType
    renderItem: (item: T, i: number, maxViews: number) => React.ReactNode
    emptyMsg?: string
}) {
    const maxViews = Math.max(...items.map(i => i.viewCount), 1)
    return (
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Icon size={13} className="text-muted" />
                <h3 className="text-xs font-bold text-foreground">{title}</h3>
            </div>
            <div className="divide-y divide-border">
                {items.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-muted text-center">{emptyMsg ?? 'Sem dados ainda'}</p>
                ) : items.map((item, i) => renderItem(item, i, maxViews))}
            </div>
        </section>
    )
}

function TopListRow({ rank, image, title, href, views, maxViews, sub, todayViews }: {
    rank: number; image: string | null; title: string; href: string
    views: number; maxViews: number; sub?: string; todayViews?: number
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors group">
            <span className="text-[11px] font-black text-muted w-4 text-right shrink-0">{rank}</span>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-background border border-border/50 shrink-0">
                {image
                    ? <Image src={image} alt={title} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                    : <div className="w-full h-full flex items-center justify-center text-[9px] text-muted font-bold">{title[0]}</div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <Link href={href} target="_blank" className="text-[12px] font-medium text-foreground hover:text-blue-400 transition-colors truncate block">
                    {title}
                </Link>
                {sub && <p className="text-[10px] text-muted truncate">{sub}</p>}
                <div className="mt-1 h-1 bg-border rounded-full overflow-hidden w-full">
                    <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${(views / maxViews) * 100}%` }} />
                </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-[11px] text-muted flex items-center gap-1">
                    <Eye size={10} />
                    {views.toLocaleString('pt-BR')}
                </span>
                {todayViews !== undefined && (
                    <span className="text-[10px] text-blue-400 font-bold">+{todayViews} hoje</span>
                )}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<Period, string> = {
    '0':  'Hoje',
    '7':  '7 dias',
    '30': '30 dias',
    '90': '90 dias',
}

export default function AdminAnalyticsPage() {
    const [period,  setPeriod]  = useState<Period>('30')
    const [data,    setData]    = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [ga4,     setGa4]     = useState<Ga4Data | null>(null)
    const [ga4Loading, setGa4Loading] = useState(true)
    const [ga4Error, setGa4Error] = useState<string | null>(null)

    const load = useCallback(async (p: Period) => {
        setLoading(true)
        try {
            const res  = await fetch(`/api/admin/analytics?days=${p}`)
            const json = await res.json()
            setData(json)
        } catch {
            // keep old data on error
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load(period) }, [period, load])

    const loadGa4 = useCallback(() => {
        setGa4Loading(true)
        setGa4Error(null)
        fetch('/api/admin/analytics/ga4?days=30', { credentials: 'include' })
            .then(r => r.json())
            .then(d => {
                if (d.error) setGa4Error(d.error)
                else setGa4(d)
            })
            .catch(e => setGa4Error(e.message ?? 'Erro desconhecido'))
            .finally(() => setGa4Loading(false))
    }, [])

    useEffect(() => { loadGa4() }, [loadGa4])

    // Auto-refresh every 60s when "Hoje" is active
    useEffect(() => {
        if (period !== '0') return
        const id = setInterval(() => load('0'), 60_000)
        return () => clearInterval(id)
    }, [period, load])

    const isToday      = period === '0'
    const chartData    = isToday ? (data?.intraday ?? []) : (data?.timeseries ?? [])
    const totalAllTime = data ? Object.values(data.totals).reduce((a, b) => a + b, 0) : 0
    // Para "hoje": usa o timeseries (ViewEvent diário) que é a mesma fonte dos top lists
    const totalPeriod  = (data?.timeseries ?? []).reduce((a, b) => a + b.total, 0)

    const intradayHasData = (data?.intraday ?? []).some(s => s.total > 0)
    const chartTitle = isToday
        ? `Views hoje — por slot de 15min`
        : `Views por dia — últimos ${period} dias`

    return (
        <AdminLayout title="Analytics" subtitle="Views, usuários e performance de conteúdo">
            <div className="space-y-6">

                {/* Period selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {(['0', '7', '30', '90'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                period === p
                                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                    : 'text-muted border-border hover:text-foreground'
                            }`}
                        >
                            {PERIOD_LABELS[p]}
                        </button>
                    ))}
                    {loading && <Loader2 size={14} className="animate-spin text-muted ml-1" />}
                    {isToday && !loading && (
                        <span className="text-[10px] text-muted/60 ml-1">atualiza a cada 60s</span>
                    )}
                    <button
                        onClick={() => load(period)}
                        className="ml-auto flex items-center gap-1.5 text-[11px] text-muted hover:text-foreground transition-colors"
                    >
                        <RefreshCw size={12} />
                        Atualizar
                    </button>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    <StatCard icon={Eye}      label="Views (all-time)"        value={totalAllTime}              color="text-foreground" />
                    <StatCard icon={BarChart3} label={`Views (${PERIOD_LABELS[period]})`} value={totalPeriod}  color="text-blue-400"   bg="bg-blue-500/5 border-blue-500/20" />
                    <StatCard icon={BookOpen} label="Views blog"               value={data?.totals.blog   ?? 0} color="text-orange-400" />
                    <StatCard icon={Music2}   label="Views artistas"           value={data?.totals.artist ?? 0} color="text-purple-400" />
                    <StatCard icon={Newspaper} label="Views notícias"          value={data?.totals.news   ?? 0} color="text-green-400"  />
                    <StatCard icon={Users}    label="Usuários"                 value={data?.users.total   ?? 0} sub={data ? `+${data.users.new7d} esta semana` : undefined} color="text-cyan-400" />
                </div>

                {/* Second row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard icon={UserPlus}  label="Novos usuários (7d)"       value={data?.users.new7d       ?? 0} color="text-cyan-400"   />
                    <StatCard icon={UserPlus}  label="Novos usuários (30d)"      value={data?.users.new30d      ?? 0} color="text-cyan-400"   />
                    <StatCard icon={BookOpen}  label="Posts publicados (7d)"     value={data?.published7d.posts ?? 0} color="text-orange-400" />
                    <StatCard icon={Newspaper} label="Notícias publicadas (7d)"  value={data?.published7d.news  ?? 0} color="text-green-400"  />
                </div>

                {/* Chart */}
                <section className="bg-surface border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-bold text-foreground">{chartTitle}</h3>
                        <div className="flex items-center gap-3 text-[10px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/70" />Blog</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/70" />Artistas</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/70" />Notícias</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500/70" />Grupos</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-[140px]">
                            <Loader2 className="animate-spin text-muted" size={20} />
                        </div>
                    ) : isToday && !intradayHasData ? (
                        <div className="flex items-center justify-center h-[140px] text-muted text-sm text-center px-4">
                            Gráfico intraday disponível após as primeiras views do dia
                        </div>
                    ) : chartData.length > 0 ? (
                        <BarChart
                            data={chartData}
                            height={140}
                            labelEveryN={isToday ? 4 : undefined}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-[140px] text-muted text-sm">
                            Nenhum dado de views ainda
                        </div>
                    )}
                </section>

                {/* Top content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    <TopList
                        items={isToday ? (data?.topBlogToday ?? []) : (data?.topBlog ?? [])}
                        title={isToday ? 'Top Blog Posts — Hoje' : 'Top Blog Posts (all-time)'}
                        icon={BookOpen}
                        emptyMsg={isToday ? 'Nenhuma view de blog hoje ainda' : 'Nenhum post publicado ainda'}
                        renderItem={(post, i, max) => (
                            <TopListRow
                                key={post.id}
                                rank={i + 1}
                                image={post.coverImageUrl}
                                title={post.title}
                                href={`/blog/${post.slug}`}
                                views={post.viewCount}
                                maxViews={max}
                                sub={post.category?.name ?? (post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pt-BR') : undefined)}
                                todayViews={isToday ? post.todayViews : undefined}
                            />
                        )}
                    />

                    <TopList
                        items={isToday ? (data?.topArtistsToday ?? []) : (data?.topArtists ?? [])}
                        title={isToday ? 'Top Artistas — Hoje' : 'Top Artistas — Views'}
                        icon={Music2}
                        emptyMsg={isToday ? 'Nenhuma view de artista hoje ainda' : 'Sem dados'}
                        renderItem={(artist, i, max) => (
                            <TopListRow
                                key={artist.id}
                                rank={i + 1}
                                image={artist.primaryImageUrl}
                                title={artist.nameRomanized}
                                href={`/artists/${artist.id}`}
                                views={artist.viewCount}
                                maxViews={max}
                                sub={`trending ${artist.trendingScore.toFixed(1)}`}
                                todayViews={isToday ? artist.todayViews : undefined}
                            />
                        )}
                    />

                    <TopList
                        items={isToday ? (data?.topNewsToday ?? []) : (data?.topNews ?? [])}
                        title={isToday ? 'Top Notícias — Hoje' : 'Top Notícias — Views'}
                        icon={Newspaper}
                        emptyMsg={isToday ? 'Nenhuma view de notícia hoje ainda' : 'Sem dados'}
                        renderItem={(item, i, max) => (
                            <TopListRow
                                key={item.id}
                                rank={i + 1}
                                image={null}
                                title={item.title}
                                href={`/news/${item.id}`}
                                views={item.viewCount}
                                maxViews={max}
                                sub={item.source ?? undefined}
                                todayViews={isToday ? item.todayViews : undefined}
                            />
                        )}
                    />

                    <TopList
                        items={isToday ? (data?.topGroupsToday ?? []) : (data?.topGroups ?? [])}
                        title={isToday ? 'Top Grupos — Hoje' : 'Top Grupos — Views'}
                        icon={Users}
                        emptyMsg={isToday ? 'Nenhuma view de grupo hoje ainda' : 'Sem dados'}
                        renderItem={(group, i, max) => (
                            <TopListRow
                                key={group.id}
                                rank={i + 1}
                                image={group.profileImageUrl}
                                title={group.name}
                                href={`/groups/${group.id}`}
                                views={group.viewCount}
                                maxViews={max}
                                sub={`trending ${group.trendingScore.toFixed(1)}`}
                                todayViews={isToday ? group.todayViews : undefined}
                            />
                        )}
                    />
                </div>

                {/* Buscas + Engajamento */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    <section className="bg-surface border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                            <Search size={13} className="text-muted" />
                            <h3 className="text-xs font-bold text-foreground">Buscas Populares — 30 dias</h3>
                        </div>
                        <div className="p-4">
                            {(data?.topSearchTerms.length ?? 0) > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {data!.topSearchTerms.map(({ term, count }) => (
                                        <span
                                            key={term}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border rounded-full text-[11px] text-foreground"
                                        >
                                            {term}
                                            <span className="text-[10px] font-black text-blue-400">{count}×</span>
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted">Nenhuma busca registrada (apenas usuários autenticados).</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-surface border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                            <Heart size={13} className="text-muted" />
                            <h3 className="text-xs font-bold text-foreground">Engajamento por Tipo — 30 dias</h3>
                        </div>
                        <div className="p-4">
                            {(data?.activityByType30d.length ?? 0) > 0 ? (
                                <div className="space-y-2">
                                    {data!.activityByType30d.map(act => {
                                        const total = data!.activityByType30d.reduce((s, a) => s + a._count.id, 0)
                                        const pct   = total > 0 ? (act._count.id / total) * 100 : 0
                                        return (
                                            <div key={act.type} className="flex items-center gap-3">
                                                <span className="text-[11px] font-black uppercase tracking-wider text-muted w-24 shrink-0">{act.type}</span>
                                                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                                                    <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${pct}%` }} />
                                                </div>
                                                <span className="text-[11px] text-muted w-12 text-right shrink-0">{act._count.id.toLocaleString('pt-BR')}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted">Nenhum evento registrado nos últimos 30 dias.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* ── Google Analytics 4 ── */}
                <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2">
                        <Globe size={14} className="text-blue-400" />
                        <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Google Analytics 4 — 30 dias</h2>
                        {ga4Loading && <Loader2 size={12} className="animate-spin text-muted" />}
                    </div>

                    {ga4 && (
                        <>
                            {/* Métricas GA4 */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatCard icon={Users}    label="Usuários (GA4)"    value={ga4.metrics.users}     color="text-blue-400"   bg="bg-blue-500/5" />
                                <StatCard icon={Eye}      label="Pageviews (GA4)"   value={ga4.metrics.pageviews} color="text-cyan-400"   bg="bg-cyan-500/5" />
                                <StatCard icon={BarChart3} label="Sessões (GA4)"    value={ga4.metrics.sessions}  color="text-purple-400" bg="bg-purple-500/5" />
                                <StatCard icon={Globe}    label="Ativos agora"      value={ga4.activeUsers}       color="text-green-400"  bg="bg-green-500/5"
                                    sub={`${Math.round(ga4.metrics.avgSessionDuration / 60)}min avg sessão`} />
                            </div>

                            {/* Top páginas por seção */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {([
                                    { label: 'Top Blog (tráfego real)', items: ga4.blogPosts,   icon: BookOpen,   href: '/blog/' },
                                    { label: 'Top Produções (tráfego real)', items: ga4.productions, icon: Newspaper, href: '/productions/' },
                                    { label: 'Top Artistas (tráfego real)', items: ga4.artists,    icon: Music2,    href: '/artists/' },
                                ] as const).map(({ label, items, icon: Icon }) => (
                                    <section key={label} className="bg-surface border border-border rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                                            <Icon size={13} className="text-blue-400" />
                                            <h3 className="text-xs font-bold text-foreground">{label}</h3>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {items.length === 0 && (
                                                <p className="text-sm text-muted p-4">Sem dados</p>
                                            )}
                                            {items.map((page, i) => {
                                                const slug = page.path.split('/').filter(Boolean).pop() ?? ''
                                                return (
                                                    <div key={page.path} className="flex items-center gap-3 px-4 py-2.5">
                                                        <span className="text-[11px] font-black text-muted w-4 shrink-0">{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={page.path} target="_blank" className="text-xs font-medium text-foreground hover:text-accent truncate block">
                                                                {slug}
                                                            </Link>
                                                        </div>
                                                        <span className="text-[11px] font-black text-blue-400 shrink-0">{page.pageviews.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </>
                    )}

                    {!ga4 && !ga4Loading && (
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted">
                                {ga4Error ? `GA4 erro: ${ga4Error}` : 'GA4 não disponível.'}
                            </p>
                            <button onClick={loadGa4} className="text-xs text-accent underline">Tentar novamente</button>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    )
}
