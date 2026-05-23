'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    RefreshCw, Globe, Monitor, TrendingUp, Users, Eye, Clock,
    ArrowUpRight, Search, ExternalLink, BarChart2, Target, Zap, Activity,
    AlertTriangle, Download, ChevronDown, ChevronRight, Tag, Layers, Pencil,
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
interface GscRow          { key: string; clicks: number; impressions: number; ctr: number; position: number }
interface GscFalling      extends GscRow { prevPosition: number; drop: number }
interface GscDaily        { date: string; clicks: number; impressions: number }
interface GscTotals       { clicks: number; impressions: number; avgCtr: number; avgPosition: number }
interface GscSectionHealth { section: string; clicks: number; impressions: number; ctr: number; avgPosition: number; pageCount: number }
interface GscCtrBucket    { label: string; expected: number; actual: number; count: number; impressions: number; clicks: number }
interface GscBrandVsGeneric { brand: { clicks: number; impressions: number; count: number }; generic: { clicks: number; impressions: number; count: number } }
interface GscQueryPage    { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number }
interface GscData {
    topQueries: GscRow[]; topPages: GscRow[]; dailyTrend: GscDaily[]
    countries: GscRow[]; devices: GscRow[]; opportunities: GscRow[]; totals: GscTotals
    pagesNoClick: GscRow[]; sectionHealth: GscSectionHealth[]; fallingQueries: GscFalling[]
    ctrBuckets: GscCtrBucket[]; brandVsGeneric: GscBrandVsGeneric; queryByPage: GscQueryPage[]
    contentGaps: GscRow[]
}
interface Ga4Data {
    metrics: Ga4Metrics; prevMetrics: Ga4Metrics; dailyTrend: Ga4Daily[]
    activeUsers: number; blogPosts: Ga4Page[]; productions: Ga4Page[]; artists: Ga4Page[]; groups: Ga4Page[]
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
function fmtDateISO(s: string) { return s.slice(5) } // "2025-01-15" → "01-15"
function exportCsv(rows: Record<string, unknown>[], filename: string) {
    if (!rows.length) return
    const keys = Object.keys(rows[0])
    const csv  = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
    const a    = document.createElement('a')
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = filename; a.click()
}
function weeklyFromDaily(daily: { date: string; clicks: number; impressions: number }[]) {
    const map = new Map<string, { clicks: number; impressions: number }>()
    daily.forEach(d => {
        const dt = new Date(d.date)
        dt.setDate(dt.getDate() - dt.getDay())
        const key = dt.toISOString().slice(0, 10)
        const w   = map.get(key) ?? { clicks: 0, impressions: 0 }
        w.clicks += d.clicks; w.impressions += d.impressions
        map.set(key, w)
    })
    return Array.from(map.entries()).map(([date, w]) => ({ date, ...w }))
}
function adminEditorLink(pageUrl: string): string | null {
    const path = pageUrl.replace('https://www.hallyuhub.com.br', '')
    const seg  = path.split('/')[1]
    if (!seg) return null
    const map: Record<string, string> = { artists: '/admin/artists', productions: '/admin/productions', blog: '/admin/blog', groups: '/admin/groups', news: '/admin/news' }
    return map[seg] ?? null
}

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

