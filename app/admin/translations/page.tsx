'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, ChevronRight, RefreshCw, Zap, CheckCircle, XCircle, SkipForward, Loader2, Pencil, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type StatusFilter = '' | 'pending' | 'draft' | 'approved'

interface Stats {
  artist:     { total: number; translated: number }
  group:      { total: number; translated: number }
  production: { total: number; translated: number; pending: number; failed: number; noSynopsis: number }
  news:       { total: number; translated: number }
}

interface TranslationItem {
  id: string
  label: string
  subtitle?: string
  fields: string[]
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

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function ProductionBadge({ item }: { item: TranslationItem }) {
  // Prioridade: status da tradução CT > synopsisSource
  if (!item.hasSynopsis) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-600 border border-zinc-700">
        Sem sinopse
      </span>
    )
  }
  // Tradução CT existe
  if (item.status === 'approved') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-900/40 text-green-400 border border-green-700/30">Revisado</span>
  }
  if (item.status === 'draft') {
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">Traduzido (IA)</span>
  }
  // Ainda não tem tradução CT — mostra a origem
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

export default function TranslationsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeTab, setActiveTab] = useState<EntityType>('artist')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<TranslationItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)

  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)
  const [progressLog, setProgressLog] = useState<ProgressEvent[]>([])
  const [currentItem, setCurrentItem] = useState<ProgressEvent | null>(null)
  const [elapsed, setElapsed] = useState(0)
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
    if (q) params.set('q', q)
    const res = await fetch(`/api/admin/translations/list?${params}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    }
    setLoading(false)
  }, [activeTab, statusFilter, q, page])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1); setStatusFilter('') }, [activeTab])
  useEffect(() => { setPage(1) }, [statusFilter, q])
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

  const handleRunBatch = () => {
    if (!TRANSLATABLE_TYPES.includes(activeTab)) {
      setRunResult('Tradução automática não disponível para este tipo.')
      return
    }
    setRunning(true); setRunResult(null); setProgressLog([]); setCurrentItem(null); startTimer()
    const params = new URLSearchParams({ entityType: activeTab, limit: '10' })
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

  return (
    <AdminLayout title="Traduções">
      <div className="space-y-6">

        {/* Cards de progresso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => {
            const s = stats?.[type]
            const pct = s && s.total > 0 ? Math.round((s.translated / s.total) * 100) : 0
            const prodS = type === 'production' ? (s as Stats['production'] | undefined) : undefined
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
                {/* Sub-stats para produção */}
                {prodS && !statsLoading && (
                  <div className="mt-1 flex gap-2 flex-wrap">
                    {prodS.pending > 0 && (
                      <span className="text-[10px] text-amber-500 font-medium">{prodS.pending} pendentes</span>
                    )}
                    {prodS.failed > 0 && (
                      <span className="text-[10px] text-red-400 font-medium">{prodS.failed} falhas</span>
                    )}
                    {prodS.noSynopsis > 0 && (
                      <span className="text-[10px] text-zinc-600">{prodS.noSynopsis} sem sinopse</span>
                    )}
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

        {/* Painel de tradução em tempo real */}
        {(running || progressLog.length > 0) && (
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
                  <button onClick={() => { setProgressLog([]); setRunResult(null); setElapsed(0) }} className="text-zinc-600 hover:text-zinc-400 text-xs underline">
                    Limpar
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
                {runResult.startsWith('erro') ? `❌ ${runResult}` : `✅ ${runResult}`}
              </div>
            )}
          </div>
        )}

        {runResult && progressLog.length === 0 && (
          <div className={`px-4 py-2 rounded-xl text-sm ${runResult.startsWith('erro') ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
            {runResult.startsWith('erro') ? `❌ ${runResult}` : `✅ ${runResult}`}
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
                {/* Badge de pendências */}
                {type === 'production' && stats?.production.pending && stats.production.pending > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400">
                    {stats.production.pending}
                  </span>
                )}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pb-3">
              <Link href="/admin/translations/log" className="text-xs text-zinc-600 hover:text-zinc-400 px-2">
                Log →
              </Link>
              {canTranslate && (
                <button
                  onClick={handleRunBatch}
                  disabled={running}
                  title={`Traduzir próximos 10 ${ENTITY_LABELS[activeTab].toLowerCase()} pendentes`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                  {running ? 'Traduzindo...' : 'Traduzir (IA)'}
                </button>
              )}
            </div>
          </div>

          {/* Info contextual para produções */}
          {isProduction && prodStats && !statsLoading && prodStats.pending > 0 && (
            <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-700/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                <strong>{prodStats.pending}</strong> sinopses pendentes de tradução.
                Clique em <strong>Traduzir (IA)</strong> para processar em lotes de 10.
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
            <div className="flex gap-1 flex-wrap">
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
            </div>
            <button onClick={fetchItems} className="ml-auto p-1.5 text-zinc-600 hover:text-zinc-400" title="Recarregar">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="p-8 text-center text-zinc-600">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-600">Nenhum resultado</div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map(item => {
                const editHref = isProduction
                  ? `/admin/productions/${item.id}`
                  : `/admin/translations/${activeTab}/${item.id}`
                return (
                  <li key={item.id}>
                    <Link
                      href={editHref}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-zinc-100 truncate">{item.label}</div>
                        {item.subtitle && (
                          <div className="text-xs text-zinc-500 truncate mt-0.5">{item.subtitle}</div>
                        )}
                        {!isProduction && item.fields && (
                          <div className="text-xs text-zinc-600 mt-0.5">
                            {item.fields.map(f => FIELD_LABELS[f] ?? f).join(', ')}
                          </div>
                        )}
                        {isProduction && item.synopsisSource && item.status !== 'draft' && item.status !== 'approved' && (
                          <div className="text-xs text-zinc-600 mt-0.5">
                            Origem: {SYNOPSIS_SOURCE_LABELS[item.synopsisSource]?.label ?? item.synopsisSource}
                          </div>
                        )}
                      </div>

                      {/* Badge de status */}
                      {isProduction
                        ? <ProductionBadge item={item} />
                        : item.status ? (
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        ) : null}

                      {isProduction
                        ? <Pencil className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 flex-shrink-0" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Paginação */}
          {total > 30 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <span className="text-xs text-zinc-600">{total} itens</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs border border-white/10 rounded-lg disabled:opacity-40 hover:bg-zinc-800 text-zinc-400"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-xs text-zinc-500">Página {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={items.length < 30}
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
