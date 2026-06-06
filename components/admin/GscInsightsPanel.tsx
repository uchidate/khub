'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, MousePointerClick, Eye, ArrowDown, ExternalLink, Search } from 'lucide-react'

type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number }
type Opportunity = GscRow
type PageNoClick = GscRow
type FallingQuery = GscRow & { prevPosition: number; drop: number }
type Totals = { clicks: number; impressions: number; avgCtr: number; avgPosition: number }

type GscData = {
    totals: Totals
    opportunities: Opportunity[]
    pagesNoClick: PageNoClick[]
    fallingQueries: FallingQuery[]
    contentGaps: GscRow[]
}

type Tab = 'opportunities' | 'noclick' | 'falling'

const SITE = 'https://www.hallyuhub.com.br'

function pct(n: number) {
    return (n * 100).toFixed(1) + '%'
}

function shortUrl(url: string) {
    return url.replace(SITE, '') || '/'
}

export function GscInsightsPanel() {
    const [data, setData] = useState<GscData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>('opportunities')

    useEffect(() => {
        fetch('/api/admin/analytics/gsc')
            .then(r => r.json())
            .then(d => {
                if (d.error) setError(d.error)
                else setData(d)
            })
            .catch(e => setError(String(e)))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 w-40 bg-border rounded mb-4" />
            <div className="grid grid-cols-4 gap-3 mb-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-border rounded" />)}
            </div>
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-border rounded" />)}
            </div>
        </div>
    )

    if (error || !data) return (
        <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">Search Console</p>
            <p className="text-xs text-red-400">{error ?? 'Sem dados disponíveis'}</p>
        </div>
    )

    const { totals, opportunities, pagesNoClick, fallingQueries } = data

    const tabs: { id: Tab; label: string; count: number; color: string }[] = [
        { id: 'opportunities', label: 'Oportunidades', count: opportunities.length, color: 'text-amber-400' },
        { id: 'noclick',       label: 'Sem cliques',   count: pagesNoClick.length,  color: 'text-red-400' },
        { id: 'falling',       label: 'Caindo',        count: fallingQueries.length, color: 'text-orange-400' },
    ]

    return (
        <div className="bg-surface border border-border rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Search size={13} className="text-muted" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Search Console · 28 dias</p>
                </div>
                <a
                    href="https://search.google.com/search-console/performance/search-analytics?resource_id=sc-domain%3Ahallyuhub.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
                >
                    Abrir GSC <ExternalLink size={10} />
                </a>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                    { label: 'Cliques',    value: totals.clicks.toLocaleString('pt-BR'),      icon: <MousePointerClick size={12} />, color: 'text-blue-400' },
                    { label: 'Impressões', value: totals.impressions.toLocaleString('pt-BR'), icon: <Eye size={12} />,              color: 'text-purple-400' },
                    { label: 'CTR médio',  value: pct(totals.avgCtr),                         icon: <TrendingUp size={12} />,       color: 'text-emerald-400' },
                    { label: 'Posição',    value: `#${totals.avgPosition}`,                   icon: <ArrowDown size={12} />,        color: 'text-amber-400' },
                ].map(kpi => (
                    <div key={kpi.label} className="bg-background border border-border rounded-lg p-2.5">
                        <div className={`flex items-center gap-1 ${kpi.color} mb-1`}>{kpi.icon}</div>
                        <p className="text-base font-black text-foreground tabular-nums leading-none">{kpi.value}</p>
                        <p className="text-[9px] text-muted mt-0.5 uppercase tracking-wide">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 border-b border-border pb-2">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                            tab === t.id
                                ? 'bg-accent/10 text-accent border border-accent/30'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {t.label}
                        <span className={`text-[9px] font-black ${tab === t.id ? t.color : 'text-muted'}`}>{t.count}</span>
                    </button>
                ))}
            </div>

            {/* Tab: Oportunidades — queries pos 4-30, alta impressão, baixo CTR */}
            {tab === 'opportunities' && (
                <div className="space-y-0.5">
                    <p className="text-[9px] text-muted mb-2">Queries aparecendo muito mas sem cliques — melhorar title e description dessas páginas.</p>
                    {opportunities.slice(0, 8).map((row, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-hover group">
                            <span className="text-[9px] font-black text-muted tabular-nums w-4 shrink-0">#{Math.round(row.position)}</span>
                            <span className="text-xs text-foreground truncate flex-1 font-medium">{row.key}</span>
                            <span className="text-[10px] text-muted tabular-nums shrink-0">{row.impressions.toLocaleString('pt-BR')} imp</span>
                            <span className={`text-[10px] tabular-nums shrink-0 font-bold ${row.ctr < 0.02 ? 'text-red-400' : 'text-amber-400'}`}>{pct(row.ctr)}</span>
                        </div>
                    ))}
                    {opportunities.length > 8 && (
                        <Link href="/admin/analytics/gsc" className="block text-center text-[10px] text-muted hover:text-foreground pt-1 transition-colors">
                            + {opportunities.length - 8} mais no GSC completo
                        </Link>
                    )}
                </div>
            )}

            {/* Tab: Sem cliques — páginas com impressões mas 0 cliques */}
            {tab === 'noclick' && (
                <div className="space-y-0.5">
                    <p className="text-[9px] text-muted mb-2">Páginas aparecendo no Google mas sem nenhum clique — title/description fracos ou conteúdo raso.</p>
                    {pagesNoClick.slice(0, 8).map((row, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-hover">
                            <span className="text-xs text-foreground truncate flex-1 font-mono text-[10px]">{shortUrl(row.key)}</span>
                            <span className="text-[10px] text-muted tabular-nums shrink-0">{row.impressions.toLocaleString('pt-BR')} imp</span>
                            <span className="text-[10px] font-black text-red-400 shrink-0">0 cliques</span>
                            <a href={row.key} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-0 hover:opacity-100 group-hover:opacity-100">
                                <ExternalLink size={10} className="text-muted" />
                            </a>
                        </div>
                    ))}
                    {pagesNoClick.length > 8 && (
                        <Link href="/admin/analytics/gsc" className="block text-center text-[10px] text-muted hover:text-foreground pt-1 transition-colors">
                            + {pagesNoClick.length - 8} mais no analytics completo
                        </Link>
                    )}
                </div>
            )}

            {/* Tab: Caindo — queries que caíram posição */}
            {tab === 'falling' && (
                <div className="space-y-0.5">
                    <p className="text-[9px] text-muted mb-2">Queries que caíram mais de 3 posições vs. período anterior — conteúdo concorrente ou desatualizado.</p>
                    {fallingQueries.length === 0 && (
                        <p className="text-xs text-emerald-400 py-4 text-center">Nenhuma queda significativa detectada.</p>
                    )}
                    {fallingQueries.slice(0, 8).map((row, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-hover">
                            <span className="text-xs text-foreground truncate flex-1 font-medium">{row.key}</span>
                            <span className="text-[10px] text-muted tabular-nums shrink-0">era #{row.prevPosition}</span>
                            <span className="text-[10px] font-black text-orange-400 shrink-0 tabular-nums">▼{row.drop} → #{Math.round(row.position)}</span>
                        </div>
                    ))}
                    {fallingQueries.length > 8 && (
                        <Link href="/admin/analytics/gsc" className="block text-center text-[10px] text-muted hover:text-foreground pt-1 transition-colors">
                            + {fallingQueries.length - 8} mais no analytics completo
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
