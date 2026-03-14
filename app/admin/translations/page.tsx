'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, ChevronRight, RefreshCw, Zap, CheckCircle, XCircle, SkipForward, Loader2, Pencil, AlertCircle, History, ChevronDown, Sparkles } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type StatusFilter = '' | 'pending' | 'draft' | 'approved'

interface Stats {
  artist:     { total: number; translated: number; pending: number; hiddenPending: number }
  group:      { total: number; translated: number; pending: number; hiddenPending: number }
  production: { total: number; translated: number; pending: number; failed: number; noSynopsis: number; hiddenPending: number }
  news:       { total: number; translated: number; pending: number; hiddenPending: number }
}

interface TranslationItem {
  id: string
  label: string
  subtitle?: string
  fields: string[]
  snippet?: string
  ptSnippet?: string
  bioSource?: string | null
  status?: 'pending' | 'draft' | 'approved'
  fieldStatuses?: Record<string, string>
  // production-specific
  synopsisSource?: string | null
  hasSynopsis?: boolean
  translationStatus?: string
}

interface ProgressEvent {
  name: string
  status: 'processing' | 'translated' | 'skipped' | 'failed'
  current: number
  total: number
}

const ENTITY_LABELS: Record<EntityType, string> = {
  artist: 'Artistas',
  group: 'Grupos',
  production: 'Produções',
  news: 'Notícias',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Sem tradução',
  draft: 'Traduzido (IA)',
  approved: 'Revisado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-zinc-800 text-zinc-400',
  draft: 'bg-yellow-900/40 text-yellow-400',
  approved: 'bg-green-900/40 text-green-400',
}

const SYNOPSIS_SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  tmdb_pt: { label: 'TMDB · pt-BR', cls: 'bg-green-900/40 text-green-400 border-green-700/30' },
  tmdb_en: { label: 'TMDB · en',    cls: 'bg-blue-900/40 text-blue-400 border-blue-700/30' },
  ai:      { label: 'IA',           cls: 'bg-purple-900/40 text-purple-400 border-purple-700/30' },
  manual:  { label: 'Manual',       cls: 'bg-amber-900/40 text-amber-400 border-amber-700/30' },
}

