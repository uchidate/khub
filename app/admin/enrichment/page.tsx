'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { useToast } from '@/lib/hooks/useToast'
import Image from 'next/image'
import {
    Sparkles, Loader2, RefreshCw, Users, Film, Newspaper,
    CheckCircle, Circle, DollarSign, ChevronRight, Play, Search, X,
} from 'lucide-react'

type Tab = 'artists' | 'productions' | 'news'

interface QueueItem {
    id:               string
    name:             string
    imageUrl?:        string
    subtitle?:        string
    missingFields:    string[]
    presentFields:    string[]
    totalFields:      number
    completenessScore: number
    priority:         number
    estimatedCost:    number
}

interface QueueData {
    items:             QueueItem[]
    total:             number
    totalCostEstimate: number
}

// Field display config per tab
const FIELD_LABELS: Record<Tab, Record<string, { label: string; target: string }>> = {
    artists: {
        bio:          { label: 'Bio',         target: 'artist_bio' },
        editorial:    { label: 'Análise',     target: 'artist_editorial' },
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

function FieldChip({ label, done }: { label: string; done: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${
            done
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-zinc-700/60 bg-zinc-800/60 text-zinc-500'
        }`}>
            {done ? <CheckCircle className="w-2.5 h-2.5" /> : <Circle className="w-2.5 h-2.5" />}
            {label}
        </span>
    )
}

// EnrichButton recebe callbacks — sem useAdminToast próprio
function EnrichButton({
    label, entityId, target, disabled, onDone, onError,
}: {
    label:    string
    entityId: string
    target:   string
    disabled: boolean
    onDone:   (entityId: string, field: string) => void
    onError:  (msg: string) => void
}) {
    const [loading, setLoading] = useState(false)
    const [done,    setDone]    = useState(false)
    const [error,   setError]   = useState(false)

    const fieldKey = target.split('_').slice(1).join('_') || target

    async function handleClick() {
        if (loading || done || disabled) return
        setLoading(true)
        setError(false)
        try {
            const res = await fetch('/api/admin/enrichment', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ target, entityId }),
            })
            const data = await res.json()
            if (res.ok && data.processed > 0) {
                setDone(true)
                onDone(entityId, fieldKey)
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

    if (done) {
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
                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300'
            }`}
        >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {loading ? 'Gerando...' : label}
        </button>
    )
}

export default function EnrichmentPage() {
    // Seletor Zustand — addToast é estável, sem re-renders por toasts
    const addToast   = useToast(s => s.addToast)
    const showError   = useCallback((msg: string) => addToast({ type: 'error',   message: msg, duration: 5000 }), [addToast])
    const showSuccess = useCallback((msg: string) => addToast({ type: 'success', message: msg, duration: 3000 }), [addToast])

    const [activeTab,    setActiveTab]    = useState<Tab>('artists')
    const [queue,        setQueue]        = useState<Record<Tab, QueueData | null>>({ artists: null, productions: null, news: null })
    const [loading,      setLoading]      = useState(false)
    const [batchRunning, setBatchRunning] = useState(false)
    const [searchQuery,  setSearchQuery]  = useState('')
    const [searchInput,  setSearchInput]  = useState('')
    const [searchResults, setSearchResults] = useState<QueueData | null>(null)

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
    }, [activeTab, fetchQueue])

    useEffect(() => {
        if (!searchQuery) { setSearchResults(null); return }
        fetchSearch(searchQuery, activeTab)
    }, [searchQuery, activeTab, fetchSearch])

    function handleItemDone(entityId: string, field: string) {
        setQueue(prev => {
            const tabData = prev[activeTab]
            if (!tabData) return prev
            const updatedItems = tabData.items.map(item => {
                if (item.id !== entityId) return item
                const missingFields = item.missingFields.filter(f => f !== field)
                const presentFields = [...item.presentFields, field]
                const completeness  = Math.round((presentFields.length / item.totalFields) * 100)
                return { ...item, missingFields, presentFields, completenessScore: completeness }
            })
            return { ...prev, [activeTab]: { ...tabData, items: updatedItems } }
        })
    }

    async function runBatch() {
        const cfg    = TAB_CONFIG[activeTab]
        const limit  = cfg.batchLimit
        const targets: Record<Tab, string[]> = {
            artists:     ['artist_bio', 'artist_editorial', 'artist_curiosidades'],
            productions: ['production_review'],
            news:        ['news_editorial_note', 'news_blog_post'],
        }

        setBatchRunning(true)
        try {
            for (const target of targets[activeTab]) {
                const res  = await fetch('/api/admin/enrichment', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ target, limit }),
                })
                const data = await res.json()
                if (!res.ok) { showError(data.error ?? `Erro em ${target}`); continue }
                if (data.processed > 0) showSuccess(`${data.processed} ${target.replace('_', ' ')} gerados`)
            }
            await fetchQueue(activeTab)
        } catch {
            showError('Erro no lote')
        } finally {
            setBatchRunning(false)
        }
    }

    const isSearching  = searchQuery.trim().length > 0
    const currentQueue = isSearching ? searchResults : queue[activeTab]
    const visibleItems = currentQueue?.items ?? []
    const totalInQueue = currentQueue?.total ?? 0
    const totalCost    = currentQueue?.totalCostEstimate ?? 0
    const cfg          = TAB_CONFIG[activeTab]
    const fieldMap     = FIELD_LABELS[activeTab]

    return (
        <AdminLayout title="Smart Queue — Enriquecimento">
            <div className="space-y-5">

                {/* Header summary */}
                <div className="flex items-start justify-between gap-4">
                    <p className="text-xs text-zinc-500 mt-1">
                        Itens priorizados por relevância e completude. Gere conteúdo editorial com IA para satisfazer AdSense (300–500 palavras/página).
                    </p>
                    {totalCost > 0 && (
                        <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                                <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="font-mono font-semibold text-white">${totalCost.toFixed(4)}</span>
                            </div>
                            <p className="text-[10px] text-zinc-600">custo estimado (top 30)</p>
                        </div>
                    )}
                </div>

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
                            placeholder={`Buscar ${TAB_CONFIG[activeTab].label.toLowerCase()}...`}
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

                {/* Tab bar + actions */}
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

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => fetchQueue(activeTab)}
                            disabled={loading}
                            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-800"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                        <button
                            onClick={runBatch}
                            disabled={batchRunning || loading || totalInQueue === 0 || isSearching}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                        >
                            {batchRunning
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                                : <><Play className="w-3.5 h-3.5" /> Gerar próximos {cfg.batchLimit}</>
                            }
                        </button>
                    </div>
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
                        {totalInQueue > visibleItems.length && (
                            <p className="text-center text-xs text-zinc-600 pt-2">
                                {isSearching
                                    ? `+${totalInQueue - visibleItems.length} resultados não exibidos · refine a busca`
                                    : `+${totalInQueue - visibleItems.length} itens não exibidos · use "Gerar próximos" para processar em lote`
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
                <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                    {Object.entries(fieldMap).map(([key, c]) => (
                        <FieldChip key={key} label={c.label} done={item.presentFields.includes(key)} />
                    ))}
                </div>
            </div>

            <div className="shrink-0 text-right hidden md:block">
                <span className="text-[10px] text-zinc-600 font-mono">~${item.estimatedCost.toFixed(4)}</span>
            </div>

            <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                {allPresent ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Completo
                    </span>
                ) : (
                    item.missingFields.map(field => {
                        const c = fieldMap[field]
                        if (!c) return null
                        return (
                            <EnrichButton
                                key={field}
                                label={c.label}
                                entityId={item.id}
                                target={c.target}
                                disabled={batchRunning}
                                onDone={onDone}
                                onError={onError}
                            />
                        )
                    })
                )}
                <a
                    href={tab === 'artists' ? `/admin/artists/${item.id}/edit` : tab === 'productions' ? `/admin/productions/${item.id}/edit` : `/admin/news/${item.id}/edit`}
                    className="inline-flex items-center p-1 rounded text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Abrir"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    )
}
