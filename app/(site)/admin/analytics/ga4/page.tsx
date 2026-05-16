'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RefreshCw, Loader2, Globe, Monitor, TrendingUp, Users, Eye, Clock, ArrowUpRight, Search, LogOut, ExternalLink } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

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

type Days = '7' | '30' | '90'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
}

function fmtDuration(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.round(seconds % 60)
    return m > 0 ? `${m}m${s > 0 ? ` ${s}s` : ''}` : `${s}s`
}

function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%` }

function shortPath(path: string) {
    return path.length > 45 ? path.slice(0, 42) + '…' : path
}

// ─── Mini components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
    label: string; value: string | number; sub?: string
    icon: React.ElementType; accent?: boolean
}) {
    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-1 ${accent ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
            <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-wide">
                <Icon size={12} /> {label}
            </div>
            <div className={`text-2xl font-black ${accent ? 'text-accent' : 'text-foreground'}`}>{typeof value === 'number' ? fmt(value) : value}</div>
            {sub && <div className="text-muted text-xs">{sub}</div>}
        </div>
    )
}

function HBarChart({ rows, max, valueKey, labelKey, colorClass = 'bg-accent' }: {
    rows: Record<string, unknown>[]; max: number; valueKey: string; labelKey: string; colorClass?: string
}) {
    return (
        <div className="space-y-2">
            {rows.map((row, i) => {
                const val = Number(row[valueKey] ?? 0)
                const pct = max > 0 ? (val / max) * 100 : 0
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-32 shrink-0 text-xs text-muted truncate">{String(row[labelKey] ?? '')}</div>
                        <div className="flex-1 h-5 bg-surface-hover rounded overflow-hidden">
                            <div className={`h-full ${colorClass} rounded transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-12 text-xs text-right font-mono text-foreground">{fmt(val)}</div>
                    </div>
                )
            })}
        </div>
    )
}