const FILTERS_BY_TAB: Record<EntityType, [StatusFilter, string][]> = {
  artist:     [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados']],
  group:      [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados']],
  production: [['', 'Todos'], ['pending', 'Pendentes'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados']],
  news:       [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados']],
}

const FIELD_LABELS: Record<string, string> = {
  bio: 'bio',
  synopsis: 'sinopse',
  tagline: 'tagline',
  title: 'título',
  contentMd: 'conteúdo',
}

// Tipos que suportam tradução automática via IA
const TRANSLATABLE_TYPES: EntityType[] = ['artist', 'group', 'production']

const BATCH_LIMIT_OPTIONS = [5, 10, 25, 50]

const SOURCE_FILTER_OPTIONS: [string, string][] = [
  ['', 'Todos'],
  ['tmdb_pt', 'TMDB pt-BR'],
  ['tmdb_en', 'TMDB en'],
  ['ai', 'IA'],
  ['manual', 'Manual'],
]

function getPrimaryField(type: EntityType): string {
  if (type === 'production') return 'synopsis'
  if (type === 'news') return 'title'
  return 'bio'
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function ProductionBadge({ item }: { item: TranslationItem }) {
  if (!item.hasSynopsis) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-600 border border-zinc-700">
        Sem sinopse
      </span>
    )
  }
  if (item.status === 'approved') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-700/30">Revisado</span>
  }
  if (item.status === 'draft') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">Traduzido (IA)</span>
  }
  if (item.synopsisSource && SYNOPSIS_SOURCE_LABELS[item.synopsisSource]) {
    const src = SYNOPSIS_SOURCE_LABELS[item.synopsisSource]
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${src.cls}`}>
        {src.label}
      </span>
    )
  }
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">Pendente</span>
}

function TranslationsPageContent() {
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<Stats | null>(null)
  const initialTab = (searchParams.get('tab') as EntityType | null) ?? 'artist'
  const [activeTab, setActiveTab] = useState<EntityType>(
    ['artist', 'group', 'production', 'news'].includes(initialTab) ? initialTab : 'artist'
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [hiddenFilter, setHiddenFilter] = useState<'visible' | 'hidden'>('visible')
  const [sourceFilter, setSourceFilter] = useState('')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TranslationItem[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  // Seleção para bulk approve
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [approving, setApproving] = useState<Set<string>>(new Set())
  const [bulkApproving, setBulkApproving] = useState(false)

  const [singleTranslating, setSingleTranslating] = useState<Set<string>>(new Set())
  const [singleDone, setSingleDone] = useState<Set<string>>(new Set())

  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([])
  const [currentItem, setCurrentItem] = useState<ProgressEvent | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [batchLimit, setBatchLimit] = useState(10)
  const [batchPanelOpen, setBatchPanelOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    const res = await fetch('/api/admin/translations/stats')
    if (res.ok) setStats(await res.json())
    setStatsLoading(false)
  }, [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ entityType: activeTab, page: String(page), limit: '30' })
    if (statusFilter) params.set('status', statusFilter)
    if (hiddenFilter === 'hidden') params.set('hidden', 'true')
    if (q) params.set('q', q)
    if (sourceFilter && activeTab === 'artist') params.set('source', sourceFilter)
    const res = await fetch(`/api/admin/translations/list?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages ?? 1)
    }
    setLoading(false)
  }, [activeTab, statusFilter, hiddenFilter, q, page, sourceFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1); setStatusFilter(''); setHiddenFilter('visible'); setSourceFilter(''); setSelected(new Set()) }, [activeTab])
  useEffect(() => { setPage(1); setSelected(new Set()) }, [statusFilter, hiddenFilter, q, sourceFilter])
  useEffect(() => { fetchItems() }, [fetchItems])
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [progressLog, currentItem])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchItems() }

  const startTimer = () => {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const handleTranslateSingle = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSingleTranslating(prev => { const n = new Set(prev); n.add(id); return n })
    try {
      await fetch('/api/admin/translations/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: activeTab, id }),
      })
      setSingleDone(prev => { const n = new Set(prev); n.add(id); return n })
      setTimeout(() => {
        setSingleDone(prev => { const n = new Set(prev); n.delete(id); return n })
        fetchItems()
      }, 1500)
    } finally {
      setSingleTranslating(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }, [activeTab, fetchItems])

  const handleApprove = useCallback(async (ids: string[], e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const field = getPrimaryField(activeTab)
    ids.forEach(id => setApproving(prev => { const n = new Set(prev); n.add(id); return n }))
    try {
      await fetch('/api/admin/translations/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: activeTab, ids, field }),
      })
      await fetchItems()
      await fetchStats()
    } finally {
      ids.forEach(id => setApproving(prev => { const n = new Set(prev); n.delete(id); return n }))
    }
  }, [activeTab, fetchItems, fetchStats])

  const handleBulkApprove = useCallback(async () => {
    setBulkApproving(true)
    const ids = Array.from(selected)
    try {
      await fetch('/api/admin/translations/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: activeTab, ids, field: getPrimaryField(activeTab) }),
      })
      setSelected(new Set())
      await fetchItems()
      await fetchStats()
    } finally {
      setBulkApproving(false)
    }
  }, [selected, activeTab, fetchItems, fetchStats])

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  const selectAllDraft = () => {
    setSelected(new Set(items.filter(i => i.status === 'draft').map(i => i.id)))
  }

  const handleRunBatch = () => {
    if (!TRANSLATABLE_TYPES.includes(activeTab)) {
      setRunResult('Tradução automática não disponível para este tipo.')
      return
    }
    setRunning(true); setRunResult(null); setProgressLog([]); setCurrentItem(null); startTimer()
    setBatchPanelOpen(true)
    const params = new URLSearchParams({ entityType: activeTab, limit: String(batchLimit) })
    if (hiddenFilter === 'hidden') params.set('hidden', 'true')
    else params.set('hidden', 'false')
    const es = new EventSource(`/api/admin/translations/run?${params}`)
    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProgressEvent & { type: string; translated?: number; skipped?: number; failed?: number; message?: string }
      if (data.type === 'progress') {
        if (data.status === 'processing') setCurrentItem(data)
        else { setCurrentItem(null); setProgressLog(prev => [...prev, data]) }
      } else if (data.type === 'done') {
        es.close(); stopTimer(); setRunning(false); setCurrentItem(null)
        setRunResult(`Traduzidos: ${data.translated ?? 0} · Ignorados: ${data.skipped ?? 0} · Falhas: ${data.failed ?? 0}`)
        fetchStats(); fetchItems()
      } else if (data.type === 'error') {
        es.close(); stopTimer(); setRunning(false); setCurrentItem(null)
        setRunResult(`erro: ${data.message}`)
      }
    }
    es.onerror = () => {
      es.close(); stopTimer(); setRunning(false); setCurrentItem(null)
      setRunResult('erro: falha ao conectar com o servidor.')
    }
  }

  const translatedCount = progressLog.filter(e => e.status === 'translated').length
  const skippedCount = progressLog.filter(e => e.status === 'skipped').length
  const failedCount = progressLog.filter(e => e.status === 'failed').length
  const processedCount = progressLog.length

  const isProduction = activeTab === 'production'
  const prodStats = stats?.production
  const canTranslate = TRANSLATABLE_TYPES.includes(activeTab)

  const showBatchPanel = batchPanelOpen && (running || progressLog.length > 0)
  const draftCount = items.filter(i => i.status === 'draft').length

  return (
    <AdminLayout title="Traduções">
      <div className="space-y-6">

        {/* Cards de progresso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => {
            const s = stats?.[type]
            const pct = s && s.total > 0 ? Math.round((s.translated / s.total) * 100) : 0
            const prodS = type === 'production' ? (s as Stats['production'] | undefined) : undefined
            const pendingCount = (s as { pending?: number } | undefined)?.pending ?? 0
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`p-4 rounded-xl border text-left transition-colors ${
                  activeTab === type
                    ? 'border-purple-500/50 bg-purple-900/20'
                    : 'border-white/10 bg-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{ENTITY_LABELS[type]}</span>
                  {TRANSLATABLE_TYPES.includes(type) && (
                    <span className="text-[10px] text-zinc-600 font-medium">IA</span>
                  )}
                </div>
                {statsLoading ? (
                  <div className="mt-2 h-7 bg-zinc-800 rounded animate-pulse" />
                ) : (
                  <div className="mt-1 text-2xl font-black text-white">
                    {s?.translated ?? 0}
                    <span className="text-sm font-normal text-zinc-500">/{s?.total ?? 0}</span>
                  </div>
                )}
                {s && !statsLoading && (
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {pendingCount > 0 && (
                      <span className="text-[10px] text-amber-500 font-medium">{pendingCount} pendentes</span>
                    )}
                    {(s as { hiddenPending?: number } | undefined)?.hiddenPending ? (
                      <span className="text-[10px] text-zinc-500 font-medium">+{(s as { hiddenPending: number }).hiddenPending} ocultos</span>
                    ) : null}
                    {prodS?.failed && prodS.failed > 0 ? (
                      <span className="text-[10px] text-red-400 font-medium">{prodS.failed} falhas</span>
                    ) : null}
                    {prodS?.noSynopsis && prodS.noSynopsis > 0 ? (
                      <span className="text-[10px] text-zinc-600">{prodS.noSynopsis} sem sinopse</span>
                    ) : null}
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-1 text-[10px] text-zinc-600">{pct}% pt-BR</div>
                )}
              </button>
            )
          })}
        </div>

        {/* Painel de tradução em tempo real — colapsável */}
        {showBatchPanel && (
          <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 border-b border-white/10">
              <div className="flex items-center gap-3">
                {running
                  ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  : <CheckCircle className="w-4 h-4 text-green-400" />}
                <span className="text-sm font-medium text-zinc-200">
                  {running ? 'Tradução em andamento...' : 'Tradução concluída'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="font-mono tabular-nums">⏱ {formatElapsed(elapsed)}</span>
                <span className="text-green-400 font-medium">{translatedCount} ✓</span>
                {skippedCount > 0 && <span>{skippedCount} ignorados</span>}
                {failedCount > 0 && <span className="text-red-400 font-medium">{failedCount} ✗</span>}
                {!running && (
                  <button
                    onClick={() => { setProgressLog([]); setRunResult(null); setElapsed(0); setBatchPanelOpen(false) }}
                    className="text-zinc-600 hover:text-zinc-400 text-xs underline"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
            {currentItem && (
              <div className="h-1 bg-zinc-800">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.round((processedCount / currentItem.total) * 100)}%` }} />
              </div>
            )}
            <div className="max-h-48 overflow-y-auto px-4 py-2 space-y-1">
              {progressLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-sm">
                  {entry.status === 'translated' && <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  {entry.status === 'skipped' && <SkipForward className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />}
                  {entry.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  <span className={`flex-1 truncate text-sm ${
                    entry.status === 'failed' ? 'text-red-400' :
                    entry.status === 'skipped' ? 'text-zinc-600' : 'text-zinc-300'
                  }`}>{entry.name}</span>
                  <span className="text-xs text-zinc-600 flex-shrink-0">
                    {entry.status === 'translated' ? 'traduzido' : entry.status === 'skipped' ? 'já em PT' : 'falhou'}
                  </span>
                </div>
              ))}
              {currentItem && (
                <div className="flex items-center gap-2 py-0.5 text-sm">
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                  <span className="flex-1 truncate text-blue-300 font-medium">{currentItem.name}</span>
                  <span className="text-xs text-blue-500 flex-shrink-0">processando...</span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>
            {runResult && (
              <div className={`px-4 py-2 text-sm border-t ${
                runResult.startsWith('erro') ? 'bg-red-900/20 text-red-400 border-red-900/30' : 'bg-green-900/20 text-green-400 border-green-900/30'
              }`}>
                {runResult.startsWith('erro') ? `Erro: ${runResult}` : `Concluído: ${runResult}`}
              </div>
            )}
          </div>
        )}

        {/* Tabs + filtros + lista */}
        <div className="bg-zinc-900 rounded-xl border border-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-white/10 flex-wrap">
            {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === type
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ENTITY_LABELS[type]}
                {/* Badge de pendências para todos os tipos */}
                {(stats?.[type]?.pending ?? 0) > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400">
                    {stats![type].pending}
                  </span>
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pb-3">
              {/* Ver resultado anterior quando painel fechado */}
              {!batchPanelOpen && runResult && (
                <button
                  onClick={() => setBatchPanelOpen(true)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 underline"
                >
                  Ver resultado anterior
                </button>
              )}
              {/* Link para log */}
              <Link
                href="/admin/translations/log"
                title="Ver log de traduções"
                className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800"
              >
                <History className="w-4 h-4" />
              </Link>
              {canTranslate && (
                <>
                  <div className="relative">
                    <select
                      value={batchLimit}
                      onChange={e => setBatchLimit(Number(e.target.value))}
                      disabled={running}
                      className="appearance-none pl-2 pr-6 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50 cursor-pointer"
                      title="Quantidade por lote"
                    >
                      {BATCH_LIMIT_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleRunBatch}
                    disabled={running}
                    title={`Traduzir próximos ${batchLimit} ${ENTITY_LABELS[activeTab].toLowerCase()} pendentes`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors"
                  >
                    <Zap className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                    {running ? 'Traduzindo...' : 'Traduzir (IA)'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info contextual para produções */}
          {isProduction && prodStats && !statsLoading && prodStats.pending > 0 && (
            <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-700/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                <strong>{prodStats.pending}</strong> sinopses pendentes de tradução.
                Clique em <strong>Traduzir (IA)</strong> para processar em lotes.
                A sinopse original é preservada — a tradução fica em ContentTranslation.
              </p>
            </div>
          )}

          {/* Busca + filtros de status */}
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-white/5">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-zinc-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </form>
            <div className="flex gap-1 flex-wrap items-center">
              {FILTERS_BY_TAB[activeTab].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    statusFilter === val
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              {/* Subfiltro visibilidade */}
              <div className="flex gap-1 ml-2 pl-2 border-l border-white/10">
                {(['visible', 'hidden'] as const).map(v => {
                  const s = stats?.[activeTab]
                  const hiddenCount = (s as { hiddenPending?: number } | undefined)?.hiddenPending ?? 0
                  return (
                    <button
                      key={v}
                      onClick={() => setHiddenFilter(v)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        hiddenFilter === v
                          ? 'bg-zinc-600 text-white'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {v === 'visible' ? 'Visíveis' : 'Ocultos'}
                      {v === 'hidden' && hiddenCount > 0 && (
                        <span className="text-[10px] font-bold px-1 rounded text-zinc-400">{hiddenCount}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Subfiltro de fonte — apenas para artistas */}
              {activeTab === 'artist' && (
                <div className="flex gap-1 ml-2 pl-2 border-l border-white/10">
                  {SOURCE_FILTER_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSourceFilter(val)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        sourceFilter === val
                          ? 'bg-zinc-600 text-white'
                          : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={fetchItems} className="ml-auto p-1.5 text-zinc-600 hover:text-zinc-400" title="Recarregar">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Barra de ações em massa */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 border-b border-purple-700/20">
              <span className="text-xs text-zinc-400">{selected.size} selecionados</span>
              <button
                onClick={handleBulkApprove}
                disabled={bulkApproving}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-700 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-3 h-3" />
                {bulkApproving ? 'Aprovando...' : `Aprovar ${selected.size}`}
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-zinc-600 hover:text-zinc-400"
              >
                Limpar seleção
              </button>
              {draftCount > 0 && (
                <button
                  onClick={selectAllDraft}
                  className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto"
                >
                  Selecionar todos rascunhos ({draftCount})
                </button>
              )}
            </div>
          )}

          {/* Header de seleção quando há rascunhos visíveis */}
          {selected.size === 0 && draftCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-white/5">
              <button
                onClick={selectAllDraft}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Selecionar {draftCount} rascunho{draftCount !== 1 ? 's' : ''} desta página
              </button>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="p-8 text-center text-zinc-600">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">Nenhum resultado</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map(item => {
                const editHref = isProduction
                  ? `/admin/translations/production/${item.id}`
                  : `/admin/translations/${activeTab}/${item.id}`
                const isTranslating = singleTranslating.has(item.id)
                const isDone = singleDone.has(item.id)
                const isApprovingItem = approving.has(item.id)
                const isSelectedItem = selected.has(item.id)
                const canSingleTranslate = canTranslate && item.status !== 'approved'
                const canApprove = item.status === 'draft'
                return (
                  <li key={item.id} className={isSelectedItem ? 'bg-purple-900/10' : ''}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors group">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelectedItem}
                          onChange={() => toggleSelected(item.id)}
                          className="accent-purple-500 cursor-pointer w-3.5 h-3.5"
                        />
                      </div>

                      {/* Conteúdo clicável */}
                      <Link href={editHref} className="flex-1 min-w-0 flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-zinc-100 truncate">{item.label}</span>
                            {item.subtitle && (
                              <span className="text-xs text-zinc-600 truncate hidden sm:inline">{item.subtitle}</span>
                            )}
                            {/* Badge fonte para artistas */}
                            {activeTab === 'artist' && item.bioSource && SYNOPSIS_SOURCE_LABELS[item.bioSource] && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${SYNOPSIS_SOURCE_LABELS[item.bioSource].cls}`}>
                                {SYNOPSIS_SOURCE_LABELS[item.bioSource].label}
                              </span>
                            )}
                          </div>
                          {/* Snippet original */}
                          {item.snippet && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {item.snippet}
                            </p>
                          )}
                          {/* Preview PT-BR */}
                          {item.ptSnippet && (item.status === 'draft' || item.status === 'approved') && (
                            <p className="text-xs text-purple-400/70 mt-1 line-clamp-2 leading-relaxed">
                              <span className="text-zinc-600 mr-1">pt-BR:</span>{item.ptSnippet}
                            </p>
                          )}
                          {isProduction && item.synopsisSource && item.status !== 'draft' && item.status !== 'approved' && (
                            <div className="text-[10px] text-zinc-600 mt-0.5">
                              Origem: {SYNOPSIS_SOURCE_LABELS[item.synopsisSource]?.label ?? item.synopsisSource}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          {/* Botão aprovar inline */}
                          {canApprove && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleApprove([item.id]) }}
                              disabled={isApprovingItem}
                              title="Aprovar tradução"
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-700/30 hover:bg-green-800/60 disabled:opacity-50 transition-colors"
                            >
                              {isApprovingItem
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <CheckCircle className="w-3 h-3" />}
                              Aprovar
                            </button>
                          )}

                          {/* Botão traduzir individual */}
                          {canSingleTranslate && (
                            <button
                              onClick={(e) => handleTranslateSingle(item.id, e)}
                              disabled={isTranslating}
                              title="Traduzir este item com IA"
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-50 ${
                                isDone
                                  ? 'bg-green-900/40 text-green-400 border border-green-700/30'
                                  : 'bg-zinc-800 text-zinc-500 hover:bg-purple-900/40 hover:text-purple-400 border border-white/5 hover:border-purple-700/30'
                              }`}
                            >
                              {isTranslating
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : isDone
                                  ? <CheckCircle className="w-3 h-3" />
                                  : <Sparkles className="w-3 h-3" />}
                              {isDone ? 'Traduzido' : 'IA'}
                            </button>
                          )}

                          {/* Badge de status */}
                          {isProduction
                            ? <ProductionBadge item={item} />
                            : item.status ? (
                              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[item.status]}`}>
                                {STATUS_LABELS[item.status]}
                              </span>
                            ) : null}

                          {isProduction
                            ? <Pencil className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400" />
                            : <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400" />}
                        </div>
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Paginação */}
          {total > 30 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-zinc-600">{total} itens</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-white/10 rounded-lg disabled:opacity-40 hover:bg-zinc-800 text-zinc-400"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-xs text-zinc-500">Página {page} de {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 text-xs border border-white/10 rounded-lg disabled:opacity-40 hover:bg-zinc-800 text-zinc-400"
                >
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

export default function TranslationsPage() {
  return (
    <Suspense fallback={null}>
      <TranslationsPageContent />
    </Suspense>
  )
}
