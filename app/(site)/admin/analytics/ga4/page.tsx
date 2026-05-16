'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { RefreshCw, Loader2, Globe, Monitor, TrendingUp, Users, Eye, Clock, ArrowUpRight, Search, ExternalLink, BarChart2, Target, Zap } from 'lucide-react'
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
interface Ga4Daily   { date: string; sessions: number; users: number; pageviews: number }
interface GscRow     { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface GscDaily   { date: string; clicks: number; impressions: number }
interface GscTotals  { clicks: number; impressions: number; avgCtr: number; avgPosition: number }
interface GscData {
    topQueries:    GscRow[]
    topPages:      GscRow[]
    dailyTrend:    GscDaily[]
    countries:     GscRow[]
    devices:       GscRow[]
    opportunities: GscRow[]
    totals:        GscTotals
}
interface Ga4Data {
    metrics:           Ga4Metrics
    prevMetrics:       Ga4Metrics
    dailyTrend:        Ga4Daily[]
    activeUsers:       number
    blogPosts:         Ga4Page[]
    productions:       Ga4Page[]
    artists:           Ga4Page[]
    countries:         Ga4Country[]
    devices:           Ga4Device[]
    sources:           Ga4Source[]
    newVsReturning:    Ga4NvR[]
    searchTerms:       Ga4Search[]
    sectionEngagement: Ga4Section[]
    landingPages:      Ga4Page[]
    gsc:               GscData | null
    days:              number
}

type Days = '7' | '30' | '90'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return String(n)
}
function fmtDuration(s: number) {
    const m = Math.floor(s / 60); const sec = Math.round(s % 60)
    return m > 0 ? `${m}m${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`
}
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%` }
function shortPath(path: string) { return path.length > 45 ? path.slice(0, 42) + '…' : path }
function delta(curr: number, prev: number) {
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
}

// ─── Mini components ──────────────────────────────────────────────────────────

function DeltaBadge({ pct }: { pct: number | null }) {
    if (pct === null) return null
    const up = pct >= 0
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
        </span>
    )
}

function StatCard({ label, value, sub, icon: Icon, accent = false, pct }: {
    label: string; value: string | number; sub?: string; icon: React.ElementType; accent?: boolean; pct?: number | null
}) {
    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-1 ${accent ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
            <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-wide">
                <Icon size={12} /> {label}
            </div>
            <div className={`text-2xl font-black ${accent ? 'text-accent' : 'text-foreground'}`}>{typeof value === 'number' ? fmt(value) : value}</div>
            <div className="flex items-center gap-2">
                {sub && <div className="text-muted text-xs">{sub}</div>}
                {pct !== undefined && <DeltaBadge pct={pct ?? null} />}
            </div>
        </div>
    )
}

function LineChart({ data, keys, colors, height = 80 }: {
    data: Record<string, number | string>[]; keys: string[]; colors: string[]; height?: number
}) {
    if (data.length < 2) return null
    const W = 600; const H = height
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => Number(d[k] ?? 0))), 1)
    const xStep = W / (data.length - 1)
    const yScale = (v: number) => H - (v / maxVal) * H * 0.9 - H * 0.05

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={0} y1={H * (1 - f) * 0.9 + H * 0.05} x2={W} y2={H * (1 - f) * 0.9 + H * 0.05}
                    stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} />
            ))}
            {keys.map((k, ki) => {
                const pts = data.map((d, i) => `${i * xStep},${yScale(Number(d[k] ?? 0))}`).join(' ')
                const fillPts = `0,${H} ${pts} ${(data.length - 1) * xStep},${H}`
                return (
                    <g key={k}>
                        <polygon points={fillPts} fill={colors[ki]} fillOpacity={0.08} />
                        <polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                    </g>
                )
            })}
        </svg>
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
    const r = size / 2 - 8; const circ = 2 * Math.PI * r
    let offset = 0
    const paths = slices.map(sl => {
        const frac = sl.value / total; const dash = frac * circ
        const path = { dash, offset: circ - offset, color: sl.color, label: sl.label, pct: Math.round(frac * 100) }
        offset += dash; return path
    })
    return (
        <div className="flex items-center gap-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-hover)" strokeWidth={10} />
                {paths.map((p, i) => (
                    <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={p.color} strokeWidth={10}
                        strokeDasharray={`${p.dash} ${circ - p.dash}`} strokeDashoffset={p.offset} />
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

function GscTable({ rows, keyLabel = 'Query', isPage = false }: { rows: GscRow[]; keyLabel?: string; isPage?: boolean }) {
    return (
        <div className="space-y-1">
            <div className="grid grid-cols-[1fr_56px_76px_52px_48px] text-[10px] text-muted font-semibold uppercase tracking-wide pb-1 border-b border-border">
                <span>{keyLabel}</span>
                <span className="text-right">Cliques</span>
                <span className="text-right">Impressões</span>
                <span className="text-right">CTR</span>
                <span className="text-right">Pos.</span>
            </div>
            {rows.map((row, i) => {
                const displayKey = isPage ? row.key.replace('https://www.hallyuhub.com.br', '') || '/' : row.key
                return (
                    <div key={i} className="group grid grid-cols-[1fr_56px_76px_52px_48px] text-xs py-0.5 hover:bg-surface-hover rounded px-1 transition-colors">
                        <span className="text-foreground truncate flex items-center gap-1">
                            {isPage ? (
                                <a href={row.key} target="_blank" rel="noopener" className="hover:text-accent transition-colors truncate">
                                    {shortPath(displayKey)}
                                </a>
                            ) : displayKey}
                            {isPage && <ExternalLink size={8} className="shrink-0 opacity-0 group-hover:opacity-60" />}
                        </span>
                        <span className="text-right font-mono text-accent font-bold">{fmt(row.clicks)}</span>
                        <span className="text-right font-mono text-muted">{fmt(row.impressions)}</span>
                        <span className="text-right font-mono text-muted">{(row.ctr * 100).toFixed(1)}%</span>
                        <span className={`text-right font-mono font-bold ${row.position <= 3 ? 'text-green-400' : row.position <= 10 ? 'text-yellow-400' : 'text-muted'}`}>
                            #{row.position.toFixed(0)}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function SectionHeader({ icon: Icon, title, sub, color = 'text-foreground', border = 'border-border' }: {
    icon: React.ElementType; title: string; sub?: string; color?: string; border?: string
}) {
    return (
        <div className={`flex items-center gap-3 pb-3 border-b ${border}`}>
            <div className={`p-2 rounded-lg bg-surface-hover ${color}`}>
                <Icon size={16} />
            </div>
            <div>
                <h2 className={`text-base font-black ${color}`}>{title}</h2>
                {sub && <p className="text-xs text-muted">{sub}</p>}
            </div>
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
        setLoading(true); setError(null)
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

    const deviceSlices = (data?.devices ?? []).map(d => ({ label: d.device, value: d.users, color: deviceColors[d.device.toLowerCase()] ?? '#888' }))
    const nvRSlices = (data?.newVsReturning ?? []).map(d => ({ label: d.type === 'new' ? 'Novos' : 'Recorrentes', value: d.users, color: nvRColors[d.type] ?? '#888' }))

    const m = data?.metrics; const p = data?.prevMetrics

    return (
        <AdminLayout title="Analytics">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-foreground">Analytics</h1>
                        <p className="text-muted text-sm mt-0.5">Google Analytics 4 + Search Console</p>
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
                        <Loader2 size={18} className="animate-spin" /> Carregando dados...
                    </div>
                )}
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
                        {error} — <button onClick={() => load(days)} className="underline">tentar novamente</button>
                    </div>
                )}

                {data && (
                    <>
                        {/* ══════════════════════════════════════════════════════
                            SEÇÃO 1 — GOOGLE ANALYTICS 4
                        ══════════════════════════════════════════════════════ */}
                        <section className="space-y-6">
                            <SectionHeader
                                icon={BarChart2}
                                title="Google Analytics 4"
                                sub={`Tráfego e comportamento dos últimos ${days} dias vs período anterior`}
                                color="text-blue-400"
                                border="border-blue-500/20"
                            />

                            {/* KPIs com comparação */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <StatCard icon={Users}       label="Ativos agora"  value={data.activeUsers} sub="tempo real" accent />
                                <StatCard icon={Users}       label="Usuários"       value={m!.users}         sub={`${days} dias`} pct={delta(m!.users, p!.users)} />
                                <StatCard icon={TrendingUp}  label="Sessões"        value={m!.sessions}      sub={`${days} dias`} pct={delta(m!.sessions, p!.sessions)} />
                                <StatCard icon={Eye}         label="Pageviews"      value={m!.pageviews}     sub={`${days} dias`} pct={delta(m!.pageviews, p!.pageviews)} />
                                <StatCard icon={Clock}       label="Duração média"  value={fmtDuration(m!.avgSessionDuration)} sub="por sessão" pct={delta(m!.avgSessionDuration, p!.avgSessionDuration)} />
                                <StatCard icon={ArrowUpRight} label="Rejeição"      value={fmtPct(m!.bounceRate)} sub="bounce rate" pct={delta(m!.bounceRate, p!.bounceRate) !== null ? -(delta(m!.bounceRate, p!.bounceRate)!) : null} />
                            </div>

                            {/* Trend diário GA4 */}
                            {data.dailyTrend.length > 1 && (
                                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-foreground">Tendência Diária</h3>
                                        <div className="flex items-center gap-3 text-xs text-muted">
                                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#3b82f6] inline-block" /> Sessões</span>
                                            <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#ff2d78] inline-block" /> Usuários</span>
                                        </div>
                                    </div>
                                    <LineChart data={data.dailyTrend as unknown as Record<string, number | string>[]} keys={['sessions','users']} colors={['#3b82f6','#ff2d78']} height={100} />
                                    <div className="flex justify-between text-[10px] text-muted font-mono">
                                        <span>{data.dailyTrend[0]?.date.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3')}</span>
                                        <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3')}</span>
                                    </div>
                                </div>
                            )}

                            {/* Dispositivos + Novos vs Recorrentes + Fontes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Monitor size={14} /> Dispositivos</div>
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
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Users size={14} /> Novos vs Recorrentes</div>
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
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Globe size={14} /> Fontes de Tráfego</div>
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

                            {/* Engajamento por seção */}
                            {data.sectionEngagement.length > 0 && (
                                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <h3 className="text-sm font-bold text-foreground">Engajamento por Seção</h3>
                                    <SectionTable rows={data.sectionEngagement} />
                                </div>
                            )}

                            {/* Países */}
                            {data.countries.length > 0 && (
                                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Globe size={14} /> Top Países</div>
                                    <HBarChart rows={data.countries as unknown as Record<string, unknown>[]} max={Math.max(...data.countries.map(c => c.users), 1)} valueKey="users" labelKey="country" colorClass="bg-accent/60" />
                                </div>
                            )}

                            {/* Termos buscados no site */}
                            {data.searchTerms.length > 0 && (
                                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Search size={14} /> Termos Buscados no Site</div>
                                    <HBarChart rows={data.searchTerms as unknown as Record<string, unknown>[]} max={Math.max(...data.searchTerms.map(t => t.sessions), 1)} valueKey="sessions" labelKey="term" colorClass="bg-blue-500/60" />
                                </div>
                            )}

                            {/* Top conteúdo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[
                                    { title: 'Top Blog', items: data.blogPosts },
                                    { title: 'Top Artistas', items: data.artists },
                                    { title: 'Top Produções', items: data.productions },
                                ].map(({ title, items }) => (
                                    <div key={title} className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground">{title}</h3>
                                        <TopList items={items as unknown as Record<string, unknown>[]} valueKey="pageviews" labelKey="path" href={item => String(item.path ?? '')} />
                                    </div>
                                ))}
                            </div>

                            {/* Landing Pages */}
                            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                    <ArrowUpRight size={14} /> Páginas de Entrada
                                    <span className="text-muted text-xs font-normal ml-auto">onde usuários chegam</span>
                                </div>
                                <TopList items={data.landingPages as unknown as Record<string, unknown>[]} valueKey="sessions" labelKey="path" href={item => String(item.path ?? '')} />
                            </div>
                        </section>

                        {/* ══════════════════════════════════════════════════════
                            SEÇÃO 2 — GOOGLE SEARCH CONSOLE
                        ══════════════════════════════════════════════════════ */}
                        {data.gsc ? (
                            <section className="space-y-6">
                                <SectionHeader
                                    icon={Search}
                                    title="Google Search Console"
                                    sub={`Cliques e impressões orgânicas dos últimos ${days} dias`}
                                    color="text-green-400"
                                    border="border-green-500/20"
                                />

                                {/* Totais GSC */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <StatCard icon={Target}    label="Cliques"       value={data.gsc.totals.clicks}      sub="orgânicos" />
                                    <StatCard icon={Eye}       label="Impressões"     value={data.gsc.totals.impressions}  sub="busca Google" />
                                    <StatCard icon={TrendingUp} label="CTR médio"     value={fmtPct(data.gsc.totals.avgCtr)} sub="cliques/impressões" />
                                    <StatCard icon={ArrowUpRight} label="Posição média" value={`#${data.gsc.totals.avgPosition.toFixed(1)}`} sub="ranking médio" />
                                </div>

                                {/* Trend diário GSC */}
                                {data.gsc.dailyTrend.length > 1 && (
                                    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-foreground">Tendência Diária — Busca Orgânica</h3>
                                            <div className="flex items-center gap-3 text-xs text-muted">
                                                <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#10b981] inline-block" /> Cliques</span>
                                                <span className="flex items-center gap-1"><span className="w-2 h-0.5 bg-[#6b7280] inline-block" /> Impressões</span>
                                            </div>
                                        </div>
                                        <LineChart data={data.gsc.dailyTrend as unknown as Record<string, number | string>[]} keys={['clicks','impressions']} colors={['#10b981','#6b7280']} height={100} />
                                        <div className="flex justify-between text-[10px] text-muted font-mono">
                                            <span>{data.gsc.dailyTrend[0]?.date}</span>
                                            <span>{data.gsc.dailyTrend[data.gsc.dailyTrend.length - 1]?.date}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Oportunidades SEO */}
                                {data.gsc.opportunities.length > 0 && (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-amber-400" />
                                            <h3 className="text-sm font-bold text-amber-300">Oportunidades de SEO</h3>
                                            <span className="text-xs text-muted ml-1">— queries posição 4–30 com alta impressão (fácil de subir)</span>
                                        </div>
                                        <GscTable rows={data.gsc.opportunities} />
                                    </div>
                                )}

                                {/* Top Queries + Top Páginas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground">Top Queries</h3>
                                        <GscTable rows={data.gsc.topQueries} />
                                    </div>
                                    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <h3 className="text-sm font-bold text-foreground">Top Páginas</h3>
                                        <GscTable rows={data.gsc.topPages} keyLabel="Página" isPage />
                                    </div>
                                </div>

                                {/* Países + Dispositivos GSC */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Globe size={14} /> Países (busca orgânica)</div>
                                        <GscTable rows={data.gsc.countries} keyLabel="País" />
                                    </div>
                                    <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                                        <div className="flex items-center gap-2 text-sm font-bold text-foreground"><Monitor size={14} /> Dispositivos (busca orgânica)</div>
                                        <GscTable rows={data.gsc.devices} keyLabel="Dispositivo" />
                                    </div>
                                </div>
                            </section>
                        ) : (
                            <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted text-sm">
                                Search Console não disponível — configure o scope <code>webmasters.readonly</code> no token OAuth.
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