function DonutChart({ slices, size = 80 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
    const total = slices.reduce((s, sl) => s + sl.value, 0)
    if (total === 0) return null
    const r = size / 2 - 8
    const circ = 2 * Math.PI * r
    let offset = 0
    const paths = slices.map(sl => {
        const frac = sl.value / total
        const dash = frac * circ
        const path = { dash, offset: circ - offset, color: sl.color, label: sl.label, pct: Math.round(frac * 100) }
        offset += dash
        return path
    })

    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-hover)" strokeWidth={10} />
                {paths.map((p, i) => (
                    <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
                        stroke={p.color} strokeWidth={10}
                        strokeDasharray={`${p.dash} ${circ - p.dash}`}
                        strokeDashoffset={p.offset} />
                ))}
            </svg>
            <div className="space-y-1">
                {slices.map((sl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sl.color }} />
                        <span className="text-muted">{sl.label}</span>
                        <span className="font-bold text-foreground ml-auto">{paths[i].pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SectionTable({ rows }: { rows: Ga4Section[] }) {
    const maxPv = Math.max(...rows.map(r => r.pageviews), 1)
    const COLORS: Record<string, string> = {
        '/artists': '#ff2d78', '/blog': '#3b82f6', '/productions': '#f59e0b',
        '/groups': '#8b5cf6', '/news': '#10b981', '/calendario': '#06b6d4', '/loja': '#f97316',
    }
    return (
        <div className="space-y-2">
            {rows.map(r => (
                <div key={r.section} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-xs font-mono text-muted">{r.section}</div>
                    <div className="flex-1 h-6 bg-surface-hover rounded overflow-hidden relative">
                        <div className="h-full rounded transition-all opacity-80"
                            style={{ width: `${(r.pageviews / maxPv) * 100}%`, background: COLORS[r.section] ?? '#888' }} />
                        <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-mono text-foreground/70">
                            {fmtPct(r.engagementRate)} eng · {fmtDuration(r.avgDuration)}
                        </span>
                    </div>
                    <div className="w-14 text-xs text-right font-mono text-foreground">{fmt(r.pageviews)}</div>
                </div>
            ))}
        </div>
    )
}

function TopList({ items, valueKey, labelKey, href }: {
    items: Record<string, unknown>[]; valueKey: string; labelKey: string; href?: (item: Record<string, unknown>) => string
}) {
    const max = Math.max(...items.map(i => Number(i[valueKey] ?? 0)), 1)
    return (
        <div className="space-y-1.5">
            {items.map((item, i) => {
                const val = Number(item[valueKey] ?? 0)
                const label = String(item[labelKey] ?? '')
                const url = href?.(item)
                return (
                    <div key={i} className="group flex items-center gap-2">
                        <span className="text-muted/50 text-[10px] font-mono w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                            <div className="relative h-6 bg-surface-hover rounded overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-accent/20 rounded transition-all"
                                    style={{ width: `${(val / max) * 100}%` }} />
                                <span className="absolute inset-y-0 left-2 right-2 flex items-center text-xs text-foreground truncate">
                                    {url ? (
                                        <a href={`https://www.hallyuhub.com.br${url}`} target="_blank" rel="noopener"
                                            className="hover:text-accent transition-colors flex items-center gap-1 truncate">
                                            {shortPath(label)} <ExternalLink size={9} className="shrink-0 opacity-0 group-hover:opacity-100" />
                                        </a>
                                    ) : label}
                                </span>
                            </div>
                        </div>
                        <span className="w-12 text-xs text-right font-mono text-muted">{fmt(val)}</span>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Ga4AnalyticsPage() {
    const [days, setDays] = useState<Days>('30')
    const [data, setData] = useState<Ga4Data | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const load = useCallback((d: Days) => {
        setLoading(true)
        setError(null)
        fetch(`/api/admin/analytics/ga4?days=${d}`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => { if (d.error) setError(d.error); else setData(d) })
            .catch(e => setError(e.message ?? 'Erro'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load(days) }, [days, load])

    const deviceColors: Record<string, string> = { mobile: '#ff2d78', desktop: '#3b82f6', tablet: '#f59e0b' }
    const nvRColors: Record<string, string> = { new: '#10b981', returning: '#8b5cf6' }
    const channelColors = ['#ff2d78','#3b82f6','#f59e0b','#10b981','#8b5cf6','#f97316','#06b6d4','#ec4899']

    const deviceSlices = (data?.devices ?? []).map(d => ({
        label: d.device, value: d.users, color: deviceColors[d.device.toLowerCase()] ?? '#888'
    }))
    const nvRSlices = (data?.newVsReturning ?? []).map(d => ({
        label: d.type === 'new' ? 'Novos' : 'Recorrentes', value: d.users, color: nvRColors[d.type] ?? '#888'
    }))

    return (
        <AdminLayout title="Google Analytics 4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Google Analytics 4</h1>
                        <p className="text-muted text-sm mt-0.5">Tráfego real e comportamento dos usuários</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                            {(['7','30','90'] as Days[]).map(d => (
                                <button key={d} onClick={() => setDays(d)}
                                    className={`px-3 py-1.5 font-medium transition-colors ${days === d ? 'bg-accent text-white' : 'text-muted hover:text-foreground'}`}>
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <button onClick={() => load(days)} disabled={loading}
                            className="p-2 rounded-lg border border-border text-muted hover:text-foreground transition-colors disabled:opacity-50">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <Link href="/admin/analytics" className="text-xs text-muted hover:text-foreground transition-colors">← Voltar</Link>
                    </div>
                </div>

                {loading && !data && (
                    <div className="flex items-center justify-center py-20 gap-2 text-muted">
                        <Loader2 size={18} className="animate-spin" /> Carregando dados GA4...
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                        {error} — <button onClick={() => load(days)} className="underline">tentar novamente</button>
                    </div>
                )}

                {data && (
                    <>
                        {/* Métricas principais */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <StatCard icon={Users}    label="Ativos agora"  value={data.activeUsers}              sub="tempo real"             accent />
                            <StatCard icon={Users}    label="Usuários"       value={data.metrics.users}            sub={`${days} dias`} />
                            <StatCard icon={TrendingUp} label="Sessões"      value={data.metrics.sessions}         sub={`${days} dias`} />
                            <StatCard icon={Eye}      label="Pageviews"      value={data.metrics.pageviews}        sub={`${days} dias`} />
                            <StatCard icon={Clock}    label="Duração média"  value={fmtDuration(data.metrics.avgSessionDuration)} sub="por sessão" />
                            <StatCard icon={ArrowUpRight} label="Rejeição"  value={fmtPct(data.metrics.bounceRate)} sub="bounce rate" />
                        </div>

                        {/* Engajamento por seção */}
                        {data.sectionEngagement.length > 0 && (
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <h2 className="text-sm font-bold text-foreground">Engajamento por Seção</h2>
                                <SectionTable rows={data.sectionEngagement} />
                            </div>
                        )}

                        {/* Dispositivos + Novos vs Recorrentes + Fontes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Monitor size={14} /> Dispositivos
                                </div>
                                <DonutChart slices={deviceSlices} />
                                <div className="space-y-1 pt-1">
                                    {data.devices.map(d => (
                                        <div key={d.device} className="flex items-center justify-between text-xs">
                                            <span className="text-muted capitalize">{d.device}</span>
                                            <div className="flex gap-3">
                                                <span className="text-muted">{fmt(d.sessions)} sess.</span>
                                                <span className="font-mono font-bold text-foreground">{fmt(d.users)} users</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Users size={14} /> Novos vs Recorrentes
                                </div>
                                <DonutChart slices={nvRSlices} />
                                <div className="space-y-1 pt-1">
                                    {data.newVsReturning.map(d => (
                                        <div key={d.type} className="flex items-center justify-between text-xs">
                                            <span className="text-muted">{d.type === 'new' ? 'Novos' : 'Recorrentes'}</span>
                                            <div className="flex gap-3">
                                                <span className="text-muted">{fmt(d.sessions)} sess.</span>
                                                <span className="font-mono font-bold text-foreground">{fmt(d.users)} users</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Globe size={14} /> Fontes de Tráfego
                                </div>
                                <div className="space-y-2">
                                    {data.sources.map((s, i) => {
                                        const maxS = Math.max(...data.sources.map(x => x.sessions), 1)
                                        return (
                                            <div key={i} className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: channelColors[i] ?? '#888' }} />
                                                <span className="flex-1 text-xs text-muted truncate">{s.channel}</span>
                                                <div className="w-20 h-4 bg-surface-hover rounded overflow-hidden">
                                                    <div className="h-full rounded" style={{ width: `${(s.sessions / maxS) * 100}%`, background: channelColors[i] ?? '#888' }} />
                                                </div>
                                                <span className="w-10 text-xs text-right font-mono text-foreground">{fmt(s.sessions)}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Países */}
                        {data.countries.length > 0 && (
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Globe size={14} /> Top Países
                                </div>
                                <HBarChart
                                    rows={data.countries as unknown as Record<string, unknown>[]}
                                    max={Math.max(...data.countries.map(c => c.users), 1)}
                                    valueKey="users" labelKey="country" colorClass="bg-accent/60"
                                />
                            </div>
                        )}

                        {/* Termos de busca interna */}
                        {data.searchTerms.length > 0 && (
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <Search size={14} /> Termos Buscados no Site
                                </div>
                                <HBarChart
                                    rows={data.searchTerms as unknown as Record<string, unknown>[]}
                                    max={Math.max(...data.searchTerms.map(t => t.sessions), 1)}
                                    valueKey="sessions" labelKey="term" colorClass="bg-blue-500/60"
                                />
                            </div>
                        )}

                        {/* Top listas em grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: 'Top Blog (GA4)', items: data.blogPosts, key: 'path' },
                                { title: 'Top Artistas (GA4)', items: data.artists, key: 'path' },
                                { title: 'Top Produções (GA4)', items: data.productions, key: 'path' },
                            ].map(({ title, items, key }) => (
                                <div key={title} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <h2 className="text-sm font-bold text-foreground">{title}</h2>
                                    <TopList
                                        items={items as unknown as Record<string, unknown>[]}
                                        valueKey="pageviews" labelKey={key}
                                        href={item => String(item.path ?? '')}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Landing Pages + Páginas de Saída */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <ArrowUpRight size={14} /> Páginas de Entrada
                                    <span className="text-muted text-xs font-normal ml-auto">onde usuários chegam</span>
                                </div>
                                <TopList
                                    items={data.landingPages as unknown as Record<string, unknown>[]}
                                    valueKey="sessions" labelKey="path"
                                    href={item => String(item.path ?? '')}
                                />
                            </div>
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <LogOut size={14} /> Páginas de Saída
                                    <span className="text-muted text-xs font-normal ml-auto">onde usuários saem</span>
                                </div>
                                <TopList
                                    items={data.exitPages as unknown as Record<string, unknown>[]}
                                    valueKey="sessions" labelKey="path"
                                    href={item => String(item.path ?? '')}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
