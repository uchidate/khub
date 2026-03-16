'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useToast } from '@/lib/hooks/useToast'
import Image from 'next/image'
import {
    Sparkles, Loader2, RefreshCw, Users, Film, Newspaper,
    CheckCircle, DollarSign, ChevronRight, Play, Search, X, Zap,
} from 'lucide-react'

type Tab = 'artists' | 'productions' | 'news'

interface QueueItem {
    id:                string
    name:              string
    imageUrl?:         string
    subtitle?:         string
    missingFields:     string[]
    presentFields:     string[]
    totalFields:       number
    completenessScore: number
    priority:          number
    estimatedCost:     number
}

interface QueueData {
    items:             QueueItem[]
    total:             number
    totalCostEstimate: number
}

interface BudgetStatus { feature: string; allowed: boolean; [k: string]: unknown }
interface StatsData {
    counts:        Record<string, number>
    totalEstimate: number
    budgets:       BudgetStatus[] | undefined
}

// Field display config per tab
const FIELD_LABELS: Record<Tab, Record<string, { label: string; target: string }>> = {
    artists: {
        bio:          { label: 'Bio',         target: 'artist_bio' },
        editorial:    { label: 'Projetos',     target: 'artist_editorial' },
        curiosidades: { label: 'Curiosidades', target: 'artist_curiosidades' },
    },
    productions: {
        review: { label: 'Review', target: 'production_review' },
    },
    news: {
        nota: { label: 'Nota',      target: 'news_editorial_note' },
        blog: { label: 'Blog Post', target: 'news_blog_post' },
    },
}

// Maps field key → stats count key (from GET /api/admin/enrichment)
const STATS_COUNT_KEYS: Record<Tab, Record<string, string>> = {
    artists:     { bio: 'artist_bio', editorial: 'artist_editorial', curiosidades: 'artist_curiosidades' },
    productions: { review: 'production_review' },
    news:        { nota: 'news_editorial_note', blog: 'news_blog_post' },
}

// Maps field key → budget feature key
const BUDGET_FEATURE_KEYS: Record<Tab, Record<string, string>> = {
    artists:     { bio: 'artist_bio_enrichment', editorial: 'artist_editorial', curiosidades: 'artist_curiosidades' },
    productions: { review: 'production_review' },
    news:        { nota: 'news_editorial_note', blog: 'blog_post_generation' },
}

const TAB_CONFIG: Record<Tab, { label: string; icon: React.ElementType; batchLimit: number }> = {
    artists:     { label: 'Artistas',  icon: Users,     batchLimit: 10 },
    productions: { label: 'Produções', icon: Film,      batchLimit: 5  },
    news:        { label: 'Notícias',  icon: Newspaper, batchLimit: 20 },
}

function CompletenessBar({ score, present, total }: { score: number; present: number; total: number }) {
    const color = score === 100 ? 'bg-emerald-500' : score > 0 ? 'bg-blue-500' : 'bg-zinc-700'
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[10px] text-zinc-500 shrink-0">{present}/{total}</span>
        </div>
    )
}

