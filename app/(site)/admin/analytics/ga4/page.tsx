'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    RefreshCw, Globe, Monitor, TrendingUp, Users, Eye, Clock,
    ArrowUpRight, Search, ExternalLink, BarChart2, Target, Zap, Activity,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ga4Metrics  { sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionDuration: number }
interface Ga4Page     { path: string; title?: string; pageviews: number; users: number; bounceRate?: number }
interface Ga4Country  { country: string; users: number; pageviews: number }
interface Ga4Device   { device: string; users: number; sessions: number }
interface Ga4Source   { channel: string; sessions: number; users: number }
interface Ga4NvR      { type: string; users: number; sessions: number }
interface Ga4Search   { term: string; sessions: number; users: number }
interface Ga4Section  { section: string; pageviews: number; users: number; avgDuration: number; engagementRate: number }
interface Ga4Daily    { date: string; sessions: number; users: number; pageviews: number }
interface GscRow      { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface GscDaily    { date: string; clicks: number; impressions: number }
interface GscTotals   { clicks: number; impressions: number; avgCtr: number; avgPosition: number }
interface GscData {
    topQueries: GscRow[]; topPages: GscRow[]; dailyTrend: GscDaily[]
    countries: GscRow[]; devices: GscRow[]; opportunities: GscRow[]; totals: GscTotals
}
interface Ga4Data {
    metrics: Ga4Metrics; prevMetrics: Ga4Metrics; dailyTrend: Ga4Daily[]
    activeUsers: number; blogPosts: Ga4Page[]; productions: Ga4Page[]; artists: Ga4Page[]
    countries: Ga4Country[]; devices: Ga4Device[]; sources: Ga4Source[]
    newVsReturning: Ga4NvR[]; searchTerms: Ga4Search[]; sectionEngagement: Ga4Section[]
    landingPages: Ga4Page[]; gsc: GscData | null; days: number
}

type Days = '7' | '30' | '90'
type Tab  = 'ga4' | 'gsc'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
    return String(n)
}
function fmtDuration(s: number) {
    const m = Math.floor(s / 60), sec = Math.round(s % 60)
    return m > 0 ? `${m}m${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`
}
function fmtPct(n: number) { return `${(n * 100).toFixed(1)}%` }
function shortPath(p: string) { return p.length > 42 ? p.slice(0, 39) + '…' : p }
function delta(curr: number, prev: number) {
    if (prev === 0) return null
    return ((curr - prev) / prev) * 100
}
function fmtDate8(s: string) { return s.replace(/(\d{4})(\d{2})(\d{2})/, '$2/$3') }

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-surface-hover ${className}`} />
}
function SkeletonKpis() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-surface p-4 space-y-2">
                    <Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" /><Skeleton className="h-3 w-12" />
                </div>
            ))}
        </div>
    )
}
function SkeletonBlock({ h = 'h-40' }: { h?: string }) {
    return <div className={`rounded-xl border border-border bg-surface ${h} animate-pulse`} />
}

// ─── DeltaBadge ──────────────────────────────────────────────────────────────

function DeltaBadge({ pct }: { pct: number | null }) {
    if (pct === null) return null
    const up = pct >= 0
    return (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${up ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
        </span>
    )
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, accent = false, pct }: {
    label: string; value: string | number; sub?: string
    icon: React.ElementType; accent?: boolean; pct?: number | null
}) {
    return (
        <div className={`rounded-xl border p-4 flex flex-col gap-1.5 transition-colors hover:bg-surface-hover/50 ${accent ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
            <div className="flex items-center gap-1.5 text-muted text-[10px] font-semibold uppercase tracking-widest">
                <Icon size={11} /> {label}
            </div>
            <div className={`text-2xl font-black tracking-tight ${accent ? 'text-accent' : 'text-foreground'}`}>
                {typeof value === 'number' ? fmt(value) : value}
            </div>
            <div className="flex items-center gap-2 min-h-[16px]">
                {sub && <span className="text-muted text-[11px]">{sub}</span>}
                {pct !== undefined && <DeltaBadge pct={pct ?? null} />}
            </div>
        </div>
    )
}

