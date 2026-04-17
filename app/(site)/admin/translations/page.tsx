'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { AdminButton, AdminIconButton, AdminIconLink } from '@/components/admin'
import { Search, ChevronRight, RefreshCw, Zap, CheckCircle, XCircle, SkipForward, Loader2, Pencil, AlertCircle, History, ChevronDown, Sparkles, ExternalLink, DollarSign, RotateCcw } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type StatusFilter = '' | 'pending' | 'draft' | 'approved' | 'no_synopsis'

interface Stats {
  artist:     { total: number; translated: number; approved: number; draft: number; pending: number; hiddenPending: number }
  group:      { total: number; translated: number; approved: number; draft: number; pending: number; hiddenPending: number }
  production: { total: number; translated: number; approved: number; draft: number; pending: number; failed: number; noSynopsis: number; hiddenPending: number }
  news:       { total: number; translated: number; approved: number; draft: number; pending: number; hiddenPending: number }
}

interface TranslationItem {
  id: string
  label: string
  subtitle?: string
  fields: string[]
  snippet?: string
  ptSnippet?: string
  bioSource?: string | null
  status?: 'pending' | 'draft' | 'approved' | 'no_synopsis'
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
  pending: 'bg-surface text-muted',
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
  production: [['', 'Todos'], ['pending', 'Pendentes'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados'], ['no_synopsis', 'Sem sinopse']],
  news:       [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Traduzido (IA)'], ['approved', 'Revisados']],
}

// Tipos que suportam tradução automática via IA
const TRANSLATABLE_TYPES: EntityType[] = ['artist', 'group', 'production']

const BATCH_LIMIT_OPTIONS = [5, 10, 25, 50, 100, 150, 200, 250, 300]

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
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface text-muted border border-border">
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
  return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface text-muted border border-border">Pendente</span>
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

  const [bulkTranslating, setBulkTranslating] = useState(false)
  const [bulkTranslateProgress, setBulkTranslateProgress] = useState(0)

  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([])
  const [currentItem, setCurrentItem] = useState<ProgressEvent | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [batchLimit, setBatchLimit] = useState(10)
  const [batchPanelOpen, setBatchPanelOpen] = useState(false)
  const [sessionStats, setSessionStats] = useState<{ translated: number; cost: number }>({ translated: 0, cost: 0 })
  const [historicalCost, setHistoricalCost] = useState<{ allTime: number; last30d: number } | null>(null)
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
  useEffect(() => {
    fetch('/api/admin/translations/cost').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setHistoricalCost({ allTime: d.allTime, last30d: d.last30d })
    })
  }, [])

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