function EnrichButton({
    label, entityId, target, disabled, present, onDone, onError,
}: {
    label:    string
    entityId: string
    target:   string
    disabled: boolean
    present:  boolean
    onDone:   (entityId: string, field: string) => void
    onError:  (msg: string) => void
}) {
    const [loading,  setLoading]  = useState(false)
    const [justDone, setJustDone] = useState(false)
    const [error,    setError]    = useState(false)

    const fieldKey = target.split('_').slice(1).join('_') || target

    async function handleClick() {
        if (loading || disabled) return
        setLoading(true)
        setError(false)
        try {
            const res  = await fetch('/api/admin/enrichment', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ target, entityId }),
            })
            const data = await res.json()
            if (res.ok && data.processed > 0) {
                setJustDone(true)
                onDone(entityId, fieldKey)
                setTimeout(() => setJustDone(false), 2000)
            } else {
                setError(true)
                onError(data.error ?? 'Erro ao enriquecer')
            }
        } catch {
            setError(true)
            onError('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    if (justDone) {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle className="w-3 h-3" /> Feito
            </span>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading || disabled}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-all disabled:opacity-40 ${
                error
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                    : present
                        ? 'bg-zinc-800/60 border border-white/8 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200'
                        : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
            }`}
        >
            {loading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : present ? <RefreshCw className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />
            }
            {loading ? 'Gerando...' : label}
        </button>
    )
}

function ProcessAllButton({
    item, fieldMap, disabled, onDone, onError,
}: {
    item:     QueueItem
    fieldMap: Record<string, { label: string; target: string }>
    disabled: boolean
    onDone:   (entityId: string, field: string) => void
    onError:  (msg: string) => void
}) {
    const [loading,  setLoading]  = useState(false)
    const [justDone, setJustDone] = useState(false)

    const missing = item.missingFields
        .map(f => ({ field: f, ...fieldMap[f] }))
        .filter(c => c.target)

    if (missing.length === 0) return null

    async function handleClick() {
        if (loading || disabled) return
        setLoading(true)
        try {
            for (const c of missing) {
                const res  = await fetch('/api/admin/enrichment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ target: c.target, entityId: item.id }),
                })
                const data = await res.json()
                if (res.ok && data.processed > 0) onDone(item.id, c.field)
                else onError(data.error ?? `Erro em ${c.label}`)
            }
            setJustDone(true)
            setTimeout(() => setJustDone(false), 2000)
        } catch {
            onError('Erro de rede')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading || disabled}
            title={`Gerar: ${missing.map(c => c.label).join(', ')}`}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all disabled:opacity-40"
        >
            {justDone
                ? <CheckCircle className="w-3 h-3" />
                : loading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Zap className="w-3 h-3" />
            }
            {justDone ? 'Feito' : loading ? 'Gerando...' : 'Tudo'}
        </button>
    )
}

export default function EnrichmentPage() {
    const addToast    = useToast(s => s.addToast)
    const showError   = useCallback((msg: string) => addToast({ type: 'error',   message: msg, duration: 5000 }), [addToast])
    const showSuccess = useCallback((msg: string) => addToast({ type: 'success', message: msg, duration: 3000 }), [addToast])

    const [activeTab,           setActiveTab]           = useState<Tab>('artists')
    const [queue,               setQueue]               = useState<Record<Tab, QueueData | null>>({ artists: null, productions: null, news: null })
    const [stats,               setStats]               = useState<StatsData | null>(null)
    const [loading,             setLoading]             = useState(false)
    const [batchRunning,        setBatchRunning]        = useState(false)
    const [batchProgress,       setBatchProgress]       = useState<string | null>(null)
    const [searchQuery,         setSearchQuery]         = useState('')
    const [searchInput,         setSearchInput]         = useState('')
    const [searchResults,       setSearchResults]       = useState<QueueData | null>(null)
    const [fieldFilter,         setFieldFilter]         = useState<string>('all')
    const [selectedBatchFields, setSelectedBatchFields] = useState<Set<string>>(
        new Set(Object.keys(FIELD_LABELS.artists))
    )

    const fetchQueue = useCallback(async (tab: Tab) => {
        setLoading(true)
        try {
            const res  = await fetch(`/api/admin/enrichment/queue?tab=${tab}&limit=30`)
            const data = await res.json() as QueueData
            setQueue(prev => ({ ...prev, [tab]: data }))
        } catch {
            showError('Erro ao carregar fila')
        } finally {
            setLoading(false)
        }
    }, [showError])

    const fetchStats = useCallback(async () => {
        try {
            const res  = await fetch('/api/admin/enrichment')
            const data = await res.json() as StatsData
            setStats(data)
        } catch { /* silently fail */ }
    }, [])

    const fetchSearch = useCallback(async (q: string, tab: Tab) => {
        if (!q.trim()) { setSearchResults(null); return }
        setLoading(true)
        try {
            const res  = await fetch(`/api/admin/enrichment/queue?tab=${tab}&limit=20&q=${encodeURIComponent(q)}`)
            const data = await res.json() as QueueData
            setSearchResults(data)
        } catch {
            showError('Erro na busca')
        } finally {
            setLoading(false)
        }
    }, [showError])

    useEffect(() => {
        fetchQueue(activeTab)
        setFieldFilter('all')
        setSelectedBatchFields(new Set(Object.keys(FIELD_LABELS[activeTab])))
    }, [activeTab, fetchQueue])

    useEffect(() => { fetchStats() }, [fetchStats])

    useEffect(() => {
        if (!searchQuery) { setSearchResults(null); return }
        fetchSearch(searchQuery, activeTab)
    }, [searchQuery, activeTab, fetchSearch])

    function handleItemDone(entityId: string, field: string) {
        const update = (tabData: QueueData | null): QueueData | null => {
            if (!tabData) return tabData
            return {
                ...tabData,
                items: tabData.items.map(item => {
                    if (item.id !== entityId) return item
                    const missingFields = item.missingFields.filter(f => f !== field)
                    const presentFields = [...item.presentFields, field]
                    return {
                        ...item, missingFields, presentFields,
                        completenessScore: Math.round((presentFields.length / item.totalFields) * 100),
                    }
                }),
            }
        }
        setQueue(prev => ({ ...prev, [activeTab]: update(prev[activeTab]) }))
        if (searchResults) setSearchResults(prev => prev ? update(prev) : null)
    }

    async function runBatch() {
        const fieldMap = FIELD_LABELS[activeTab]
        const targets  = Object.entries(fieldMap)
            .filter(([key]) => selectedBatchFields.has(key))
            .map(([, c]) => ({ label: c.label, target: c.target }))

        if (targets.length === 0) { showError('Selecione pelo menos um campo'); return }

        const limit = TAB_CONFIG[activeTab].batchLimit
        setBatchRunning(true)
        try {
            for (const { label, target } of targets) {
                setBatchProgress(`Gerando ${label}...`)
                const res  = await fetch('/api/admin/enrichment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ target, limit }),
                })
                const data = await res.json()
                if (!res.ok) { showError(data.error ?? `Erro em ${target}`); continue }
                if (data.processed > 0) showSuccess(`${data.processed} ${label} gerados`)
            }
            await Promise.all([fetchQueue(activeTab), fetchStats()])
        } catch {
            showError('Erro no lote')
        } finally {
            setBatchRunning(false)
            setBatchProgress(null)
        }
    }

    function toggleBatchField(key: string) {
        setSelectedBatchFields(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const isSearching  = searchQuery.trim().length > 0
    const currentQueue = isSearching ? searchResults : queue[activeTab]
    const allItems     = currentQueue?.items ?? []
    const visibleItems = fieldFilter === 'all'
        ? allItems
        : allItems.filter(item => item.missingFields.includes(fieldFilter))
    const totalInQueue = currentQueue?.total ?? 0
    const cfg          = TAB_CONFIG[activeTab]
    const fieldMap     = FIELD_LABELS[activeTab]
    const statsKeys    = STATS_COUNT_KEYS[activeTab]
    const budgetKeys   = BUDGET_FEATURE_KEYS[activeTab]

    return (
        <AdminLayout title="Smart Queue — Enriquecimento">
            <div className="space-y-5">

                {/* Stats bar */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(statsKeys).map(([fieldKey, countKey]) => {
                            const count     = stats.counts[countKey] ?? 0
                            const label     = fieldMap[fieldKey]?.label ?? fieldKey
                            const budgetKey = budgetKeys[fieldKey]
                            const budgetOk  = !budgetKey || stats.budgets?.find(b => b.feature === budgetKey)?.allowed !== false
                            return (
                                <div key={fieldKey} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">{label}</p>
                                        <p className={`text-xl font-black tabular-nums ${count === 0 ? 'text-emerald-400' : 'text-white'}`}>{count}</p>
                                        <p className="text-[10px] text-zinc-600">pendentes</p>
                                    </div>
                                    <div
                                        className={`w-2 h-2 rounded-full shrink-0 ${budgetOk ? 'bg-emerald-500' : 'bg-red-500'}`}
                                        title={budgetOk ? 'Budget OK' : 'Budget esgotado'}
                                    />
                                </div>
                            )
                        })}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Custo Total</p>
                                <p className="text-xl font-black font-mono text-white">${stats.totalEstimate.toFixed(3)}</p>
                                <p className="text-[10px] text-zinc-600">estimado geral</p>
                            </div>
                            <DollarSign className="w-4 h-4 text-zinc-600 shrink-0" />
                        </div>
                    </div>
                )}

                <p className="text-xs text-zinc-500">
                    Itens priorizados por relevância e completude. Gere conteúdo editorial com IA para satisfazer AdSense (300–500 palavras/página).
                </p>

                {/* Search */}
                <form
                    onSubmit={e => { e.preventDefault(); setSearchQuery(searchInput) }}
                    className="flex items-center gap-2"
                >
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => {
                                setSearchInput(e.target.value)
                                if (!e.target.value) setSearchQuery('')
                            }}
                            placeholder={`Buscar ${cfg.label.toLowerCase()}...`}
                            className="w-full pl-9 pr-8 py-2 text-sm bg-zinc-900/60 border border-white/8 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all"
                        />
                        {searchInput && (
                            <button
                                type="button"
                                onClick={() => { setSearchInput(''); setSearchQuery('') }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all border border-white/6"
                    >
                        Buscar
                    </button>
                </form>

                {/* Tab bar + filter chips + refresh */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/6 rounded-xl p-1">
                        {(Object.entries(TAB_CONFIG) as [Tab, typeof cfg][]).map(([tab, c]) => {
                            const Icon  = c.icon
                            const count = queue[tab]?.total
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activeTab === tab
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {c.label}
                                    {count != null && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            activeTab === tab ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* Field filter chips */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={() => setFieldFilter('all')}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                fieldFilter === 'all'
                                    ? 'bg-zinc-700 text-white'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                            }`}
                        >
                            Todos
                        </button>
                        {Object.entries(fieldMap).map(([key, c]) => {
                            const count = stats?.counts[statsKeys[key]] ?? 0
                            return (
                                <button
                                    key={key}
                                    onClick={() => setFieldFilter(fieldFilter === key ? 'all' : key)}
                                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                                        fieldFilter === key
                                            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                                    }`}
                                >
                                    Sem {c.label}{count > 0 ? ` (${count})` : ''}
                                </button>
                            )
                        })}
                    </div>

                    <div className="ml-auto">
                        <button
                            onClick={() => { fetchQueue(activeTab); fetchStats() }}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Batch field selector + run */}
                <div className="flex items-center gap-2 flex-wrap p-3 rounded-xl bg-zinc-900/30 border border-white/5">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest shrink-0">Lote:</span>
                    {Object.entries(fieldMap).map(([key, c]) => (
                        <button
                            key={key}
                            onClick={() => toggleBatchField(key)}
                            disabled={batchRunning}
                            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all disabled:opacity-40 ${
                                selectedBatchFields.has(key)
                                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                                    : 'bg-transparent border-white/8 text-zinc-600 hover:text-zinc-400 hover:border-white/15'
                            }`}
                        >
                            {selectedBatchFields.has(key) ? '✓' : '○'} {c.label}
                        </button>
                    ))}
                    <button
                        onClick={runBatch}
                        disabled={batchRunning || loading || totalInQueue === 0 || isSearching || selectedBatchFields.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20 ml-auto"
                    >
                        {batchRunning
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{batchProgress ?? 'Gerando...'}</>
                            : <><Play className="w-3.5 h-3.5" />Gerar próximos {cfg.batchLimit}</>
                        }
                    </button>
                </div>

                {/* Queue list */}
                {loading && !currentQueue ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" />
                    </div>
                ) : visibleItems.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-white/6 rounded-xl">
                        {isSearching ? (
                            <>
                                <Search className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                <p className="text-sm font-medium text-white">Nenhum resultado</p>
                                <p className="text-xs text-zinc-500 mt-1">Tente outro termo de busca.</p>
                            </>
                        ) : fieldFilter !== 'all' ? (
                            <>
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-white">Nenhum item sem &ldquo;{fieldMap[fieldFilter]?.label}&rdquo;</p>
                                <p className="text-xs text-zinc-500 mt-1">Todos os itens visíveis têm este campo preenchido.</p>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-white">Tudo enriquecido!</p>
                                <p className="text-xs text-zinc-500 mt-1">Nenhum item pendente nesta categoria.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleItems.map((item, idx) => (
                            <QueueItemRow
                                key={item.id}
                                item={item}
                                rank={idx + 1}
                                tab={activeTab}
                                fieldMap={fieldMap}
                                onDone={handleItemDone}
                                onError={showError}
                                batchRunning={batchRunning}
                            />
                        ))}
                        {totalInQueue > allItems.length && (
                            <p className="text-center text-xs text-zinc-600 pt-2">
                                {isSearching
                                    ? `+${totalInQueue - allItems.length} resultados não exibidos · refine a busca`
                                    : `+${totalInQueue - allItems.length} itens não exibidos · use "Gerar próximos" para processar em lote`
                                }
                            </p>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

function QueueItemRow({
    item, rank, tab, fieldMap, onDone, onError, batchRunning,
}: {
    item:         QueueItem
    rank:         number
    tab:          Tab
    fieldMap:     Record<string, { label: string; target: string }>
    onDone:       (entityId: string, field: string) => void
    onError:      (msg: string) => void
    batchRunning: boolean
}) {
    const allPresent = item.missingFields.length === 0

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
            allPresent
                ? 'border-emerald-500/20 bg-emerald-900/5'
                : 'border-white/6 bg-zinc-900/40 hover:border-blue-500/20 hover:bg-zinc-900/60'
        }`}>
            <span className="text-[10px] text-zinc-700 font-mono w-5 text-center shrink-0">{rank}</span>

            <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-white/6">
                {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-zinc-700" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{item.name}</span>
                    {item.subtitle && (
                        <span className="text-[11px] text-zinc-500 truncate hidden sm:block">{item.subtitle}</span>
                    )}
                </div>
                <div className="mt-1.5">
                    <CompletenessBar score={item.completenessScore} present={item.presentFields.length} total={item.totalFields} />
                </div>
            </div>

            <div className="shrink-0 text-right hidden md:block">
                <span className="text-[10px] text-zinc-600 font-mono">~${item.estimatedCost.toFixed(4)}</span>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                <ProcessAllButton
                    item={item}
                    fieldMap={fieldMap}
                    disabled={batchRunning}
                    onDone={onDone}
                    onError={onError}
                />
                {Object.entries(fieldMap).map(([field, c]) => (
                    <EnrichButton
                        key={field}
                        label={c.label}
                        entityId={item.id}
                        target={c.target}
                        disabled={batchRunning}
                        present={item.presentFields.includes(field)}
                        onDone={onDone}
                        onError={onError}
                    />
                ))}
                <a
                    href={
                        tab === 'artists'     ? `/admin/artists/${item.id}/edit` :
                        tab === 'productions' ? `/admin/productions/${item.id}/edit` :
                        `/admin/news/${item.id}/edit`
                    }
                    className="inline-flex items-center p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Abrir"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    )
}
