'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Search, Eye, Newspaper, Music2, Users,
    BarChart3, RefreshCw, BookOpen, UserPlus, Loader2, Heart,
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

interface AnalyticsData {
    timeseries: TimeseriesRow[]
    topBlog:    { id: string; slug: string; title: string; viewCount: number; coverImageUrl: string | null; publishedAt: string | null; category: { name: string } | null }[]
    topArtists: { id: string; nameRomanized: string; viewCount: number; trendingScore: number; primaryImageUrl: string | null }[]
    topNews:    { id: string; title: string; viewCount: number; source: string | null; publishedAt: string }[]
    topGroups:  { id: string; name: string; viewCount: number; trendingScore: number; profileImageUrl: string | null }[]
    totals:     { blog: number; artist: number; news: number; group: number }
    users:      { total: number; new7d: number; new30d: number }
    published7d: { posts: number; news: number }
    activityByType30d: { type: string; _count: { id: number } }[]
    topSearchTerms:    { term: string; count: number }[]
}

type Period = '7' | '30' | '90'

// ─── Bar Chart (CSS) ──────────────────────────────────────────────────────────

function BarChart({ data, height = 120 }: { data: TimeseriesRow[]; height?: number }) {
    const max = Math.max(...data.map(d => d.total), 1)

    // Show fewer labels on small datasets
    const labelEvery = data.length <= 7 ? 1 : data.length <= 30 ? 7 : 14

    return (
        <div className="space-y-2">
            <div className="flex items-end gap-px" style={{ height }}>
                {data.map((row) => {
                    const pct = (row.total / max) * 100
                    // Stacked: blog | artist | news | group
                    const blogPct   = row.total > 0 ? (row.blog   / row.total) * pct : 0
                    const artistPct = row.total > 0 ? (row.artist / row.total) * pct : 0
                    const newsPct   = row.total > 0 ? (row.news   / row.total) * pct : 0
                    const groupPct  = row.total > 0 ? (row.group  / row.total) * pct : 0

                    return (
                        <div
                            key={row.date}
                            className="flex-1 flex flex-col justify-end group relative"
                            style={{ height: '100%' }}
                            title={`${new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR')}\nTotal: ${row.total.toLocaleString('pt-BR')}\nBlog: ${row.blog} · Artistas: ${row.artist} · Notícias: ${row.news} · Grupos: ${row.group}`}
                        >
                            <div className="w-full flex flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${pct}%`, minHeight: row.total > 0 ? 2 : 0 }}>
                                <div style={{ height: `${groupPct / pct * 100}%` }}  className="bg-purple-500/70" />
                                <div style={{ height: `${newsPct  / pct * 100}%` }}  className="bg-green-500/70" />
                                <div style={{ height: `${artistPct / pct * 100}%` }} className="bg-blue-500/70" />
                                <div style={{ height: `${blogPct  / pct * 100}%` }}  className="bg-orange-500/70" />
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                                <div className="bg-background border border-border rounded-lg px-2 py-1.5 text-[10px] whitespace-nowrap shadow-xl">
                                    <p className="font-bold text-foreground">{row.total.toLocaleString('pt-BR')} views</p>
                                    <p className="text-muted">{new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
            {/* Date labels */}
            <div className="flex items-center" style={{ gap: 0 }}>
                {data.map((row, i) => (
                    <div key={row.date} className="flex-1 text-center">
                        {i % labelEvery === 0 && (
                            <span className="text-[9px] text-muted">
                                {new Date(row.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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

function TopListRow({ rank, image, title, href, views, maxViews, sub }: {
    rank: number; image: string | null; title: string; href: string
    views: number; maxViews: number; sub?: string
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
                {/* Mini bar */}
                <div className="mt-1 h-1 bg-border rounded-full overflow-hidden w-full">
                    <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${(views / maxViews) * 100}%` }} />
                </div>
            </div>
            <span className="text-[11px] text-muted flex items-center gap-1 shrink-0">
                <Eye size={10} />
                {views.toLocaleString('pt-BR')}
            </span>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
    const [period,  setPeriod]  = useState<Period>('30')
    const [data,    setData]    = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    const load = useCallback(async (p: Period) => {
        setLoading(true)
        try {
            const res  = await fetch(`/api/admin/analytics?days=${p}`)
            const json = await res.json()
            setData(json)
        } catch {
            // silently fail — keep old data
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load(period) }, [period, load])

    const totalAllTime = data ? Object.values(data.totals).reduce((a, b) => a + b, 0) : 0
    const totalPeriod  = data ? data.timeseries.reduce((a, b) => a + b.total, 0) : 0

    return (
        <AdminLayout title="Analytics" subtitle="Views, usuários e performance de conteúdo">
            <div className="space-y-6">

                {/* Period selector */}
                <div className="flex items-center gap-1.5">
                    {(['7', '30', '90'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                                period === p
                                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                    : 'text-muted border-border hover:text-foreground'
                            }`}
                        >
                            {p === '7' ? '7 dias' : p === '30' ? '30 dias' : '90 dias'}
                        </button>
                    ))}
                    {loading && <Loader2 size={14} className="animate-spin text-muted ml-2" />}
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
                    <StatCard icon={Eye}      label="Views (all-time)" value={totalAllTime}            color="text-foreground" />
                    <StatCard icon={BarChart3} label={`Views (${period}d)`} value={totalPeriod}          color="text-blue-400"   bg="bg-blue-500/5 border-blue-500/20" />
                    <StatCard icon={BookOpen} label="Views blog"        value={data?.totals.blog   ?? 0} color="text-orange-400" />
                    <StatCard icon={Music2}   label="Views artistas"   value={data?.totals.artist ?? 0} color="text-purple-400" />
                    <StatCard icon={Newspaper} label="Views notícias"  value={data?.totals.news   ?? 0} color="text-green-400"  />
                    <StatCard icon={Users}    label="Usuários"          value={data?.users.total   ?? 0} sub={data ? `+${data.users.new7d} esta semana` : undefined} color="text-cyan-400" />
                </div>

                {/* Second row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCard icon={UserPlus}  label="Novos usuários (7d)"  value={data?.users.new7d  ?? 0} color="text-cyan-400" />
                    <StatCard icon={UserPlus}  label="Novos usuários (30d)" value={data?.users.new30d ?? 0} color="text-cyan-400" />
                    <StatCard icon={BookOpen}  label="Posts publicados (7d)" value={data?.published7d.posts ?? 0} color="text-orange-400" />
                    <StatCard icon={Newspaper} label="Notícias publicadas (7d)" value={data?.published7d.news ?? 0} color="text-green-400" />
                </div>

                {/* Chart */}
                <section className="bg-surface border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="text-xs font-bold text-foreground">Views por dia — últimos {period} dias</h3>
                        <div className="flex items-center gap-3 text-[10px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/70" />Blog</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/70" />Artistas</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/70" />Notícias</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-purple-500/70" />Grupos</span>
                        </div>
                    </div>
                    {data && data.timeseries.length > 0 ? (
                        <BarChart data={data.timeseries} height={140} />
                    ) : (
                        <div className="flex items-center justify-center h-[140px] text-muted text-sm">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Nenhum dado de views ainda — os dados aparecem após as primeiras visitas.'}
                        </div>
                    )}
                </section>

                {/* Top content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Top Blog */}
                    <TopList
                        items={data?.topBlog ?? []}
                        title="Top Blog Posts (all-time)"
                        icon={BookOpen}
                        emptyMsg="Nenhum post publicado ainda"
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
                            />
                        )}
                    />

                    {/* Top Artistas */}
                    <TopList
                        items={data?.topArtists ?? []}
                        title="Top Artistas — Views"
                        icon={Music2}
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
                            />
                        )}
                    />

                    {/* Top Notícias */}
                    <TopList
                        items={data?.topNews ?? []}
                        title="Top Notícias — Views"
                        icon={Newspaper}
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
                            />
                        )}
                    />

                    {/* Top Grupos */}
                    <TopList
                        items={data?.topGroups ?? []}
                        title="Top Grupos — Views"
                        icon={Users}
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
                            />
                        )}
                    />
                </div>

                {/* Buscas + Engajamento */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Buscas populares */}
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

                    {/* Engajamento por tipo */}
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

            </div>
        </AdminLayout>
    )
}