  const handleBulkTranslate = useCallback(async () => {
    if (!TRANSLATABLE_TYPES.includes(activeTab)) return
    setBulkTranslating(true)
    setBulkTranslateProgress(0)
    const ids = Array.from(selected)
    let done = 0
    for (const id of ids) {
      try {
        await fetch('/api/admin/translations/single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: activeTab, id }),
        })
      } catch { /* continua */ }
      done++
      setBulkTranslateProgress(done)
    }
    setBulkTranslating(false)
    setSelected(new Set())
    await fetchItems()
    await fetchStats()
  }, [selected, activeTab, fetchItems, fetchStats])

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

  const [resettingCircuits, setResettingCircuits] = useState(false)
  const handleResetCircuits = async () => {
    setResettingCircuits(true)
    try {
      const res = await fetch('/api/admin/ai/reset-circuits', { method: 'POST' })
      if (res.ok) setRunResult('✓ Circuits resetados — tente traduzir novamente.')
      else setRunResult('Erro ao resetar circuits.')
    } catch {
      setRunResult('Erro ao resetar circuits.')
    } finally {
      setResettingCircuits(false)
    }
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
      const data = JSON.parse(event.data) as ProgressEvent & { type: string; translated?: number; skipped?: number; failed?: number; totalCostUsd?: number; message?: string }
      if (data.type === 'progress') {
        if (data.status === 'processing') setCurrentItem(data)
        else { setCurrentItem(null); setProgressLog(prev => [...prev, data]) }
      } else if (data.type === 'done') {
        es.close(); stopTimer(); setRunning(false); setCurrentItem(null)
        const cost = data.totalCostUsd ?? 0
        setSessionStats(prev => ({ translated: prev.translated + (data.translated ?? 0), cost: prev.cost + cost }))
        if (cost > 0) setHistoricalCost(prev => prev ? { allTime: prev.allTime + cost, last30d: prev.last30d + cost } : null)
        const costStr = cost > 0 ? ` · $${cost.toFixed(4)}` : ''
        setRunResult(`Traduzidos: ${data.translated ?? 0} · Ignorados: ${data.skipped ?? 0} · Falhas: ${data.failed ?? 0}${costStr}`)
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

        <PageGuide
          storageKey="translations"
          title="Como funciona o módulo de Traduções"
          description="Gerencia a tradução de conteúdo para português (PT-BR). Cada entidade (artista, grupo, produção, notícia) tem campos independentes que passam pelos status: Pendente → Rascunho IA → Revisado."
          steps={[
            { label: 'Pendente', description: 'Sem tradução — conteúdo só em inglês/coreano', color: 'zinc' },
            { label: 'Traduzir IA', description: 'Clique em "Traduzir" para gerar via GPT', color: 'purple' },
            { label: 'Rascunho', description: 'IA gerou, aguarda revisão humana', color: 'yellow' },
            { label: 'Revisar', description: 'Editor lê e ajusta o texto gerado', color: 'blue' },
            { label: 'Aprovado', description: 'Texto revisado e publicado no site', color: 'green' },
          ]}
          tips={[
            { text: 'Filtre por "Sem tradução" para focar no backlog mais urgente.' },
            { text: 'Clique em "Traduzir todos" na aba para processar toda a fila pendente em sequência.' },
            { text: 'Produções com "Sem sinopse" não entram na fila — gere a sinopse primeiro em Enriquecimento.' },
            { text: 'Status "Skipped" significa que a entidade foi marcada para não traduzir (ex: produção não-coreana).' },
            { text: 'Use o histórico (ícone de relógio) para ver versões anteriores de uma tradução.' },
          ]}
        />

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
                    : 'border-border bg-surface hover:bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-muted uppercase tracking-widest">{ENTITY_LABELS[type]}</span>
                  {TRANSLATABLE_TYPES.includes(type) && (
                    <span className="text-[10px] text-muted font-medium">IA</span>
                  )}
                </div>
                {statsLoading ? (
                  <div className="mt-2 h-7 bg-surface rounded animate-pulse" />
                ) : (
                  <div className="mt-1 text-2xl font-black text-foreground">
                    {s?.translated ?? 0}
                    <span className="text-sm font-normal text-muted">/{s?.total ?? 0}</span>
                  </div>
                )}
                {s && !statsLoading && (
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {pendingCount > 0 && (
                      <span className="text-[10px] text-amber-500 font-medium">{pendingCount} pendentes</span>
                    )}
                    {(s as { hiddenPending?: number } | undefined)?.hiddenPending ? (
                      <span className="text-[10px] text-muted font-medium">+{(s as { hiddenPending: number }).hiddenPending} ocultos</span>
                    ) : null}
                    {prodS?.failed && prodS.failed > 0 ? (
                      <span className="text-[10px] text-red-400 font-medium">{prodS.failed} falhas</span>
                    ) : null}
                    {prodS?.noSynopsis && prodS.noSynopsis > 0 ? (
                      <span className="text-[10px] text-muted">{prodS.noSynopsis} sem sinopse</span>
                    ) : null}
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.round(((s as { approved?: number }).approved ?? 0) / s.total * 100)}%` }} />
                    <div className="h-full bg-yellow-500/70 transition-all" style={{ width: `${Math.round(((s as { draft?: number }).draft ?? 0) / s.total * 100)}%` }} />
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-1 flex gap-2 text-[10px] flex-wrap">
                    {((s as { approved?: number }).approved ?? 0) > 0 && (
                      <span className="text-green-500">{(s as { approved: number }).approved} rev.</span>
                    )}
                    {((s as { draft?: number }).draft ?? 0) > 0 && (
                      <span className="text-yellow-500/80">{(s as { draft: number }).draft} IA</span>
                    )}
                    <span className="text-muted ml-auto">{pct}%</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Widget de custo */}
        {(historicalCost !== null || sessionStats.translated > 0) && (
          <div className="flex flex-wrap gap-3 items-center px-4 py-2.5 rounded-xl border border-border bg-surface">
            <DollarSign className="w-3.5 h-3.5 text-muted flex-shrink-0" />
            {historicalCost !== null && (
              <>
                <span className="text-xs text-muted">
                  Total histórico: <span className="text-foreground font-mono">${historicalCost.allTime.toFixed(4)}</span>
                </span>
                <span className="text-xs text-muted">·</span>
                <span className="text-xs text-muted">
                  Últimos 30 dias: <span className="text-foreground font-mono">${historicalCost.last30d.toFixed(4)}</span>
                </span>
              </>
            )}
            {sessionStats.translated > 0 && (
              <>
                {historicalCost !== null && <span className="text-xs text-muted">|</span>}
                <span className="text-xs text-emerald-500/80 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Sessão: {sessionStats.translated} traduzidos
                  {sessionStats.cost > 0 && <> · <span className="font-mono">${sessionStats.cost.toFixed(4)}</span></>}
                </span>
              </>
            )}
          </div>
        )}

        {/* Painel de tradução em tempo real — colapsável */}
        {showBatchPanel && (
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border">
              <div className="flex items-center gap-3">
                {running
                  ? <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  : <CheckCircle className="w-4 h-4 text-green-400" />}
                <span className="text-sm font-medium text-foreground">
                  {running ? 'Tradução em andamento...' : 'Tradução concluída'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span className="font-mono tabular-nums">⏱ {formatElapsed(elapsed)}</span>
                <span className="text-green-400 font-medium">{translatedCount} ✓</span>
                {skippedCount > 0 && <span>{skippedCount} ignorados</span>}
                {failedCount > 0 && <span className="text-red-400 font-medium">{failedCount} ✗</span>}
                {!running && (
                  <button
                    onClick={() => { setProgressLog([]); setRunResult(null); setElapsed(0); setBatchPanelOpen(false) }}
                    className="text-muted hover:text-muted text-xs underline"
                  >
                    Fechar
                  </button>
                )}
              </div>
            </div>
            {currentItem && (
              <div className="h-1 bg-surface">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.round((processedCount / currentItem.total) * 100)}%` }} />
              </div>
            )}
            <div className="max-h-48 overflow-y-auto px-4 py-2 space-y-1">
              {progressLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 text-sm">
                  {entry.status === 'translated' && <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  {entry.status === 'skipped' && <SkipForward className="w-3.5 h-3.5 text-muted flex-shrink-0" />}
                  {entry.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  <span className={`flex-1 truncate text-sm ${
                    entry.status === 'failed' ? 'text-red-400' :
                    entry.status === 'skipped' ? 'text-muted' : 'text-foreground'
                  }`}>{entry.name}</span>
                  <span className="text-xs text-muted flex-shrink-0">
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
        <div className="bg-surface rounded-xl border border-border">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 border-b border-border flex-wrap">
            {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`pb-3 px-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === type
                    ? 'border-purple-500 text-purple-300'
                    : 'border-transparent text-muted hover:text-foreground'
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
                  className="text-xs text-muted hover:text-muted underline"
                >
                  Ver resultado anterior
                </button>
              )}
              {/* Link para log */}
              <AdminIconLink href="/admin/translations/log" title="Ver log de traduções">
                <History className="w-4 h-4" />
              </AdminIconLink>
              {canTranslate && (
                <>
                  <div className="relative">
                    <select
                      value={batchLimit}
                      onChange={e => setBatchLimit(Number(e.target.value))}
                      disabled={running}
                      className="appearance-none pl-2 pr-6 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-accent/50 disabled:opacity-50 cursor-pointer"
                      title="Quantidade por lote"
                    >
                      {BATCH_LIMIT_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted pointer-events-none" />
                  </div>
                  <AdminButton
                    onClick={handleRunBatch}
                    disabled={running}
                    title={`Traduzir próximos ${batchLimit} ${ENTITY_LABELS[activeTab].toLowerCase()} pendentes`}
                    variant="primary"
                    size="sm"
                  >
                    <Zap className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                    {running ? 'Traduzindo...' : 'Traduzir (IA)'}
                  </AdminButton>
                  <AdminButton
                    onClick={handleResetCircuits}
                    disabled={running || resettingCircuits}
                    title="Resetar circuit breakers dos providers de IA (usar se houver falhas em série)"
                    variant="secondary"
                    size="sm"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resettingCircuits ? 'animate-spin' : ''}`} />
                    Reset circuits
                  </AdminButton>
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
          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-border">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="px-4 pr-10 py-1.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50"
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
                      ? 'bg-purple-600 text-foreground'
                      : 'bg-surface text-muted hover:bg-surface hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
              {/* Subfiltro visibilidade */}
              <div className="flex gap-1 ml-2 pl-2 border-l border-border">
                {(['visible', 'hidden'] as const).map(v => {
                  const s = stats?.[activeTab]
                  const hiddenCount = (s as { hiddenPending?: number } | undefined)?.hiddenPending ?? 0
                  return (
                    <button
                      key={v}
                      onClick={() => setHiddenFilter(v)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        hiddenFilter === v
                          ? 'bg-surface-hover text-foreground'
                          : 'bg-surface text-muted hover:bg-surface hover:text-foreground'
                      }`}
                    >
                      {v === 'visible' ? 'Visíveis' : 'Ocultos'}
                      {v === 'hidden' && hiddenCount > 0 && (
                        <span className="text-[10px] font-bold px-1 rounded text-muted">{hiddenCount}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {/* Subfiltro de fonte — apenas para artistas */}
              {activeTab === 'artist' && (
                <div className="flex gap-1 ml-2 pl-2 border-l border-border">
                  {SOURCE_FILTER_OPTIONS.map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setSourceFilter(val)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        sourceFilter === val
                          ? 'bg-surface-hover text-foreground'
                          : 'bg-surface text-muted hover:bg-surface hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <AdminIconButton onClick={fetchItems} title="Recarregar" variant="default" className="ml-auto">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </AdminIconButton>
          </div>

          {/* Barra de ações em massa */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-900/20 border-b border-purple-700/20 flex-wrap">
              <span className="text-xs text-muted">{selected.size} selecionados</span>
              {canTranslate && (
                <AdminButton
                  onClick={handleBulkTranslate}
                  disabled={bulkTranslating || bulkApproving}
                  variant="primary"
                  size="sm"
                >
                  <Sparkles className="w-3 h-3" />
                  {bulkTranslating ? `Traduzindo ${bulkTranslateProgress}/${selected.size}...` : 'Traduzir (IA)'}
                </AdminButton>
              )}
              <AdminButton
                onClick={handleBulkApprove}
                disabled={bulkApproving || bulkTranslating}
                variant="secondary"
                size="sm"
              >
                <CheckCircle className="w-3 h-3" />
                {bulkApproving ? 'Aprovando...' : `Aprovar ${selected.size}`}
              </AdminButton>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-muted hover:text-muted"
              >
                Limpar
              </button>
              {draftCount > 0 && (
                <button
                  onClick={selectAllDraft}
                  className="text-xs text-muted hover:text-muted ml-auto"
                >
                  Sel. todos rascunhos ({draftCount})
                </button>
              )}
            </div>
          )}

          {/* Header de seleção quando há rascunhos visíveis */}
          {selected.size === 0 && draftCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border">
              <button
                onClick={selectAllDraft}
                className="text-[11px] text-muted hover:text-muted transition-colors"
              >
                Selecionar {draftCount} rascunho{draftCount !== 1 ? 's' : ''} desta página
              </button>
              {statusFilter === 'draft' && (
                <button
                  onClick={() => handleApprove(items.map(i => i.id))}
                  className="text-[11px] text-green-600 hover:text-green-400 transition-colors ml-auto"
                >
                  Aprovar todos desta página ({draftCount})
                </button>
              )}
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="p-8 text-center text-muted">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted">Nenhum resultado</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map(item => {
                const editHref = isProduction
                  ? `/admin/translations/production/${item.id}`
                  : `/admin/translations/${activeTab}/${item.id}`
              const publicHref = activeTab === 'artist' ? `/artists/${item.id}`
                : activeTab === 'group' ? `/groups/${item.id}`
                : activeTab === 'production' ? `/productions/${item.id}`
                : null
                const isTranslating = singleTranslating.has(item.id)
                const isDone = singleDone.has(item.id)
                const isApprovingItem = approving.has(item.id)
                const isSelectedItem = selected.has(item.id)
                const canSingleTranslate = canTranslate && item.status !== 'approved' && item.status !== 'no_synopsis'
                const canApprove = item.status === 'draft'
                return (
                  <li key={item.id} className={isSelectedItem ? 'bg-purple-900/10' : ''}>
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface transition-colors group">
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
                            <span className="font-medium text-foreground truncate">{item.label}</span>
                            {item.subtitle && (
                              <span className="text-xs text-muted truncate hidden sm:inline">{item.subtitle}</span>
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
                            <p className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">
                              {item.snippet}
                            </p>
                          )}
                          {/* Preview PT-BR via ContentTranslation */}
                          {item.ptSnippet && (item.status === 'draft' || item.status === 'approved') && (
                            <p className="text-xs text-purple-400/70 mt-1 line-clamp-2 leading-relaxed">
                              <span className="text-muted mr-1">pt-BR:</span>{item.ptSnippet}
                            </p>
                          )}
                          {/* Produções TMDB·pt: sinopse já está em PT no campo original */}
                          {isProduction && item.synopsisSource === 'tmdb_pt' && !item.ptSnippet && item.snippet && (
                            <p className="text-xs text-green-400/60 mt-1 line-clamp-2 leading-relaxed">
                              <span className="text-green-700 mr-1">tmdb·pt:</span>{item.snippet}
                            </p>
                          )}
                          {isProduction && item.synopsisSource && item.synopsisSource !== 'tmdb_pt' && item.status !== 'draft' && item.status !== 'approved' && (
                            <div className="text-[10px] text-muted mt-0.5">
                              Origem: {SYNOPSIS_SOURCE_LABELS[item.synopsisSource]?.label ?? item.synopsisSource}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                          {/* Link para página pública */}
                          {publicHref && (
                            <Link
                              href={publicHref}
                              target="_blank"
                              onClick={e => e.stopPropagation()}
                              className="p-1 text-muted hover:text-muted transition-colors flex-shrink-0"
                              title="Ver página pública"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}

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
                                  : 'bg-surface text-muted hover:bg-purple-900/40 hover:text-purple-400 border border-border hover:border-purple-700/30'
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
                            ? <Pencil className="w-3.5 h-3.5 text-muted group-hover:text-muted" />
                            : <ChevronRight className="w-4 h-4 text-muted group-hover:text-muted" />}
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted">{total} itens</span>
              <div className="flex gap-2 items-center">
                <AdminButton
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="secondary"
                  size="sm"
                >
                  Anterior
                </AdminButton>
                <span className="px-3 py-1 text-xs text-muted">Página {page} de {totalPages}</span>
                <AdminButton
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  variant="secondary"
                  size="sm"
                >
                  Próxima
                </AdminButton>
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
