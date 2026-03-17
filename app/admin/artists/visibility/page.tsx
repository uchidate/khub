'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import {
    Eye, EyeOff, RefreshCw, Search, Film, Shield,
    CheckCircle, Loader2, ExternalLink, ChevronDown, ChevronRight, UserX,
} from 'lucide-react'

type HideReason = 'adult_content' | 'hidden_productions' | 'no_productions'
type ReasonFilter = 'all' | 'no_productions' | 'hidden_productions' | 'adult_content'

interface Production {
    id: string
    titlePt: string
    isHidden: boolean
    flaggedAsNonKorean: boolean
    ageRating: string | null
    isAdultContent: boolean | null
}

interface ArtistItem {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    productionCount: number
    visibleProductionCount: number
    hideReason: HideReason
    productions: Production[]
}

interface Stats {
    totalAutoHidden: number
    manuallyHidden: number
    noProductions: number
    hiddenProductions: number
    adultContent: number
}

const REASON_CONFIG: Record<HideReason, { label: string; cls: string; description: string }> = {
    adult_content:      { label: 'Conteúdo adulto',     cls: 'bg-red-900/40 text-red-400 border-red-700/30',    description: 'Participa de produção com conteúdo sexual adulto — não pode ser mostrado automaticamente.' },
    hidden_productions: { label: 'Prod. ocultas/18+',   cls: 'bg-orange-900/40 text-orange-400 border-orange-700/30', description: 'Todas as produções estão ocultas ou têm classificação 18+.' },
    no_productions:     { label: 'Sem produções',        cls: 'bg-zinc-800 text-zinc-500 border-zinc-700',      description: 'Nenhuma produção vinculada.' },
}

const REASON_FILTERS: [ReasonFilter, string][] = [
    ['all',                'Todos'],
    ['hidden_productions', 'Prod. ocultas/18+'],
    ['no_productions',     'Sem produções'],
    ['adult_content',      'Conteúdo adulto'],
]

function ReasonBadge({ reason }: { reason: HideReason }) {
    const r = REASON_CONFIG[reason]
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.cls}`} title={r.description}>
            {r.label}
        </span>
    )
}

function ProductionPill({ prod }: { prod: Production }) {
    const isVisible = !prod.isHidden && prod.ageRating !== '18' && !prod.isAdultContent
    const cls = prod.isAdultContent
        ? 'bg-red-900/30 text-red-400'
        : prod.isHidden || prod.ageRating === '18'
            ? 'bg-zinc-800 text-zinc-600 line-through'
            : 'bg-green-900/30 text-green-400'
    return (
        <Link
            href={`/admin/productions/${prod.id}`}
            onClick={e => e.stopPropagation()}
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border border-white/5 hover:opacity-80 ${cls}`}
            title={
                prod.isAdultContent ? 'Conteúdo adulto'
                : prod.isHidden ? 'Oculta'
                : prod.ageRating === '18' ? 'Classificação 18+'
                : isVisible ? 'Visível'
                : 'Oculta'
            }
        >
            {prod.titlePt}
            {prod.flaggedAsNonKorean && <span className="opacity-50 text-[8px]">🇰🇷</span>}
        </Link>
    )
}