// ─── LineChart with tooltip ───────────────────────────────────────────────────

function LineChart({ data, keys, colors, labels, height = 100 }: {
    data: Record<string, number | string>[]
    keys: string[]; colors: string[]; labels: string[]; height?: number
}) {
    const svgRef = useRef<SVGSVGElement>(null)
    const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(null)
    if (data.length < 2) return null

    const W = 600; const H = height
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => Number(d[k] ?? 0))), 1)
    const xStep = W / (data.length - 1)
    const yScale = (v: number) => H - (v / maxVal) * H * 0.85 - H * 0.05

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        const relX = (e.clientX - rect.left) / rect.width * W
        const idx = Math.min(Math.max(Math.round(relX / xStep), 0), data.length - 1)
        setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, idx })
    }

    const tip = tooltip !== null ? data[tooltip.idx] : null

    return (
        <div className="relative select-none">
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible"
                style={{ height }} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
                {[0.25, 0.5, 0.75, 1].map(f => (
                    <line key={f} x1={0} y1={yScale(maxVal * f)} x2={W} y2={yScale(maxVal * f)}
                        stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} strokeDasharray="4 4" />
                ))}
                {keys.map((k, ki) => {
                    const pts = data.map((d, i) => `${i * xStep},${yScale(Number(d[k] ?? 0))}`).join(' ')
                    const fillPts = `0,${H} ${pts} ${(data.length - 1) * xStep},${H}`
                    return (
                        <g key={k}>
                            <polygon points={fillPts} fill={colors[ki]} fillOpacity={0.08} />
                            <polyline points={pts} fill="none" stroke={colors[ki]} strokeWidth={2}
                                strokeLinejoin="round" strokeLinecap="round" />
                        </g>
                    )
                })}
                {tooltip !== null && (
                    <>
                        <line x1={tooltip.idx * xStep} y1={0} x2={tooltip.idx * xStep} y2={H}
                            stroke="white" strokeOpacity={0.12} strokeWidth={1} />
                        {keys.map((k, ki) => (
                            <circle key={ki} cx={tooltip.idx * xStep} cy={yScale(Number(data[tooltip.idx][k] ?? 0))}
                                r={4} fill={colors[ki]} stroke="var(--color-background)" strokeWidth={2} />
                        ))}
                    </>
                )}
            </svg>
            {tip && tooltip && (
                <div className="pointer-events-none absolute z-10 min-w-[130px] rounded-xl border border-border bg-surface shadow-2xl px-3 py-2.5 text-xs"
                    style={{
                        left: tooltip.x + 14,
                        top: Math.max(tooltip.y - 50, 0),
                        transform: tooltip.x > 380 ? 'translateX(-110%)' : undefined,
                    }}>
                    <div className="text-muted font-mono text-[10px] mb-1.5">
                        {String(tip.date ?? '').length === 8 ? fmtDate8(String(tip.date)) : String(tip.date)}
                    </div>
                    {keys.map((k, ki) => (
                        <div key={k} className="flex items-center gap-2 justify-between py-0.5">
                            <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colors[ki] }} />
                                <span className="text-muted">{labels[ki]}</span>
                            </span>
                            <span className="font-bold text-foreground tabular-nums">{fmt(Number(tip[k] ?? 0))}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── HBarChart ───────────────────────────────────────────────────────────────

function HBarChart({ rows, max, valueKey, labelKey, colorClass = 'bg-accent/60' }: {
    rows: Record<string, unknown>[]; max: number; valueKey: string; labelKey: string; colorClass?: string
}) {
    return (
        <div className="space-y-2">
            {rows.map((row, i) => {
                const val = Number(row[valueKey] ?? 0)
                const pct = max > 0 ? (val / max) * 100 : 0
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div className="w-28 shrink-0 text-[11px] text-muted truncate capitalize">{String(row[labelKey] ?? '')}</div>
                        <div className="flex-1 h-4 bg-surface-hover rounded-full overflow-hidden">
                            <div className={`h-full ${colorClass} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-12 text-[11px] text-right font-mono text-foreground shrink-0">{fmt(val)}</div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── DonutChart ──────────────────────────────────────────────────────────────

function DonutChart({ slices, size = 76 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
    const total = slices.reduce((s, sl) => s + sl.value, 0)
    if (total === 0) return null
    const r = size / 2 - 8; const circ = 2 * Math.PI * r
    let offset = 0
    const paths = slices.map(sl => {
        const frac = sl.value / total; const dash = frac * circ
        const p = { dash, offset: circ - offset, color: sl.color, pct: Math.round(frac * 100) }
        offset += dash; return p
    })
    return (
        <div className="flex items-center gap-5">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-hover)" strokeWidth={9} />
                {paths.map((p, i) => (
                    <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={p.color} strokeWidth={9}
                        strokeDasharray={`${p.dash} ${circ - p.dash}`} strokeDashoffset={p.offset} />
                ))}
            </svg>
            <div className="space-y-1.5 flex-1">
                {slices.map((sl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sl.color }} />
                        <span className="text-muted capitalize flex-1">{sl.label}</span>
                        <span className="font-bold text-foreground tabular-nums">{paths[i].pct}%</span>
                        <span className="text-muted tabular-nums text-[10px]">{fmt(sl.value)}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── SectionTable ────────────────────────────────────────────────────────────

const SECTION_COLORS: Record<string, string> = {
    '/artists': '#ff2d78', '/blog': '#3b82f6', '/productions': '#f59e0b',
    '/groups': '#8b5cf6', '/news': '#10b981', '/calendario': '#06b6d4', '/loja': '#f97316',
}
function SectionTable({ rows }: { rows: Ga4Section[] }) {
    const maxPv = Math.max(...rows.map(r => r.pageviews), 1)
    return (
        <div className="space-y-2">
            {rows.map(r => (
                <div key={r.section} className="group flex items-center gap-3">
                    <div className="w-28 shrink-0 text-[11px] font-mono text-muted group-hover:text-foreground transition-colors">{r.section}</div>
                    <div className="flex-1 h-7 bg-surface-hover rounded-lg overflow-hidden relative">
                        <div className="h-full rounded-lg transition-all duration-500 opacity-75"
                            style={{ width: `${(r.pageviews / maxPv) * 100}%`, background: SECTION_COLORS[r.section] ?? '#888' }} />
                        <div className="absolute inset-0 flex items-center justify-end pr-2 gap-3 text-[10px] font-mono">
                            <span className="text-foreground/60">{fmtPct(r.engagementRate)} eng</span>
                            <span className="text-foreground/60">{fmtDuration(r.avgDuration)}</span>
                        </div>
                    </div>
                    <div className="w-14 text-[11px] text-right font-mono text-foreground shrink-0">{fmt(r.pageviews)}</div>
                </div>
            ))}
        </div>
    )
}

// ─── TopList ─────────────────────────────────────────────────────────────────

function TopList({ items, valueKey, labelKey, href }: {
    items: Record<string, unknown>[]; valueKey: string; labelKey: string
    href?: (item: Record<string, unknown>) => string
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
                        <span className="text-muted/40 text-[10px] font-mono w-4 shrink-0 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                            <div className="relative h-6 bg-surface-hover rounded-lg overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-accent/15 rounded-lg transition-all duration-500"
                                    style={{ width: `${(val / max) * 100}%` }} />
                                <span className="absolute inset-y-0 left-2 right-7 flex items-center text-[11px] text-foreground truncate">
                                    {url ? (
                                        <a href={`https://www.hallyuhub.com.br${url}`} target="_blank" rel="noopener"
                                            className="hover:text-accent transition-colors truncate">{shortPath(label)}</a>
                                    ) : label}
                                </span>
                                {url && <ExternalLink size={9} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted opacity-0 group-hover:opacity-60 transition-opacity" />}
                            </div>
                        </div>
                        <span className="w-10 text-[11px] text-right font-mono text-muted shrink-0">{fmt(val)}</span>
                    </div>
                )
            })}
        </div>
    )
}

// ─── GscTable ────────────────────────────────────────────────────────────────

function GscTable({ rows, keyLabel = 'Query', isPage = false }: { rows: GscRow[]; keyLabel?: string; isPage?: boolean }) {
    return (
        <div className="space-y-px">
            <div className="grid grid-cols-[1fr_52px_72px_48px_44px] text-[10px] text-muted font-semibold uppercase tracking-widest pb-2 border-b border-border px-1">
                <span>{keyLabel}</span>
                <span className="text-right">Cliques</span>
                <span className="text-right">Impressões</span>
                <span className="text-right">CTR</span>
                <span className="text-right">Pos.</span>
            </div>
            {rows.map((row, i) => {
                const displayKey = isPage ? row.key.replace('https://www.hallyuhub.com.br', '') || '/' : row.key
                const posColor = row.position <= 3 ? 'text-green-400' : row.position <= 10 ? 'text-yellow-400' : 'text-muted'
                return (
                    <div key={i} className="group grid grid-cols-[1fr_52px_72px_48px_44px] text-xs py-1 px-1 hover:bg-surface-hover rounded-lg transition-colors">
                        <span className="text-foreground truncate flex items-center gap-1 pr-2">
                            {isPage ? (
                                <a href={row.key} target="_blank" rel="noopener" className="hover:text-accent transition-colors truncate">
                                    {shortPath(displayKey)}
                                </a>
                            ) : displayKey}
                            {isPage && <ExternalLink size={8} className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />}
                        </span>
                        <span className="text-right font-mono text-accent font-bold">{fmt(row.clicks)}</span>
                        <span className="text-right font-mono text-muted">{fmt(row.impressions)}</span>
                        <span className="text-right font-mono text-muted">{(row.ctr * 100).toFixed(1)}%</span>
                        <span className={`text-right font-mono font-bold ${posColor}`}>#{row.position.toFixed(0)}</span>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Card ────────────────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-xl border border-border bg-surface p-5 ${className}`}>{children}</div>
}
function CardTitle({ icon: Icon, children, right }: { icon?: React.ElementType; children: React.ReactNode; right?: React.ReactNode }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            {Icon && <Icon size={13} className="text-muted shrink-0" />}
            <h3 className="text-sm font-bold text-foreground flex-1">{children}</h3>
            {right && <div className="text-[11px] text-muted flex items-center gap-2">{right}</div>}
        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Ga4AnalyticsPage() {
    const [days, setDays]     = useState<Days>('30')
    const [tab, setTab]       = useState<Tab>('ga4')
    const [data, setData]     = useState<Ga4Data | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]   = useState<string | null>(null)

    const load = useCallback((d: Days) => {
        setLoading(true); setError(null)
        fetch(`/api/admin/analytics/ga4?days=${d}`, { credentials: 'include' })
            .then(r => r.json())
            .then(json => { if (json.error) setError(json.error); else setData(json) })
            .catch(e => setError(e.message ?? 'Erro'))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load(days) }, [days, load])

    const m = data?.metrics; const p = data?.prevMetrics
    const deviceColors: Record<string, string> = { mobile: '#ff2d78', desktop: '#3b82f6', tablet: '#f59e0b' }
    const nvRColors:    Record<string, string>  = { new: '#10b981', returning: '#8b5cf6' }
    const channelColors = ['#ff2d78','#3b82f6','#f59e0b','#10b981','#8b5cf6','#f97316','#06b6d4','#ec4899']
    const deviceSlices = (data?.devices ?? []).map(d => ({ label: d.device, value: d.users, color: deviceColors[d.device.toLowerCase()] ?? '#888' }))
    const nvRSlices    = (data?.newVsReturning ?? []).map(d => ({ label: d.type === 'new' ? 'Novos' : 'Recorrentes', value: d.users, color: nvRColors[d.type] ?? '#888' }))

    return (
        <AdminLayout title="Analytics">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ── Sticky header ───────────────────────────────────── */}
                <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
                        {/* Tabs */}
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
                            <button onClick={() => setTab('ga4')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold transition-colors ${tab === 'ga4' ? 'bg-blue-500/15 text-blue-400' : 'text-muted hover:text-foreground'}`}>
                                <BarChart2 size={13} /> Analytics
                            </button>
                            <button onClick={() => setTab('gsc')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold transition-colors border-l border-border ${tab === 'gsc' ? 'bg-green-500/15 text-green-400' : 'text-muted hover:text-foreground'}`}>
                                <Search size={13} /> Search Console
                                {data?.gsc && <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0 ml-0.5" />}
                            </button>
                        </div>
                        {/* Day filter */}
                        <div className="flex rounded-lg border border-border overflow-hidden text-sm ml-auto">
                            {(['7','30','90'] as Days[]).map(d => (
                                <button key={d} onClick={() => setDays(d)}
                                    className={`px-3 py-1.5 font-medium transition-colors ${days === d ? 'bg-accent text-white' : 'text-muted hover:text-foreground'}`}>
                                    {d}d
                                </button>
                            ))}
                        </div>
                        <button onClick={() => load(days)} disabled={loading}
                            className="p-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors disabled:opacity-40" title="Atualizar">
                            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <Link href="/admin/analytics" className="text-xs text-muted hover:text-foreground transition-colors">← Voltar</Link>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-3">
                        <span className="flex-1">{error}</span>
                        <button onClick={() => load(days)} className="text-xs underline underline-offset-2 shrink-0">tentar novamente</button>
                    </div>
                )}

                {/* ══ TAB: GOOGLE ANALYTICS 4 ══════════════════════════ */}
                {tab === 'ga4' && (
                    <div className="space-y-5">
                        {loading && !data ? <SkeletonKpis /> : m && p && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <StatCard icon={Activity}     label="Ativos agora"  value={data!.activeUsers}  sub="tempo real" accent />
                                <StatCard icon={Users}        label="Usuários"       value={m.users}           sub={`${days} dias`} pct={delta(m.users, p.users)} />
                                <StatCard icon={TrendingUp}   label="Sessões"        value={m.sessions}        sub={`${days} dias`} pct={delta(m.sessions, p.sessions)} />
                                <StatCard icon={Eye}          label="Pageviews"      value={m.pageviews}       sub={`${days} dias`} pct={delta(m.pageviews, p.pageviews)} />
                                <StatCard icon={Clock}        label="Duração média"  value={fmtDuration(m.avgSessionDuration)} sub="por sessão" pct={delta(m.avgSessionDuration, p.avgSessionDuration)} />
                                <StatCard icon={ArrowUpRight} label="Bounce rate"    value={fmtPct(m.bounceRate)} sub="taxa de rejeição" pct={delta(m.bounceRate, p.bounceRate) !== null ? -(delta(m.bounceRate, p.bounceRate)!) : null} />
                            </div>
                        )}

                        {loading && !data ? <SkeletonBlock h="h-40" /> : data && data.dailyTrend.length > 1 && (
                            <Card>
                                <CardTitle icon={TrendingUp} right={
                                    <><span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#3b82f6] inline-block rounded" /> Sessões</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#ff2d78] inline-block rounded" /> Usuários</span></>
                                }>Tendência Diária</CardTitle>
                                <LineChart data={data.dailyTrend as unknown as Record<string, number | string>[]}
                                    keys={['sessions','users']} colors={['#3b82f6','#ff2d78']} labels={['Sessões','Usuários']} height={110} />
                                <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
                                    <span>{fmtDate8(data.dailyTrend[0]?.date ?? '')}</span>
                                    <span>{fmtDate8(data.dailyTrend[data.dailyTrend.length - 1]?.date ?? '')}</span>
                                </div>
                            </Card>
                        )}

                        {loading && !data ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i) => <SkeletonBlock key={i} h="h-44" />)}</div>
                        ) : data && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardTitle icon={Monitor}>Dispositivos</CardTitle>
                                    <DonutChart slices={deviceSlices} />
                                </Card>
                                <Card>
                                    <CardTitle icon={Users}>Novos vs Recorrentes</CardTitle>
                                    <DonutChart slices={nvRSlices} />
                                </Card>
                                <Card>
                                    <CardTitle icon={Globe}>Fontes de Tráfego</CardTitle>
                                    <div className="space-y-2">
                                        {data.sources.map((s, i) => {
                                            const maxS = Math.max(...data.sources.map(x => x.sessions), 1)
                                            return (
                                                <div key={i} className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: channelColors[i] ?? '#888' }} />
                                                    <span className="flex-1 text-[11px] text-muted truncate">{s.channel}</span>
                                                    <div className="w-16 h-3.5 bg-surface-hover rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${(s.sessions / maxS) * 100}%`, background: channelColors[i] ?? '#888' }} />
                                                    </div>
                                                    <span className="w-10 text-[11px] text-right font-mono text-foreground shrink-0">{fmt(s.sessions)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {loading && !data ? <SkeletonBlock h="h-44" /> : data && data.sectionEngagement.length > 0 && (
                            <Card>
                                <CardTitle icon={BarChart2}>Engajamento por Seção</CardTitle>
                                <SectionTable rows={data.sectionEngagement} />
                            </Card>
                        )}

                        {loading && !data ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:2}).map((_,i) => <SkeletonBlock key={i} h="h-40" />)}</div>
                        ) : data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.countries.length > 0 && (
                                    <Card><CardTitle icon={Globe}>Top Países</CardTitle>
                                        <HBarChart rows={data.countries as unknown as Record<string, unknown>[]}
                                            max={Math.max(...data.countries.map(c => c.users), 1)} valueKey="users" labelKey="country" /></Card>
                                )}
                                {data.searchTerms.length > 0 && (
                                    <Card><CardTitle icon={Search}>Termos Buscados no Site</CardTitle>
                                        <HBarChart rows={data.searchTerms as unknown as Record<string, unknown>[]}
                                            max={Math.max(...data.searchTerms.map(t => t.sessions), 1)} valueKey="sessions" labelKey="term" colorClass="bg-blue-500/60" /></Card>
                                )}
                            </div>
                        )}

                        {loading && !data ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({length:3}).map((_,i) => <SkeletonBlock key={i} h="h-52" />)}</div>
                        ) : data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[{title:'Top Blog', items:data.blogPosts},{title:'Top Artistas',items:data.artists},{title:'Top Produções',items:data.productions}]
                                    .map(({ title, items }) => (
                                        <Card key={title}><CardTitle>{title}</CardTitle>
                                            <TopList items={items as unknown as Record<string, unknown>[]} valueKey="pageviews" labelKey="path" href={item => String(item.path ?? '')} />
                                        </Card>
                                    ))}
                            </div>
                        )}

                        {loading && !data ? <SkeletonBlock h="h-44" /> : data && (
                            <Card>
                                <CardTitle icon={ArrowUpRight} right="onde usuários chegam">Páginas de Entrada</CardTitle>
                                <TopList items={data.landingPages as unknown as Record<string, unknown>[]} valueKey="sessions" labelKey="path" href={item => String(item.path ?? '')} />
                            </Card>
                        )}
                    </div>
                )}

                {/* ══ TAB: SEARCH CONSOLE ══════════════════════════════ */}
                {tab === 'gsc' && (
                    <>
                        {loading && !data && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({length:4}).map((_,i) => <SkeletonBlock key={i} h="h-24" />)}</div>
                                <SkeletonBlock h="h-40" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:4}).map((_,i) => <SkeletonBlock key={i} h="h-64" />)}</div>
                            </div>
                        )}

                        {!loading && !data?.gsc && !error && (
                            <div className="rounded-xl border border-border bg-surface p-14 text-center space-y-3">
                                <Search size={36} className="mx-auto text-muted/30" />
                                <p className="text-muted text-sm font-medium">Search Console não disponível</p>
                                <p className="text-muted/60 text-xs">Configure o scope <code className="font-mono bg-surface-hover px-1.5 py-0.5 rounded text-foreground">webmasters.readonly</code> no token OAuth.</p>
                            </div>
                        )}

                        {data?.gsc && (
                            <div className="space-y-5">
                                {/* KPIs GSC */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <StatCard icon={Target}       label="Cliques"        value={data.gsc.totals.clicks}      sub="orgânicos" />
                                    <StatCard icon={Eye}          label="Impressões"      value={data.gsc.totals.impressions}  sub="busca Google" />
                                    <StatCard icon={TrendingUp}   label="CTR médio"       value={fmtPct(data.gsc.totals.avgCtr)} sub="cliques / impressões" />
                                    <StatCard icon={ArrowUpRight} label="Posição média"   value={`#${data.gsc.totals.avgPosition.toFixed(1)}`} sub="ranking Google" />
                                </div>

                                {/* Trend GSC */}
                                {data.gsc.dailyTrend.length > 1 && (
                                    <Card>
                                        <CardTitle icon={TrendingUp} right={
                                            <><span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" /> Cliques</span>
                                            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#6b7280] inline-block rounded" /> Impressões</span></>
                                        }>Tendência Diária — Busca Orgânica</CardTitle>
                                        <LineChart data={data.gsc.dailyTrend as unknown as Record<string, number | string>[]}
                                            keys={['clicks','impressions']} colors={['#10b981','#6b7280']}
                                            labels={['Cliques','Impressões']} height={110} />
                                        <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
                                            <span>{data.gsc.dailyTrend[0]?.date}</span>
                                            <span>{data.gsc.dailyTrend[data.gsc.dailyTrend.length - 1]?.date}</span>
                                        </div>
                                    </Card>
                                )}

                                {/* Oportunidades SEO */}
                                {data.gsc.opportunities.length > 0 && (
                                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
                                        <div className="flex items-start gap-2 mb-4">
                                            <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="text-sm font-bold text-amber-300">Oportunidades de SEO</h3>
                                                <p className="text-[11px] text-muted mt-0.5">Queries posição 4–30 com alta impressão — melhorar o título ou meta description pode subir no ranking rapidamente.</p>
                                            </div>
                                        </div>
                                        <GscTable rows={data.gsc.opportunities} />
                                    </div>
                                )}

                                {/* Top Queries + Páginas */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card><CardTitle icon={Search}>Top Queries</CardTitle><GscTable rows={data.gsc.topQueries} /></Card>
                                    <Card><CardTitle icon={Globe}>Top Páginas Orgânicas</CardTitle><GscTable rows={data.gsc.topPages} keyLabel="Página" isPage /></Card>
                                </div>

                                {/* Países + Dispositivos GSC */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card><CardTitle icon={Globe}>Países</CardTitle><GscTable rows={data.gsc.countries} keyLabel="País" /></Card>
                                    <Card><CardTitle icon={Monitor}>Dispositivos</CardTitle><GscTable rows={data.gsc.devices} keyLabel="Dispositivo" /></Card>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
