'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Search, Eye, MousePointerClick, TrendingUp, ArrowUpRight,
    RefreshCw, ExternalLink, Loader2, AlertTriangle, Target,
    ArrowDown, Filter, ArrowUpDown, Layers, Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number }
type GscFalling = GscRow & { prevPosition: number; drop: number }
type GscTotals = { clicks: number; impressions: number; avgCtr: number; avgPosition: number }
type GscSectionHealth = { section: string; clicks: number; impressions: number; ctr: number; avgPosition: number; pageCount: number }
type GscCtrBucket = { label: string; expected: number; actual: number; count: number; impressions: number; clicks: number }
type GscBrand = { brand: { clicks: number; impressions: number; count: number }; generic: { clicks: number; impressions: number; count: number } }
type GscQueryPage = { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number }
type GscData = {
    topQueries: GscRow[]; topPages: GscRow[]; dailyTrend: { date: string; clicks: number; impressions: number }[]
    opportunities: GscRow[]; pagesNoClick: GscRow[]; fallingQueries: GscFalling[]
    sectionHealth: GscSectionHealth[]; ctrBuckets: GscCtrBucket[]
    brandVsGeneric: GscBrand; queryByPage: GscQueryPage[]; contentGaps: GscRow[]
    totals: GscTotals; days: number
}

type Tab = 'opportunities' | 'queries' | 'pages' | 'gaps' | 'falling' | 'sections'
type SortKey = 'impressions' | 'clicks' | 'ctr' | 'position'
type Days = 7 | 28 | 90

const SITE = 'https://www.hallyuhub.com.br'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number) { return `${(n * 100).toFixed(1)}%` }
function fmtN(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return n.toLocaleString('pt-BR')
}
function shortUrl(url: string) { return url.replace(SITE, '') || '/' }

function ctrColor(ctr: number) {
    if (ctr >= 0.05) return 'text-emerald-400'
    if (ctr >= 0.02) return 'text-amber-400'
    return 'text-red-400'
}