export default function ArtistVisibilityPage() {
    const [items, setItems] = useState<ArtistItem[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [total, setTotal] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all')
    const [q, setQ] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [showing, setShowing] = useState<Set<string>>(new Set())
    const [showDone, setShowDone] = useState<Set<string>>(new Set())
    const [reconciling, setReconciling] = useState(false)
    const [reconcileResult, setReconcileResult] = useState<string | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const fetchData = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams({ reason: reasonFilter, page: String(page), limit: '30' })
        if (q) params.set('q', q)
        const res = await fetch(`/api/admin/artists/visibility?${params}`)
        if (res.ok) {
            const data = await res.json()
            setItems(data.items)
            setTotal(data.total)
            setTotalPages(data.totalPages)
            setStats(data.stats)
        }
        setLoading(false)
    }, [reasonFilter, page, q])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { setPage(1); setSelected(new Set()) }, [reasonFilter, q])

    const handleShow = async (ids: string[]) => {
        ids.forEach(id => setShowing(prev => { const n = new Set(prev); n.add(id); return n }))
        try {
            await fetch('/api/admin/artists/visibility', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'show', ids }),
            })
            ids.forEach(id => {
                setShowing(prev => { const n = new Set(prev); n.delete(id); return n })
                setShowDone(prev => { const n = new Set(prev); n.add(id); return n })
            })
            setSelected(new Set())
            setTimeout(() => {
                ids.forEach(id => setShowDone(prev => { const n = new Set(prev); n.delete(id); return n }))
                fetchData()
            }, 1500)
        } catch {
            ids.forEach(id => setShowing(prev => { const n = new Set(prev); n.delete(id); return n }))
        }
    }

    const handleReconcile = async () => {
        setReconciling(true)
        setReconcileResult(null)
        try {
            const res = await fetch('/api/admin/artists/visibility', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reconcile' }),
            })
            const data = await res.json()
            setReconcileResult(`${data.shown ?? 0} mostrados · ${data.hidden ?? 0} ocultados · ${data.processed ?? 0} processados`)
            fetchData()
        } finally {
            setReconciling(false)
        }
    }

    const toggleSelect = (id: string, reason: HideReason) => {
        if (reason === 'adult_content') return
        setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
    }

    const statCards = [
        { label: 'Auto-ocultos total', value: stats?.totalAutoHidden, cls: 'text-amber-400' },
        { label: 'Prod. ocultas/18+',  value: stats?.hiddenProductions, cls: 'text-orange-400' },
        { label: 'Sem produções',      value: stats?.noProductions,     cls: 'text-zinc-500' },
        { label: 'Conteúdo adulto',    value: stats?.adultContent,      cls: 'text-red-400' },
    ]

    return (
        <AdminLayout title="Visibilidade de Artistas">
            <div className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {statCards.map(({ label, value, cls }) => (
                        <div key={label} className="p-4 rounded-xl border border-white/10 bg-zinc-900">
                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
                            <div className={`text-2xl font-black ${cls}`}>{value ?? '—'}</div>
                        </div>
                    ))}
                </div>

                {/* Explicação */}
                <div className="px-4 py-3 rounded-xl border border-zinc-700/40 bg-zinc-900/60 text-xs text-zinc-400 space-y-1.5">
                    <p className="font-semibold text-zinc-300">Como funciona o auto-hide de artistas</p>
                    <p>Um artista fica <span className="text-amber-400">auto-oculto</span> quando não possui nenhuma produção visível. Produção visível = <span className="text-zinc-200">não está oculta + classificação não é 18+ + não é conteúdo adulto sexual.</span></p>
                    <p>Artistas com conteúdo adulto sexual <span className="text-red-400 font-medium">não podem ser mostrados</span> aqui — precisam ser tratados na página de moderação.</p>
                    <p>Usar <span className="text-green-400 font-medium">Mostrar</span> seta <code className="bg-zinc-800 px-1 rounded">autoHidden=false</code> — o sistema deixa de re-ocultar esse artista nos próximos ciclos de reconciliação.</p>
                </div>

                {/* Filtros + ações */}
                <div className="bg-zinc-900 rounded-xl border border-white/10">
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <input
                                type="text"
                                placeholder="Buscar artista..."
                                value={q}
                                onChange={e => setQ(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {REASON_FILTERS.map(([val, label]) => (
                                <button key={val} onClick={() => setReasonFilter(val)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                                        reasonFilter === val ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                                    }`}
                                >
                                    {label}
                                    {val === 'hidden_productions' && stats && <span className="ml-1.5 opacity-60 font-normal">{stats.hiddenProductions}</span>}
                                    {val === 'no_productions'     && stats && <span className="ml-1.5 opacity-60 font-normal">{stats.noProductions}</span>}
                                    {val === 'adult_content'      && stats && <span className="ml-1.5 opacity-60 font-normal">{stats.adultContent}</span>}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <button onClick={fetchData} className="p-1.5 text-zinc-600 hover:text-zinc-400" title="Recarregar">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={handleReconcile}
                                disabled={reconciling}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-300 border border-white/10 rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                                title="Reavalia todos os artistas auto-ocultos (max 500)"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
                                {reconciling ? 'Reconciliando...' : 'Reconciliar tudo'}
                            </button>
                        </div>
                    </div>

                    {reconcileResult && (
                        <div className="px-4 py-2 text-xs text-green-400 bg-green-900/10 border-b border-green-900/20">
                            Reconciliação: {reconcileResult}
                        </div>
                    )}

                    {selected.size > 0 && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 border-b border-purple-700/20">
                            <span className="text-xs text-zinc-400">{selected.size} selecionados</span>
                            <button
                                onClick={() => handleShow(Array.from(selected))}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <Eye className="w-3 h-3" /> Mostrar selecionados
                            </button>
                            <button onClick={() => setSelected(new Set())} className="text-xs text-zinc-600 hover:text-zinc-400">Limpar</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-8 text-center text-zinc-600 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-8 text-center text-zinc-600">Nenhum artista encontrado</div>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {items.map(item => {
                                const isShowing = showing.has(item.id)
                                const isDone = showDone.has(item.id)
                                const isSelected = selected.has(item.id)
                                const isExpanded = expanded.has(item.id)
                                const canShow = item.hideReason !== 'adult_content'
                                return (
                                    <li key={item.id} className={isSelected ? 'bg-purple-900/10' : ''}>
                                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(item.id, item.hideReason)}
                                                disabled={!canShow}
                                                className="accent-purple-500 cursor-pointer w-3.5 h-3.5 flex-shrink-0 disabled:opacity-30"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-zinc-100">{item.nameRomanized}</span>
                                                    {item.nameHangul && <span className="text-xs text-zinc-600">{item.nameHangul}</span>}
                                                    <ReasonBadge reason={item.hideReason} />
                                                </div>
                                                {item.productionCount > 0 ? (
                                                    <button
                                                        onClick={() => toggleExpand(item.id)}
                                                        className="mt-1 flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400"
                                                    >
                                                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        {item.productionCount} produção{item.productionCount !== 1 ? 'ões' : ''}
                                                        {item.visibleProductionCount > 0 && (
                                                            <span className="text-green-500 ml-1">· {item.visibleProductionCount} visível{item.visibleProductionCount !== 1 ? 'eis' : ''}</span>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-700">
                                                        <Film className="w-3 h-3" /> Sem produções
                                                    </div>
                                                )}
                                                {isExpanded && item.productions.length > 0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {item.productions.map(p => <ProductionPill key={p.id} prod={p} />)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Link href={`/artists/${item.id}`} target="_blank"
                                                    onClick={e => e.stopPropagation()}
                                                    className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors"
                                                    title="Ver página pública"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                                <Link href={`/admin/artists/${item.id}`}
                                                    className="p-1 text-zinc-700 hover:text-zinc-400 transition-colors"
                                                    title="Editar no admin"
                                                >
                                                    <UserX className="w-3.5 h-3.5" />
                                                </Link>
                                                {canShow && (
                                                    <button
                                                        onClick={() => handleShow([item.id])}
                                                        disabled={isShowing || isDone}
                                                        className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-colors disabled:opacity-50 ${
                                                            isDone
                                                                ? 'bg-green-900/40 text-green-400 border-green-700/30'
                                                                : 'bg-zinc-800 text-zinc-400 border-white/10 hover:bg-green-900/30 hover:text-green-400 hover:border-green-700/30'
                                                        }`}
                                                    >
                                                        {isShowing ? <Loader2 className="w-3 h-3 animate-spin" />
                                                            : isDone ? <CheckCircle className="w-3 h-3" />
                                                            : <Eye className="w-3 h-3" />}
                                                        {isDone ? 'Mostrado' : 'Mostrar'}
                                                    </button>
                                                )}
                                                {!canShow && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] text-red-500/60 border border-red-900/20 rounded-lg">
                                                        <Shield className="w-3 h-3" /> Restrito
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}

                    {total > 30 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                            <span className="text-xs text-zinc-600">{total} artistas</span>
                            <div className="flex gap-2 items-center">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="px-3 py-1 text-xs border border-white/10 rounded-lg disabled:opacity-40 hover:bg-zinc-800 text-zinc-400">
                                    Anterior
                                </button>
                                <span className="text-xs text-zinc-500">Página {page} de {totalPages}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                                    className="px-3 py-1 text-xs border border-white/10 rounded-lg disabled:opacity-40 hover:bg-zinc-800 text-zinc-400">
                                    Próxima
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}
