'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useToast } from '@/lib/hooks/useToast'
import Image from 'next/image'
import {
    Sparkles, Loader2, RefreshCw, Users, Film, Newspaper,
    CheckCircle, DollarSign, ChevronRight, Play, Search, X, Zap,
    EyeOff, Eye, ChevronDown, PenLine, ChevronUp, Plus, Trash2, Save,
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

interface BudgetStatus { exceeded: boolean; enabled: boolean; [k: string]: unknown }
interface StatsData {
    counts:        Record<string, number>
    totalEstimate: number
    budgets:       Record<string, BudgetStatus> | undefined
}

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

const STATS_COUNT_KEYS: Record<Tab, Record<string, string>> = {
    artists:     { bio: 'artist_bio', editorial: 'artist_editorial', curiosidades: 'artist_curiosidades' },
    productions: { review: 'production_review' },
    news:        { nota: 'news_editorial_note', blog: 'news_blog_post' },
}

const BUDGET_FEATURE_KEYS: Record<Tab, Record<string, string>> = {
    artists:     { bio: 'artist_bio_enrichment', editorial: 'artist_editorial', curiosidades: 'artist_curiosidades' },
    productions: { review: 'production_review' },
    news:        { nota: 'news_editorial_note', blog: 'blog_post_generation' },
}

// All stats keys across all tabs for the global overview
const ALL_STATS: { tab: Tab; field: string; label: string; icon: React.ElementType }[] = [
    { tab: 'artists',     field: 'bio',          label: 'Artistas · Bio',          icon: Users },
    { tab: 'artists',     field: 'editorial',    label: 'Artistas · Projetos',     icon: Users },
    { tab: 'artists',     field: 'curiosidades', label: 'Artistas · Curiosidades', icon: Users },
    { tab: 'productions', field: 'review',       label: 'Produções · Review',      icon: Film  },
    { tab: 'news',        field: 'nota',         label: 'Notícias · Nota',         icon: Newspaper },
    { tab: 'news',        field: 'blog',         label: 'Notícias · Blog',         icon: Newspaper },
]

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
    onDone:   (entityId: string, field: string, cost: number) => void
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
                onDone(entityId, fieldKey, data.totalCostUsd ?? 0)
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
    onDone:   (entityId: string, field: string, cost: number) => void
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
        let totalCost = 0
        try {
            for (const c of missing) {
                const res  = await fetch('/api/admin/enrichment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ target: c.target, entityId: item.id }),
                })
                const data = await res.json()
                if (res.ok && data.processed > 0) {
                    onDone(item.id, c.field, data.totalCostUsd ?? 0)
                    totalCost += data.totalCostUsd ?? 0
                } else onError(data.error ?? `Erro em ${c.label}`)
            }
            void totalCost
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
    const [batchProgress,       setBatchProgress]       = useState<{ step: number; total: number; label: string; stepProcessed: number } | null>(null)
    const [searchQuery,         setSearchQuery]         = useState('')
    const [searchResults,       setSearchResults]       = useState<QueueData | null>(null)
    const [fieldFilter,         setFieldFilter]         = useState<string>('all')
    const [hideComplete,        setHideComplete]        = useState(true)
    const [loadingMore,         setLoadingMore]         = useState(false)
    const [selectedBatchFields, setSelectedBatchFields] = useState<Set<string>>(
        new Set(Object.keys(FIELD_LABELS.artists))
    )
    const [sessionStats, setSessionStats] = useState<{ processed: number; cost: number }>({ processed: 0, cost: 0 })
    const searchDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingFieldRef = useRef<string>('all')

    const fetchQueue = useCallback(async (tab: Tab, append = false, offset = 0, field = 'all') => {
        if (!append) setLoading(true)
        else setLoadingMore(true)
        try {
            const params = new URLSearchParams({ tab, limit: '30', offset: String(offset) })
            if (field && field !== 'all') params.set('field', field)
            const res  = await fetch(`/api/admin/enrichment/queue?${params}`)
            if (!res.ok) return
            const data = await res.json() as QueueData
            setQueue(prev => {
                if (!append) return { ...prev, [tab]: data }
                const existing = prev[tab]
                return {
                    ...prev,
                    [tab]: existing
                        ? { ...data, items: [...existing.items, ...data.items] }
                        : data
                }
            })
        } catch {
            showError('Erro ao carregar fila')
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [showError])

    const fetchStats = useCallback(async () => {
        try {
            const res  = await fetch('/api/admin/enrichment')
            if (!res.ok) return
            const data = await res.json() as StatsData
            if (data?.counts && typeof data.totalEstimate === 'number') setStats(data)
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
        const f = pendingFieldRef.current
        pendingFieldRef.current = 'all'
        fetchQueue(activeTab, false, 0, f)
        setFieldFilter(f)
        setSelectedBatchFields(new Set(Object.keys(FIELD_LABELS[activeTab])))
        setSearchQuery('')
        setSearchResults(null)
    }, [activeTab, fetchQueue])

    useEffect(() => { fetchStats() }, [fetchStats])

    // Auto-search with debounce
    function handleSearchInput(value: string) {
        setSearchQuery(value)
        if (searchDebounce.current) clearTimeout(searchDebounce.current)
        if (!value.trim()) { setSearchResults(null); return }
        searchDebounce.current = setTimeout(() => fetchSearch(value, activeTab), 400)
    }

    function handleItemDone(entityId: string, field: string, cost: number) {
        setSessionStats(prev => ({ processed: prev.processed + 1, cost: prev.cost + cost }))
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
        let totalProcessed = 0
        let batchTotalCost = 0
        try {
            for (let i = 0; i < targets.length; i++) {
                const { label, target } = targets[i]
                setBatchProgress({ step: i + 1, total: targets.length, label, stepProcessed: 0 })
                const res  = await fetch('/api/admin/enrichment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ target, limit }),
                })
                const data = await res.json()
                if (!res.ok) { showError(data.error ?? `Erro em ${target}`); continue }
                if (data.processed > 0) {
                    totalProcessed += data.processed
                    batchTotalCost += data.totalCostUsd ?? 0
                    showSuccess(`${data.processed} ${label} gerados`)
                }
                setBatchProgress({ step: i + 1, total: targets.length, label, stepProcessed: data.processed ?? 0 })
            }
            if (batchTotalCost > 0) setSessionStats(prev => ({ processed: prev.processed + totalProcessed, cost: prev.cost + batchTotalCost }))
            if (totalProcessed > 0) await Promise.all([fetchQueue(activeTab, false, 0, fieldFilter), fetchStats()])
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
    const filteredByField = fieldFilter === 'all'
        ? allItems
        : allItems.filter(item => item.missingFields.includes(fieldFilter))
    const visibleItems = hideComplete
        ? filteredByField.filter(item => item.missingFields.length > 0)
        : filteredByField
    const totalInQueue = currentQueue?.total ?? 0
    const cfg          = TAB_CONFIG[activeTab]
    const fieldMap     = FIELD_LABELS[activeTab]
    const statsKeys    = STATS_COUNT_KEYS[activeTab]

    // Estimated cost of running the batch
    const batchCostEstimate = (() => {
        if (!currentQueue) return 0
        const itemsToProcess = currentQueue.items.slice(0, cfg.batchLimit)
        // Only include cost for selected missing fields (proportional estimate)
        return itemsToProcess.reduce((sum, item) => {
            const selectedMissing = item.missingFields.filter(f => selectedBatchFields.has(f))
            if (selectedMissing.length === 0 || item.missingFields.length === 0) return sum
            return sum + item.estimatedCost * (selectedMissing.length / item.missingFields.length)
        }, 0)
    })()

    const completeCount = allItems.filter(i => i.missingFields.length === 0).length

    return (
        <AdminLayout title="Smart Queue — Enriquecimento">
            <div className="space-y-5">

                {/* Global stats overview — always visible, all tabs */}
                {stats && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                        {ALL_STATS.map(({ tab, field, label }) => {
                            const countKey  = STATS_COUNT_KEYS[tab][field]
                            const budgetKey = BUDGET_FEATURE_KEYS[tab][field]
                            const count     = stats.counts?.[countKey] ?? 0
                            const budgetOk  = !budgetKey || !stats.budgets?.[budgetKey]?.exceeded
                            const isActive  = tab === activeTab
                            return (
                                <button
                                    key={`${tab}-${field}`}
                                    onClick={() => {
                                        if (tab === activeTab) {
                                            // Same tab — just filter
                                            setFieldFilter(field)
                                            fetchQueue(tab, false, 0, field)
                                        } else {
                                            // Different tab — set ref so useEffect picks it up
                                            pendingFieldRef.current = field
                                            setActiveTab(tab)
                                        }
                                    }}
                                    className={`text-left p-2.5 rounded-xl border transition-all ${
                                        isActive && fieldFilter === field
                                            ? 'bg-blue-900/20 border-blue-500/30'
                                            : 'bg-zinc-900/40 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
                                    }`}
                                >
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black truncate">{label}</p>
                                    <p className={`text-lg font-black tabular-nums leading-tight ${count === 0 ? 'text-emerald-400' : 'text-white'}`}>
                                        {count}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${budgetOk ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        <span className="text-[9px] text-zinc-600">{budgetOk ? 'ok' : 'esgotado'}</span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Cost + session summary */}
                <div className="flex items-center gap-4 flex-wrap text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Custo geral estimado: <span className="text-zinc-400 font-mono">${(stats?.totalEstimate ?? 0).toFixed(3)}</span>
                    </span>
                    {currentQueue && (
                        <span>
                            Fila: <span className="text-zinc-400">{totalInQueue}</span> itens
                            {currentQueue.totalCostEstimate > 0 && (
                                <> · ~<span className="text-zinc-400 font-mono">${currentQueue.totalCostEstimate.toFixed(4)}</span></>
                            )}
                            {completeCount > 0 && (
                                <span className="text-zinc-600"> · {completeCount} completos</span>
                            )}
                        </span>
                    )}
                    {sessionStats.processed > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500/70">
                            <CheckCircle className="w-3 h-3" />
                            Sessão: {sessionStats.processed} gerados
                            {sessionStats.cost > 0 && <> · <span className="font-mono">${sessionStats.cost.toFixed(4)}</span></>}
                        </span>
                    )}
                </div>

                {/* Search — auto-search with debounce */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => handleSearchInput(e.target.value)}
                        placeholder={`Buscar ${cfg.label.toLowerCase()}...`}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-zinc-900/60 border border-white/8 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:bg-zinc-900 transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => handleSearchInput('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Tab bar + filter chips + hide-complete + refresh */}
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
                            onClick={() => { setFieldFilter('all'); fetchQueue(activeTab, false, 0, 'all') }}
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
                            const next  = fieldFilter === key ? 'all' : key
                            return (
                                <button
                                    key={key}
                                    onClick={() => { setFieldFilter(next); fetchQueue(activeTab, false, 0, next) }}
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

                    {/* Hide complete toggle */}
                    <button
                        onClick={() => setHideComplete(v => !v)}
                        className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            hideComplete
                                ? 'bg-zinc-800 border-white/10 text-zinc-300'
                                : 'bg-transparent border-white/6 text-zinc-600 hover:text-zinc-400'
                        }`}
                        title={hideComplete ? 'Mostrar completos' : 'Ocultar completos'}
                    >
                        {hideComplete ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {hideComplete ? 'Ocultando completos' : 'Mostrar completos'}
                    </button>

                    <div className="ml-auto">
                        <button
                            onClick={() => { fetchQueue(activeTab, false, 0, fieldFilter); fetchStats() }}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Batch field selector + cost estimate + run */}
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

                    {/* Estimated cost for batch */}
                    {batchCostEstimate > 0 && !batchRunning && (
                        <span className="text-[10px] text-zinc-600 font-mono ml-1">
                            ~${batchCostEstimate.toFixed(4)}
                        </span>
                    )}

                    <button
                        onClick={runBatch}
                        disabled={batchRunning || loading || totalInQueue === 0 || isSearching || selectedBatchFields.size === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20 ml-auto"
                    >
                        {batchRunning && batchProgress
                            ? <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                {batchProgress.label} ({batchProgress.step}/{batchProgress.total}){batchProgress.stepProcessed > 0 ? ` — ${batchProgress.stepProcessed}` : ''}
                              </>
                            : batchRunning
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando...</>
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
                        ) : hideComplete && completeCount > 0 ? (
                            <>
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                                <p className="text-sm font-medium text-white">Todos os itens carregados estão completos!</p>
                                <button onClick={() => setHideComplete(false)} className="text-xs text-blue-400 hover:text-blue-300 mt-1 transition-colors">
                                    Mostrar {completeCount} itens completos
                                </button>
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
                        {visibleItems.map((item) => (
                            <QueueItemRow
                                key={item.id}
                                item={item}
                                tab={activeTab}
                                fieldMap={fieldMap}
                                onDone={handleItemDone}
                                onError={showError}
                                batchRunning={batchRunning}
                            />
                        ))}

                        {/* Load more */}
                        {!isSearching && allItems.length < totalInQueue && (
                            <button
                                onClick={() => fetchQueue(activeTab, true, allItems.length, fieldFilter)}
                                disabled={loadingMore}
                                className="w-full flex items-center justify-center gap-2 py-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-dashed border-white/6 rounded-xl hover:border-white/12"
                            >
                                {loadingMore
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Carregando...</>
                                    : <><ChevronDown className="w-3.5 h-3.5" />Carregar mais ({totalInQueue - allItems.length} restantes)</>
                                }
                            </button>
                        )}

                        {isSearching && totalInQueue > allItems.length && (
                            <p className="text-center text-xs text-zinc-600 pt-2">
                                +{totalInQueue - allItems.length} resultados · refine a busca
                            </p>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}

function QueueItemRow({
    item, tab, fieldMap, onDone, onError, batchRunning,
}: {
    item:         QueueItem
    tab:          Tab
    fieldMap:     Record<string, { label: string; target: string }>
    onDone:       (entityId: string, field: string, cost: number) => void
    onError:      (msg: string) => void
    batchRunning: boolean
}) {
    const [curating, setCurating] = useState(false)
    const allPresent = item.missingFields.length === 0
    const canCurate  = tab === 'artists' && item.presentFields.length > 0

    return (
        <div className={`rounded-xl border transition-all ${
            curating
                ? 'border-amber-500/30 bg-zinc-900/60'
                : allPresent
                    ? 'border-emerald-500/20 bg-emerald-900/5'
                    : 'border-white/6 bg-zinc-900/40 hover:border-blue-500/20 hover:bg-zinc-900/60'
        }`}>
            {/* Main row */}
            <div className="flex items-center gap-3 p-3 group">
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
                    {canCurate && (
                        <button
                            onClick={() => setCurating(v => !v)}
                            title={curating ? 'Fechar curadoria' : 'Curar conteúdo gerado'}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md transition-all ${
                                curating
                                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                    : 'bg-zinc-800/60 border border-white/8 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200 opacity-0 group-hover:opacity-100'
                            }`}
                        >
                            {curating ? <ChevronUp className="w-3 h-3" /> : <PenLine className="w-3 h-3" />}
                            {curating ? 'Fechar' : 'Curar'}
                        </button>
                    )}
                    <a
                        href={
                            tab === 'artists'     ? `/admin/artists/${item.id}` :
                            tab === 'productions' ? `/admin/productions/${item.id}` :
                            `/admin/news/${item.id}/edit`
                        }
                        className="inline-flex items-center p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Abrir página completa"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            {/* Curation panel */}
            {curating && (
                <CurationPanel
                    entityId={item.id}
                    onClose={() => setCurating(false)}
                />
            )}
        </div>
    )
}

interface EditorialContent {
    nameRomanized:        string
    nameHangul:           string | null
    bio:                  string | null
    analiseEditorial:     string | null
    curiosidades:         string[]
    editorialGeneratedAt: string | null
}

function CurationPanel({ entityId, onClose }: { entityId: string; onClose: () => void }) {
    const addToast   = useToast(s => s.addToast)
    const [loading,  setLoading]  = useState(true)
    const [saving,   setSaving]   = useState(false)
    const [original, setOriginal] = useState<EditorialContent | null>(null)
    const [bio,           setBio]           = useState('')
    const [editorial,     setEditorial]     = useState('')
    const [curiosidades,  setCuriosidades]  = useState<string[]>([])

    useEffect(() => {
        fetch(`/api/admin/artists/${entityId}/editorial`)
            .then(r => r.json())
            .then((d: EditorialContent) => {
                setOriginal(d)
                setBio(d.bio ?? '')
                setEditorial(d.analiseEditorial ?? '')
                setCuriosidades(d.curiosidades?.length ? d.curiosidades : [''])
                setLoading(false)
            })
            .catch(() => {
                addToast({ type: 'error', message: 'Erro ao carregar conteúdo', duration: 4000 })
                onClose()
            })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId])

    async function handleSave() {
        setSaving(true)
        try {
            const body: Record<string, unknown> = {}
            if (bio      !== (original?.bio              ?? '')) body.bio              = bio
            if (editorial !== (original?.analiseEditorial ?? '')) body.analiseEditorial = editorial
            const filteredCurio = curiosidades.filter(c => c.trim())
            const origCurio     = original?.curiosidades ?? []
            if (JSON.stringify(filteredCurio) !== JSON.stringify(origCurio)) body.curiosidades = filteredCurio

            if (Object.keys(body).length === 0) {
                addToast({ type: 'success', message: 'Sem alterações para salvar', duration: 2000 })
                onClose()
                return
            }

            const res = await fetch(`/api/admin/artists/${entityId}/editorial`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            })
            if (res.ok) {
                addToast({ type: 'success', message: 'Conteúdo curado salvo', duration: 3000 })
                onClose()
            } else {
                const d = await res.json()
                addToast({ type: 'error', message: d.error ?? 'Erro ao salvar', duration: 5000 })
            }
        } finally {
            setSaving(false)
        }
    }

    function updateCuriosidade(i: number, value: string) {
        setCuriosidades(prev => prev.map((c, idx) => idx === i ? value : c))
    }
    function removeCuriosidade(i: number) {
        setCuriosidades(prev => prev.filter((_, idx) => idx !== i))
    }
    function addCuriosidade() {
        setCuriosidades(prev => [...prev, ''])
    }

    const genAt = original?.editorialGeneratedAt
        ? new Date(original.editorialGeneratedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null

    return (
        <div className="border-t border-amber-500/20 px-4 pb-4 pt-3 space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
            ) : (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-amber-400">
                                Curadoria — {original?.nameRomanized}{original?.nameHangul ? ` (${original.nameHangul})` : ''}
                            </p>
                            {genAt && (
                                <p className="text-[10px] text-zinc-600 mt-0.5">Gerado em {genAt}</p>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {(bio !== '' || original?.bio !== null) && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bio</label>
                            <textarea
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={5}
                                className="w-full px-3 py-2.5 text-sm bg-zinc-900/80 border border-white/8 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-y font-sans leading-relaxed"
                                placeholder="Bio do artista..."
                            />
                        </div>
                    )}

                    {/* Análise editorial */}
                    {(editorial !== '' || original?.analiseEditorial !== null) && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Análise Editorial</label>
                            <textarea
                                value={editorial}
                                onChange={e => setEditorial(e.target.value)}
                                rows={8}
                                className="w-full px-3 py-2.5 text-sm bg-zinc-900/80 border border-white/8 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-y font-mono leading-relaxed"
                                placeholder="**Projetos**&#10;...&#10;&#10;**Reconhecimento**&#10;..."
                            />
                        </div>
                    )}

                    {/* Curiosidades */}
                    {curiosidades.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Curiosidades ({curiosidades.filter(c => c.trim()).length})
                            </label>
                            <div className="space-y-2">
                                {curiosidades.map((c, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-[10px] text-zinc-600 font-mono pt-2.5 shrink-0 w-4 text-right">{i + 1}.</span>
                                        <textarea
                                            value={c}
                                            onChange={e => updateCuriosidade(i, e.target.value)}
                                            rows={2}
                                            className="flex-1 px-3 py-2 text-sm bg-zinc-900/80 border border-white/8 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none font-sans leading-relaxed"
                                            placeholder={`Curiosidade ${i + 1}...`}
                                        />
                                        <button
                                            onClick={() => removeCuriosidade(i)}
                                            className="mt-1.5 p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded-md hover:bg-red-500/10"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addCuriosidade}
                                    className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1 rounded-md hover:bg-zinc-800"
                                >
                                    <Plus className="w-3 h-3" />
                                    Adicionar curiosidade
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/6">
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-800 disabled:opacity-40"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-40 shadow-lg shadow-amber-500/20"
                        >
                            {saving
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Salvando...</>
                                : <><Save className="w-3.5 h-3.5" />Salvar curadoria</>
                            }
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