function posColor(pos: number) {
    if (pos <= 3) return 'text-emerald-400'
    if (pos <= 10) return 'text-amber-400'
    return 'text-muted'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, color = 'text-foreground' }: {
    icon: React.ElementType; label: string; value: string; sub?: string; color?: string
}) {
    return (
        <div className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
                <Icon size={14} className="text-muted" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted">{label}</span>
            </div>
            <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
            {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
        </div>
    )
}

function RowTable({ rows, dim, sort, onSort }: {
    rows: GscRow[]
    dim: 'query' | 'page'
    sort: SortKey
    onSort: (k: SortKey) => void
}) {
    const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
        <button
            onClick={() => onSort(k)}
            className={`flex items-center gap-1 hover:text-foreground transition-colors ${sort === k ? 'text-accent font-black' : 'text-muted'}`}
        >
            {label}
            <ArrowUpDown size={10} />
        </button>
    )

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest w-8">#</th>
                        <th className="text-left py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">{dim === 'query' ? 'Query' : 'Página'}</th>
                        <th className="text-right py-2 px-3"><SortBtn k="impressions" label="Imp" /></th>
                        <th className="text-right py-2 px-3"><SortBtn k="clicks" label="Cliques" /></th>
                        <th className="text-right py-2 px-3"><SortBtn k="ctr" label="CTR" /></th>
                        <th className="text-right py-2 px-3"><SortBtn k="position" label="Pos" /></th>
                        <th className="w-8" />
                    </tr>
                </thead>
                <tbody>
                    {rows.slice(0, 50).map((r, i) => (
                        <tr key={r.key} className="border-b border-border/30 hover:bg-surface-hover transition-colors group">
                            <td className="py-2 px-3 text-[10px] text-muted tabular-nums">{i + 1}</td>
                            <td className="py-2 px-3 max-w-[360px]">
                                <span className={`font-medium text-foreground ${dim === 'page' ? 'font-mono text-[10px]' : ''}`}>
                                    {dim === 'page' ? shortUrl(r.key) : r.key}
                                </span>
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-muted">{fmtN(r.impressions)}</td>
                            <td className="py-2 px-3 text-right tabular-nums font-semibold text-foreground">{fmtN(r.clicks)}</td>
                            <td className={`py-2 px-3 text-right tabular-nums font-black ${ctrColor(r.ctr)}`}>{pct(r.ctr)}</td>
                            <td className={`py-2 px-3 text-right tabular-nums font-bold ${posColor(r.position)}`}>#{r.position.toFixed(1)}</td>
                            <td className="py-2 px-3">
                                <a
                                    href={dim === 'page' ? r.key : `${SITE}/?q=${encodeURIComponent(r.key)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ExternalLink size={10} className="text-muted" />
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length > 50 && (
                <p className="text-center text-[10px] text-muted py-3">+ {rows.length - 50} linhas ocultas</p>
            )}
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GscPage() {
    const [data, setData] = useState<GscData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [days, setDays] = useState<Days>(28)
    const [tab, setTab] = useState<Tab>('opportunities')
    const [sort, setSort] = useState<SortKey>('impressions')
    const [filter, setFilter] = useState('')

    const load = useCallback((d: Days) => {
        setLoading(true)
        setError(null)
        fetch(`/api/admin/analytics/gsc?days=${d}`)
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error)
                else setData(d)
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load(days) }, [load, days])

    function sorted(rows: GscRow[]): GscRow[] {
        return [...rows].sort((a, b) => {
            if (sort === 'position') return a.position - b.position
            if (sort === 'ctr') return b.ctr - a.ctr
            if (sort === 'clicks') return b.clicks - a.clicks
            return b.impressions - a.impressions
        })
    }

    function filtered(rows: GscRow[]): GscRow[] {
        if (!filter) return rows
        const q = filter.toLowerCase()
        return rows.filter(r => r.key.toLowerCase().includes(q))
    }

    const tabs: { id: Tab; label: string; count?: number; icon: React.ElementType }[] = [
        { id: 'opportunities', label: 'Oportunidades', count: data?.opportunities.length, icon: Target },
        { id: 'queries',       label: 'Queries',        count: data?.topQueries.length,    icon: Search },
        { id: 'pages',         label: 'Páginas',         count: data?.topPages.length,     icon: Layers },
        { id: 'gaps',          label: 'Content Gaps',   count: data?.contentGaps.length,   icon: Zap },
        { id: 'falling',       label: 'Caindo',          count: data?.fallingQueries.length, icon: ArrowDown },
        { id: 'sections',      label: 'Seções',          count: data?.sectionHealth.length, icon: Filter },
    ]

    return (
        <AdminLayout title="Search Console" subtitle="Queries, CTR e oportunidades de SEO orgânico">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-foreground">Search Console</h1>
                    {data && <p className="text-sm text-muted mt-0.5">· {data.days} dias · dados até ~3 dias atrás</p>}
                </div>
                <div className="flex items-center gap-2">
                    {/* Date range */}
                    {([7, 28, 90] as Days[]).map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                days === d
                                    ? 'bg-accent/10 text-accent border-accent/30'
                                    : 'border-border text-muted hover:text-foreground hover:border-foreground/30'
                            }`}
                        >
                            {d}d
                        </button>
                    ))}
                    <button
                        onClick={() => load(days)}
                        disabled={loading}
                        className="p-2 rounded-lg border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    </button>
                    <a
                        href="https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Ahallyuhub.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted border border-border rounded-lg hover:text-foreground hover:border-foreground/30 transition-all"
                    >
                        Abrir GSC <ExternalLink size={12} />
                    </a>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-red-400">Erro ao carregar dados</p>
                        <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* KPIs */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <KpiCard icon={MousePointerClick} label="Cliques orgânicos" value={fmtN(data.totals.clicks)} color="text-blue-400" />
                    <KpiCard icon={Eye}              label="Impressões"         value={fmtN(data.totals.impressions)} color="text-purple-400" />
                    <KpiCard icon={TrendingUp}       label="CTR médio"          value={pct(data.totals.avgCtr)} color={ctrColor(data.totals.avgCtr)} />
                    <KpiCard icon={ArrowUpRight}     label="Posição média"      value={`#${data.totals.avgPosition.toFixed(1)}`} color={posColor(data.totals.avgPosition)} />
                </div>
            )}

            {/* Brand vs Generic */}
            {data?.brandVsGeneric && (
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {([
                        { key: 'brand',   label: 'Marca (hallyuhub)',    color: 'text-pink-400',    bg: 'bg-pink-500/5 border-pink-500/20' },
                        { key: 'generic', label: 'Orgânico genérico',     color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
                    ] as const).map(({ key, label, color, bg }) => {
                        const d = data.brandVsGeneric[key]
                        return (
                            <div key={key} className={`border rounded-xl p-4 ${bg}`}>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${color} mb-2`}>{label}</p>
                                <div className="flex items-end gap-4">
                                    <div>
                                        <p className="text-xl font-black text-foreground tabular-nums">{fmtN(d.clicks)}</p>
                                        <p className="text-[10px] text-muted">cliques</p>
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-foreground tabular-nums">{fmtN(d.impressions)}</p>
                                        <p className="text-[10px] text-muted">impressões</p>
                                    </div>
                                    <div>
                                        <p className={`text-xl font-black tabular-nums ${color}`}>{d.impressions > 0 ? pct(d.clicks / d.impressions) : '—'}</p>
                                        <p className="text-[10px] text-muted">CTR</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* CTR por posição */}
            {data?.ctrBuckets && data.ctrBuckets.length > 0 && (
                <div className="bg-surface border border-border rounded-xl p-4 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">CTR por posição vs. benchmark</p>
                    <div className="space-y-2">
                        {data.ctrBuckets.map(b => {
                            const ratio = b.expected > 0 ? b.actual / b.expected : 0
                            const barW = Math.min(100, ratio * 100)
                            const barColor = ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-red-500'
                            return (
                                <div key={b.label} className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-muted w-20 shrink-0">{b.label}</span>
                                    <div className="flex-1 bg-border/30 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${barW}%` }} />
                                    </div>
                                    <span className={`text-[10px] font-black tabular-nums w-12 text-right ${ratio >= 0.8 ? 'text-emerald-400' : ratio >= 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                                        {pct(b.actual)}
                                    </span>
                                    <span className="text-[10px] text-muted/50 tabular-nums w-12 text-right">/{pct(b.expected)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-0 border-b border-border overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-r border-border last:border-r-0 ${
                                tab === t.id
                                    ? 'bg-accent/10 text-accent border-b-2 border-b-accent'
                                    : 'text-muted hover:text-foreground hover:bg-surface-hover'
                            }`}
                        >
                            <t.icon size={11} />
                            {t.label}
                            {t.count !== undefined && (
                                <span className={`text-[9px] font-black px-1 rounded ${tab === t.id ? 'bg-accent/20 text-accent' : 'bg-border text-muted'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {loading && (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 size={20} className="animate-spin text-muted" />
                        </div>
                    )}

                    {!loading && data && (
                        <>
                            {/* Filter bar (for queries/pages) */}
                            {(tab === 'queries' || tab === 'pages') && (
                                <div className="flex items-center gap-2 mb-4">
                                    <Search size={12} className="text-muted" />
                                    <input
                                        type="text"
                                        value={filter}
                                        onChange={e => setFilter(e.target.value)}
                                        placeholder="Filtrar por termo..."
                                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 w-64"
                                    />
                                    {filter && (
                                        <button onClick={() => setFilter('')} className="text-[10px] text-muted hover:text-foreground">
                                            limpar
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Tab: Oportunidades */}
                            {tab === 'opportunities' && (
                                <div>
                                    <p className="text-xs text-muted mb-4">
                                        Queries na posição 4–30 com impressões altas mas CTR baixo.
                                        Melhorar o <strong>title</strong> e <strong>meta description</strong> dessas páginas pode capturar esses cliques sem subir de posição.
                                    </p>
                                    {data.opportunities.length === 0 ? (
                                        <p className="text-center text-emerald-400 text-sm py-8">Nenhuma oportunidade detectada — bom sinal!</p>
                                    ) : (
                                        <RowTable rows={sorted(data.opportunities)} dim="query" sort={sort} onSort={setSort} />
                                    )}
                                </div>
                            )}

                            {/* Tab: Queries */}
                            {tab === 'queries' && (
                                <RowTable rows={sorted(filtered(data.topQueries))} dim="query" sort={sort} onSort={setSort} />
                            )}

                            {/* Tab: Páginas */}
                            {tab === 'pages' && (
                                <div>
                                    {data.pagesNoClick.length > 0 && (
                                        <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">
                                                {data.pagesNoClick.length} páginas com impressões mas 0 cliques
                                            </p>
                                            <p className="text-[10px] text-muted">Title/description fracos ou conteúdo raso. <Link href="/admin/seo" className="text-accent hover:underline">Editar SEO →</Link></p>
                                        </div>
                                    )}
                                    <RowTable rows={sorted(filtered(data.topPages))} dim="page" sort={sort} onSort={setSort} />
                                </div>
                            )}

                            {/* Tab: Content Gaps */}
                            {tab === 'gaps' && (
                                <div>
                                    <p className="text-xs text-muted mb-4">
                                        Queries com impressões altas mas sem página dedicada de alta relevância no site.
                                        Considere criar hubs, artigos de blog ou otimizar a landing page atual para essas queries.
                                    </p>
                                    {data.contentGaps.length === 0 ? (
                                        <p className="text-center text-emerald-400 text-sm py-8">Sem gaps detectados.</p>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {data.contentGaps.map((r, i) => (
                                                <div key={r.key} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-surface-hover">
                                                    <span className="text-[10px] text-muted tabular-nums w-6">{i + 1}</span>
                                                    <span className="flex-1 text-sm font-medium text-foreground">{r.key}</span>
                                                    <span className="text-[10px] text-muted tabular-nums">{fmtN(r.impressions)} imp</span>
                                                    <span className={`text-[10px] font-bold tabular-nums ${ctrColor(r.ctr)}`}>{pct(r.ctr)}</span>
                                                    <span className="text-[10px] text-muted tabular-nums">#{r.position.toFixed(0)}</span>
                                                    <Link
                                                        href={`/admin/blog?q=${encodeURIComponent(r.key)}`}
                                                        className="text-[10px] text-accent hover:underline shrink-0"
                                                    >
                                                        criar artigo →
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Falling */}
                            {tab === 'falling' && (
                                <div>
                                    <p className="text-xs text-muted mb-4">
                                        Queries que caíram mais de 3 posições vs. período anterior — conteúdo desatualizado ou concorrência subindo.
                                    </p>
                                    {data.fallingQueries.length === 0 ? (
                                        <p className="text-center text-emerald-400 text-sm py-8">Nenhuma queda significativa — bom sinal!</p>
                                    ) : (
                                        <div className="space-y-0.5">
                                            {data.fallingQueries.map((r, i) => (
                                                <div key={r.key} className="flex items-center gap-3 py-2 px-3 rounded hover:bg-surface-hover">
                                                    <span className="text-[10px] text-muted tabular-nums w-6">{i + 1}</span>
                                                    <span className="flex-1 text-sm font-medium text-foreground">{r.key}</span>
                                                    <span className="text-[10px] text-muted">era #{r.prevPosition}</span>
                                                    <span className="text-[10px] font-black text-orange-400 tabular-nums">▼{r.drop.toFixed(1)} → #{r.position.toFixed(0)}</span>
                                                    <span className="text-[10px] text-muted tabular-nums">{fmtN(r.impressions)} imp</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Sections */}
                            {tab === 'sections' && (
                                <div>
                                    <p className="text-xs text-muted mb-4">Performance por seção do site — útil para identificar áreas com CTR abaixo do esperado.</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="border-b border-border">
                                                    <th className="text-left py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">Seção</th>
                                                    <th className="text-right py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">Imp</th>
                                                    <th className="text-right py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">Cliques</th>
                                                    <th className="text-right py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">CTR</th>
                                                    <th className="text-right py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">Pos</th>
                                                    <th className="text-right py-2 px-3 font-mono text-[10px] text-muted uppercase tracking-widest">Páginas</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.sectionHealth.map(s => (
                                                    <tr key={s.section} className="border-b border-border/30 hover:bg-surface-hover">
                                                        <td className="py-2 px-3 font-mono text-foreground">{s.section}</td>
                                                        <td className="py-2 px-3 text-right tabular-nums text-muted">{fmtN(s.impressions)}</td>
                                                        <td className="py-2 px-3 text-right tabular-nums font-semibold text-foreground">{fmtN(s.clicks)}</td>
                                                        <td className={`py-2 px-3 text-right tabular-nums font-black ${ctrColor(s.ctr)}`}>{pct(s.ctr)}</td>
                                                        <td className={`py-2 px-3 text-right tabular-nums font-bold ${posColor(s.avgPosition)}`}>#{s.avgPosition.toFixed(1)}</td>
                                                        <td className="py-2 px-3 text-right tabular-nums text-muted">{s.pageCount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