    const PAD_L = 36; const W = 600; const H = height
    const maxVal = Math.max(...data.flatMap(d => keys.map(k => Number(d[k] ?? 0))), 1)
    const xStep = (W - PAD_L) / (data.length - 1)
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
                {[0.25, 0.5, 0.75, 1].map(f => {
                    const y = yScale(maxVal * f)
                    return (
                        <g key={f}>
                            <line x1={PAD_L} y1={y} x2={W} y2={y}
                                stroke="currentColor" strokeOpacity={0.06} strokeWidth={1} strokeDasharray="4 4" />
                            <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize={8} fill="currentColor" opacity={0.35} className="font-mono">
                                {fmt(Math.round(maxVal * f))}
                            </text>
                        </g>
                    )
                })}
                {keys.map((k, ki) => {
                    const pts = data.map((d, i) => `${PAD_L + i * xStep},${yScale(Number(d[k] ?? 0))}`).join(' ')
                    const fillPts = `${PAD_L},${H} ${pts} ${PAD_L + (data.length - 1) * xStep},${H}`
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
                        <line x1={PAD_L + tooltip.idx * xStep} y1={0} x2={PAD_L + tooltip.idx * xStep} y2={H}
                            stroke="white" strokeOpacity={0.12} strokeWidth={1} />
                        {keys.map((k, ki) => (
                            <circle key={ki} cx={PAD_L + tooltip.idx * xStep} cy={yScale(Number(data[tooltip.idx][k] ?? 0))}
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

function TopList({ items, valueKey, labelKey, titleKey, href }: {
    items: Record<string, unknown>[]; valueKey: string; labelKey: string; titleKey?: string
    href?: (item: Record<string, unknown>) => string
}) {
    const max = Math.max(...items.map(i => Number(i[valueKey] ?? 0)), 1)
    return (
        <div className="space-y-1.5">
            {items.map((item, i) => {
                const val = Number(item[valueKey] ?? 0)
                const path = String(item[labelKey] ?? '')
                const title = titleKey ? String(item[titleKey] ?? '') : ''
                const displayLabel = title && title !== '(not set)' ? title : shortPath(path)
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
                                            className="hover:text-accent transition-colors truncate" title={path}>{displayLabel}</a>
                                    ) : displayLabel}
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

function GscTable({ rows, keyLabel = 'Query', isPage = false, onPageClick, selectedPage }: {
    rows: GscRow[]; keyLabel?: string; isPage?: boolean
    onPageClick?: (url: string) => void; selectedPage?: string
}) {
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
                const posColor   = row.position <= 3 ? 'text-green-400' : row.position <= 10 ? 'text-yellow-400' : 'text-muted'
                const isSelected = isPage && selectedPage === row.key
                const editorLink = isPage ? adminEditorLink(row.key) : null
                return (
                    <div key={i} className={`group grid grid-cols-[1fr_52px_72px_48px_44px] text-xs py-1.5 px-1 rounded-lg transition-colors cursor-default ${isSelected ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-surface-hover'}`}
                        onClick={isPage && onPageClick ? () => onPageClick(isSelected ? '' : row.key) : undefined}>
                        <span className="text-foreground truncate flex items-center gap-1 pr-2">
                            {isPage && onPageClick && (
                                isSelected ? <ChevronDown size={10} className="shrink-0 text-green-400" /> : <ChevronRight size={10} className="shrink-0 text-muted/50" />
                            )}
                            {isPage ? (
                                <span className={`truncate ${onPageClick ? 'cursor-pointer hover:text-accent' : ''} transition-colors`}>{shortPath(displayKey)}</span>
                            ) : displayKey}
                            {isPage && (
                                <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <a href={row.key} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}><ExternalLink size={8} className="text-muted hover:text-accent" /></a>
                                    {editorLink && <Link href={editorLink} onClick={e => e.stopPropagation()}><Pencil size={8} className="text-muted hover:text-blue-400" /></Link>}
                                </span>
                            )}
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

// ─── CtrBucketChart ──────────────────────────────────────────────────────────

function CtrBucketChart({ buckets }: { buckets: GscCtrBucket[] }) {
    const maxPct = 0.30
    return (
        <div className="space-y-3">
            {buckets.map((b, i) => {
                const actualPct   = Math.min(b.actual   / maxPct, 1)
                const expectedPct = Math.min(b.expected / maxPct, 1)
                const isUnder = b.actual < b.expected * 0.7
                return (
                    <div key={i} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-muted font-medium">{b.label}</span>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className={`font-mono font-bold ${isUnder ? 'text-red-400' : 'text-green-400'}`}>{(b.actual * 100).toFixed(1)}%</span>
                                <span className="text-muted/50">vs {(b.expected * 100).toFixed(1)}% esperado</span>
                                <span className="text-muted/40 font-mono">{b.count} queries</span>
                            </div>
                        </div>
                        <div className="relative h-5 bg-surface-hover rounded-lg overflow-hidden">
                            <div className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                                style={{ width: `${expectedPct * 100}%`, background: 'rgba(255,255,255,0.06)' }} />
                            <div className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ${isUnder ? 'bg-red-500/50' : 'bg-green-500/50'}`}
                                style={{ width: `${actualPct * 100}%` }} />
                            <div className="absolute inset-y-0 rounded-full w-0.5 bg-white/20 transition-all duration-700"
                                style={{ left: `${expectedPct * 100}%` }} />
                        </div>
                    </div>
                )
            })}
            <p className="text-[10px] text-muted/50 mt-2">Linha branca = CTR médio do setor por posição. Vermelho = abaixo do esperado.</p>
        </div>
    )
}

// ─── BrandVsGeneric ──────────────────────────────────────────────────────────

function BrandVsGenericChart({ data }: { data: GscBrandVsGeneric }) {
    const totalClicks = data.brand.clicks + data.generic.clicks
    const brandPct    = totalClicks > 0 ? data.brand.clicks / totalClicks : 0
    const genericPct  = 1 - brandPct
    const isHealthy   = genericPct >= 0.5
    return (
        <div className="space-y-4">
            <div className="flex rounded-full overflow-hidden h-5">
                <div className="bg-blue-500/70 transition-all duration-700 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ width: `${brandPct * 100}%` }}>
                    {brandPct > 0.12 ? `${(brandPct * 100).toFixed(0)}% marca` : ''}
                </div>
                <div className="bg-green-500/60 transition-all duration-700 flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ width: `${genericPct * 100}%` }}>
                    {genericPct > 0.12 ? `${(genericPct * 100).toFixed(0)}% orgânico` : ''}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-center">
                {[
                    { label: 'Queries de marca', color: 'blue', ...data.brand },
                    { label: 'Queries orgânicas', color: 'green', ...data.generic },
                ].map(({ label, color, clicks, impressions, count }) => (
                    <div key={label} className={`rounded-xl border p-3 ${color === 'blue' ? 'border-blue-500/20 bg-blue-500/5' : 'border-green-500/20 bg-green-500/5'}`}>
                        <div className="text-[10px] text-muted mb-1">{label}</div>
                        <div className={`text-lg font-black ${color === 'blue' ? 'text-blue-400' : 'text-green-400'}`}>{fmt(clicks)}</div>
                        <div className="text-[10px] text-muted/60">{fmt(impressions)} impr · {count} queries</div>
                    </div>
                ))}
            </div>
            {!isHealthy && (
                <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                    <AlertTriangle size={11} /> Mais de 50% dos cliques vêm de buscas pela marca — o conteúdo orgânico ainda precisa crescer.
                </p>
            )}
        </div>
    )
}

// ─── SectionHealthTable ───────────────────────────────────────────────────────

function SectionHealthTable({ rows }: { rows: GscSectionHealth[] }) {
    const maxClicks = Math.max(...rows.map(r => r.clicks), 1)
    const COLORS: Record<string, string> = {
        '/artists': '#ff2d78', '/blog': '#3b82f6', '/productions': '#f59e0b',
        '/groups': '#8b5cf6', '/news': '#10b981', '/calendario': '#06b6d4', '/loja': '#f97316',
    }
    return (
        <div className="space-y-2.5">
            {rows.map(r => {
                const color  = COLORS[r.section] ?? '#888'
                const posColor = r.avgPosition <= 10 ? 'text-green-400' : r.avgPosition <= 20 ? 'text-yellow-400' : 'text-muted'
                return (
                    <div key={r.section} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-mono font-medium" style={{ color }}>{r.section}</span>
                            <div className="flex items-center gap-3 text-[10px] text-muted">
                                <span className="font-mono">{(r.ctr * 100).toFixed(1)}% CTR</span>
                                <span className={`font-mono font-bold ${posColor}`}>#{r.avgPosition.toFixed(0)} pos</span>
                                <span>{fmt(r.impressions)} impr</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-4 bg-surface-hover rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700 opacity-70"
                                    style={{ width: `${(r.clicks / maxClicks) * 100}%`, background: color }} />
                            </div>
                            <span className="w-12 text-[11px] font-mono text-right text-foreground shrink-0">{fmt(r.clicks)}</span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── FallingQueriesTable ──────────────────────────────────────────────────────

function FallingQueriesTable({ rows }: { rows: GscFalling[] }) {
    return (
        <div className="space-y-px">
            <div className="grid grid-cols-[1fr_60px_60px_60px_70px] text-[10px] text-muted font-semibold uppercase tracking-widest pb-2 border-b border-red-500/20 px-1">
                <span>Query</span><span className="text-right">Antes</span><span className="text-right">Agora</span>
                <span className="text-right">Queda</span><span className="text-right">Impressões</span>
            </div>
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_60px_60px_70px] text-xs py-1.5 px-1 hover:bg-red-500/5 rounded-lg transition-colors">
                    <span className="text-foreground truncate pr-2">{row.key}</span>
                    <span className="text-right font-mono text-green-400">#{row.prevPosition.toFixed(0)}</span>
                    <span className="text-right font-mono text-red-400">#{row.position.toFixed(0)}</span>
                    <span className="text-right font-mono font-bold text-red-400">▼{row.drop.toFixed(0)}</span>
                    <span className="text-right font-mono text-muted">{fmt(row.impressions)}</span>
                </div>
            ))}
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
    const [days, setDays]       = useState<Days>('30')
    const [tab, setTab]         = useState<Tab>('ga4')
    const [data, setData]       = useState<Ga4Data | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState<string | null>(null)
    const [gscChartMode, setGscChartMode] = useState<'daily' | 'weekly'>('daily')
    const [selectedPage, setSelectedPage] = useState<string>('')
    const [brandFilter, setBrandFilter]   = useState<'all' | 'brand' | 'generic'>('all')

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
                        {error.includes('invalid_grant') || error.includes('Token has been expired') ? (
                            <a href="/api/admin/analytics/ga4/auth" className="text-xs underline underline-offset-2 shrink-0 text-amber-400">re-autorizar Google</a>
                        ) : (
                            <button onClick={() => load(days)} className="text-xs underline underline-offset-2 shrink-0">tentar novamente</button>
                        )}
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i) => <SkeletonBlock key={i} h="h-52" />)}</div>
                        ) : data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { title: 'Top Blog', items: data.blogPosts },
                                    { title: 'Top Artistas', items: data.artists },
                                    { title: 'Top Produções', items: data.productions },
                                    { title: 'Top Grupos', items: data.groups },
                                ].map(({ title, items }) => (
                                    <Card key={title}><CardTitle>{title}</CardTitle>
                                        <TopList items={items as unknown as Record<string, unknown>[]} valueKey="pageviews" labelKey="path" titleKey="title" href={item => String(item.path ?? '')} />
                                    </Card>
                                ))}
                            </div>
                        )}

                        {loading && !data ? <SkeletonBlock h="h-44" /> : data && (
                            <Card>
                                <CardTitle icon={ArrowUpRight} right="onde usuários chegam">Páginas de Entrada</CardTitle>
                                <TopList items={data.landingPages as unknown as Record<string, unknown>[]} valueKey="sessions" labelKey="path" titleKey="title" href={item => String(item.path ?? '')} />
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Array.from({length:6}).map((_,i) => <SkeletonBlock key={i} h="h-64" />)}</div>
                            </div>
                        )}

                        {!loading && !data?.gsc && !error && (
                            <div className="rounded-xl border border-border bg-surface p-14 text-center space-y-3">
                                <Search size={36} className="mx-auto text-muted/30" />
                                <p className="text-muted text-sm font-medium">Search Console não disponível</p>
                                <p className="text-muted/60 text-xs">Configure o scope <code className="font-mono bg-surface-hover px-1.5 py-0.5 rounded text-foreground">webmasters.readonly</code> no token OAuth.</p>
                            </div>
                        )}

                        {data?.gsc && (() => {
                            const gsc = data.gsc
                            const chartData = gscChartMode === 'weekly' ? weeklyFromDaily(gsc.dailyTrend) : gsc.dailyTrend
                            const filteredQueries = brandFilter === 'brand'
                                ? gsc.topQueries.filter(q => q.key.toLowerCase().includes('hallyuhub'))
                                : brandFilter === 'generic'
                                ? gsc.topQueries.filter(q => !q.key.toLowerCase().includes('hallyuhub'))
                                : gsc.topQueries
                            const pageQueries = selectedPage
                                ? gsc.queryByPage.filter(q => q.page === selectedPage).sort((a, b) => b.clicks - a.clicks).slice(0, 15)
                                : []
                            return (
                                <div className="space-y-5">
                                    {/* KPIs GSC */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <StatCard icon={Target}       label="Cliques"       value={gsc.totals.clicks}      sub="orgânicos" />
                                        <StatCard icon={Eye}          label="Impressões"     value={gsc.totals.impressions}  sub="busca Google" />
                                        <StatCard icon={TrendingUp}   label="CTR médio"      value={fmtPct(gsc.totals.avgCtr)} sub="cliques / impressões" />
                                        <StatCard icon={ArrowUpRight} label="Posição média"  value={`#${gsc.totals.avgPosition.toFixed(1)}`} sub="ranking Google" />
                                    </div>

                                    {/* Alertas de queda */}
                                    {gsc.fallingQueries.length > 0 && (
                                        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                                                    <div>
                                                        <h3 className="text-sm font-bold text-red-300">Queda de Posição Detectada</h3>
                                                        <p className="text-[11px] text-muted mt-0.5">{gsc.fallingQueries.length} queries caíram mais de 3 posições vs período anterior — verificar conteúdo, backlinks ou mudanças de algoritmo.</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => exportCsv(gsc.fallingQueries as unknown as Record<string,unknown>[], 'quedas-seo.csv')}
                                                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors shrink-0">
                                                    <Download size={10} /> CSV
                                                </button>
                                            </div>
                                            <FallingQueriesTable rows={gsc.fallingQueries} />
                                        </div>
                                    )}

                                    {/* Oportunidades SEO */}
                                    {gsc.opportunities.length > 0 && (
                                        <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-start gap-2">
                                                    <Zap size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h3 className="text-sm font-bold text-amber-300">Oportunidades de SEO</h3>
                                                        <p className="text-[11px] text-muted mt-0.5">Queries posição 4–30 com alta impressão — melhorar título ou meta description pode subir rapidamente.</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => exportCsv(gsc.opportunities as unknown as Record<string,unknown>[], 'oportunidades-seo.csv')}
                                                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors shrink-0">
                                                    <Download size={10} /> CSV
                                                </button>
                                            </div>
                                            <GscTable rows={gsc.opportunities} />
                                        </div>
                                    )}

                                    {/* Tendência diária/semanal */}
                                    {chartData.length > 1 && (
                                        <Card>
                                            <CardTitle icon={TrendingUp} right={
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#10b981] inline-block rounded" /> Cliques</span>
                                                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#6b7280] inline-block rounded" /> Impressões</span>
                                                    <div className="flex rounded-lg border border-border overflow-hidden text-[10px] ml-2">
                                                        {(['daily','weekly'] as const).map(m => (
                                                            <button key={m} onClick={() => setGscChartMode(m)}
                                                                className={`px-2 py-1 font-medium transition-colors ${gscChartMode === m ? 'bg-green-500/20 text-green-400' : 'text-muted hover:text-foreground'}`}>
                                                                {m === 'daily' ? 'Diário' : 'Semanal'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            }>Tendência — Busca Orgânica</CardTitle>
                                            <LineChart data={chartData as unknown as Record<string, number | string>[]}
                                                keys={['clicks','impressions']} colors={['#10b981','#6b7280']}
                                                labels={['Cliques','Impressões']} height={110} />
                                            <div className="flex justify-between text-[10px] text-muted font-mono mt-2">
                                                <span>{chartData[0]?.date ? fmtDateISO(chartData[0].date) : ''}</span>
                                                <span>{chartData[chartData.length - 1]?.date ? fmtDateISO(chartData[chartData.length - 1].date) : ''}</span>
                                            </div>
                                        </Card>
                                    )}

                                    {/* CTR por posição + Marca vs Orgânico */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {gsc.ctrBuckets.length > 0 && (
                                            <Card>
                                                <CardTitle icon={Target}>CTR por Posição</CardTitle>
                                                <CtrBucketChart buckets={gsc.ctrBuckets} />
                                            </Card>
                                        )}
                                        <Card>
                                            <CardTitle icon={Tag}>Marca vs Orgânico</CardTitle>
                                            <BrandVsGenericChart data={gsc.brandVsGeneric} />
                                        </Card>
                                    </div>

                                    {/* Saúde SEO por seção */}
                                    {gsc.sectionHealth.length > 0 && (
                                        <Card>
                                            <CardTitle icon={Layers} right={
                                                <button onClick={() => exportCsv(gsc.sectionHealth as unknown as Record<string,unknown>[], 'saude-seo-secoes.csv')}
                                                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors">
                                                    <Download size={10} /> CSV
                                                </button>
                                            }>Saúde SEO por Seção</CardTitle>
                                            <SectionHealthTable rows={gsc.sectionHealth} />
                                        </Card>
                                    )}

                                    {/* Top Queries com filtro marca/orgânico */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card>
                                            <CardTitle icon={Search} right={
                                                <div className="flex rounded-lg border border-border overflow-hidden text-[10px]">
                                                    {(['all','brand','generic'] as const).map(f => (
                                                        <button key={f} onClick={() => setBrandFilter(f)}
                                                            className={`px-2 py-1 font-medium transition-colors ${brandFilter === f ? 'bg-accent/20 text-accent' : 'text-muted hover:text-foreground'}`}>
                                                            {f === 'all' ? 'Todas' : f === 'brand' ? 'Marca' : 'Orgânico'}
                                                        </button>
                                                    ))}
                                                </div>
                                            }>Top Queries</CardTitle>
                                            <GscTable rows={filteredQueries} />
                                            <button onClick={() => exportCsv(filteredQueries as unknown as Record<string,unknown>[], 'top-queries.csv')}
                                                className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors mt-3">
                                                <Download size={10} /> Exportar CSV
                                            </button>
                                        </Card>

                                        {/* Top Páginas com drill-down de queries por página */}
                                        <div className="space-y-3">
                                            <Card>
                                                <CardTitle icon={Globe} right={
                                                    <button onClick={() => exportCsv(gsc.topPages as unknown as Record<string,unknown>[], 'top-paginas.csv')}
                                                        className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors">
                                                        <Download size={10} /> CSV
                                                    </button>
                                                }>Top Páginas Orgânicas</CardTitle>
                                                <GscTable rows={gsc.topPages} keyLabel="Página" isPage
                                                    onPageClick={url => setSelectedPage(url)} selectedPage={selectedPage} />
                                            </Card>
                                            {selectedPage && pageQueries.length > 0 && (
                                                <Card className="border-green-500/20 bg-green-500/3">
                                                    <CardTitle icon={Search}>
                                                        Queries → {selectedPage.replace('https://www.hallyuhub.com.br', '') || '/'}
                                                    </CardTitle>
                                                    <GscTable rows={pageQueries.map(q => ({ key: q.query, clicks: q.clicks, impressions: q.impressions, ctr: q.ctr, position: q.position }))} />
                                                </Card>
                                            )}
                                        </div>
                                    </div>

                                    {/* Páginas sem clique */}
                                    {gsc.pagesNoClick.length > 0 && (
                                        <Card>
                                            <CardTitle icon={Eye} right={
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted">{gsc.pagesNoClick.length} páginas com impressões mas zero cliques</span>
                                                    <button onClick={() => exportCsv(gsc.pagesNoClick as unknown as Record<string,unknown>[], 'paginas-sem-clique.csv')}
                                                        className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors">
                                                        <Download size={10} /> CSV
                                                    </button>
                                                </div>
                                            }>Páginas sem Clique</CardTitle>
                                            <p className="text-[11px] text-muted mb-3">O Google mostra essas páginas nos resultados, mas ninguém clica — o título ou meta description provavelmente não atraem.</p>
                                            <GscTable rows={gsc.pagesNoClick} keyLabel="Página" isPage />
                                        </Card>
                                    )}

                                    {/* Lacunas de conteúdo */}
                                    {gsc.contentGaps.length > 0 && (
                                        <Card>
                                            <CardTitle icon={Zap} right={
                                                <button onClick={() => exportCsv(gsc.contentGaps as unknown as Record<string,unknown>[], 'lacunas-conteudo.csv')}
                                                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors">
                                                    <Download size={10} /> CSV
                                                </button>
                                            }>Lacunas de Conteúdo</CardTitle>
                                            <p className="text-[11px] text-muted mb-3">
                                                Queries com muitas impressões mas sem página dedicada — nenhuma URL do site rankeia bem para esses termos.
                                                Criar uma página focada pode capturar esse tráfego que já existe.
                                            </p>
                                            <GscTable rows={gsc.contentGaps} />
                                        </Card>
                                    )}

                                    {/* Países + Dispositivos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card>
                                            <CardTitle icon={Globe} right={
                                                <button onClick={() => exportCsv(gsc.countries as unknown as Record<string,unknown>[], 'paises-gsc.csv')}
                                                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors">
                                                    <Download size={10} /> CSV
                                                </button>
                                            }>Países</CardTitle>
                                            <GscTable rows={gsc.countries} keyLabel="País" />
                                        </Card>
                                        <Card>
                                            <CardTitle icon={Monitor}>Dispositivos</CardTitle>
                                            <GscTable rows={gsc.devices} keyLabel="Dispositivo" />
                                            {(() => {
                                                const mobile  = gsc.devices.find(d => d.key === 'MOBILE')
                                                const desktop = gsc.devices.find(d => d.key === 'DESKTOP')
                                                if (!mobile || !desktop || mobile.impressions === 0 || desktop.impressions === 0) return null
                                                const mobileCtr  = mobile.clicks / mobile.impressions
                                                const desktopCtr = desktop.clicks / desktop.impressions
                                                if (mobileCtr < desktopCtr * 0.6) {
                                                    return (
                                                        <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5 mt-3">
                                                            <AlertTriangle size={11} /> CTR mobile ({(mobileCtr*100).toFixed(1)}%) muito abaixo do desktop ({(desktopCtr*100).toFixed(1)}%) — revisar como o snippet aparece em telas pequenas.
                                                        </p>
                                                    )
                                                }
                                                return null
                                            })()}
                                        </Card>
                                    </div>
                                </div>
                            )
                        })()}
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
