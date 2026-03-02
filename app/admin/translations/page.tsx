'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Search, ChevronRight, RefreshCw, Zap, CheckCircle, XCircle, SkipForward, Loader2 } from 'lucide-react'
import Link from 'next/link'

type EntityType = 'artist' | 'group' | 'production' | 'news'
type StatusFilter = '' | 'pending' | 'draft' | 'approved'

interface Stats {
  artist:     { total: number; translated: number }
  group:      { total: number; translated: number }
  production: { total: number; translated: number }
  news:       { total: number; translated: number }
}

interface TranslationItem {
  id: string
  label: string
  fields: string[]
  status: 'pending' | 'draft' | 'approved'
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
  pending: 'Pendente',
  draft: 'Rascunho',
  approved: 'Aprovado',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  draft: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
}

const FIELD_LABELS: Record<string, string> = {
  bio: 'bio',
  synopsis: 'sinopse',
  tagline: 'tagline',
  title: 'título',
  contentMd: 'conteúdo',
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
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

  // Estado de tradução em tempo real
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
    const params = new URLSearchParams({
      entityType: activeTab,
      page: String(page),
      limit: '30',
    })
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
  useEffect(() => { setPage(1) }, [activeTab, statusFilter, q])
  useEffect(() => { fetchItems() }, [fetchItems])

  // Auto-scroll para o fim do log conforme cresce
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progressLog, currentItem])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchItems()
  }

  const startTimer = () => {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const handleRunBatch = () => {
    if (!['artist', 'group'].includes(activeTab)) {
      setRunResult('Tradução automática disponível apenas para Artistas e Grupos.')
      return
    }
    setRunning(true)
    setRunResult(null)
    setProgressLog([])
    setCurrentItem(null)
    startTimer()

    const params = new URLSearchParams({ entityType: activeTab, limit: '10' })
    const es = new EventSource(`/api/admin/translations/run?${params}`)

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as ProgressEvent & { type: string; translated?: number; skipped?: number; failed?: number; message?: string }

      if (data.type === 'progress') {
        if (data.status === 'processing') {
          setCurrentItem(data)
        } else {
          setCurrentItem(null)
          setProgressLog(prev => [...prev, data])
        }
      } else if (data.type === 'done') {
        es.close()
        stopTimer()
        setRunning(false)
        setCurrentItem(null)
        setRunResult(`Traduzidos: ${data.translated ?? 0} · Ignorados: ${data.skipped ?? 0} · Falhas: ${data.failed ?? 0}`)
        fetchStats()
        fetchItems()
      } else if (data.type === 'error') {
        es.close()
        stopTimer()
        setRunning(false)
        setCurrentItem(null)
        setRunResult(`erro: ${data.message}`)
      }
    }

    es.onerror = () => {
      es.close()
      stopTimer()
      setRunning(false)
      setCurrentItem(null)
      setRunResult('erro: falha ao conectar com o servidor.')
    }
  }

  const translatedCount = progressLog.filter(e => e.status === 'translated').length
  const skippedCount = progressLog.filter(e => e.status === 'skipped').length
  const failedCount = progressLog.filter(e => e.status === 'failed').length
  const processedCount = progressLog.length

  return (
    <AdminLayout title="Traduções">
      <div className="space-y-6">

        {/* Cards de progresso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => {
            const s = stats?.[type]
            return (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  activeTab === type
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-600">{ENTITY_LABELS[type]}</div>
                {statsLoading ? (
                  <div className="mt-1 h-6 bg-gray-100 rounded animate-pulse" />
                ) : (
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {s?.translated ?? 0}
                    <span className="text-sm font-normal text-gray-400">/{s?.total ?? 0}</span>
                  </div>
                )}
                {s && s.total > 0 && (
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.round((s.translated / s.total) * 100)}%` }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Painel de tradução em tempo real */}
        {(running || progressLog.length > 0) && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                {running ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {running ? 'Tradução em andamento...' : 'Tradução concluída'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="font-mono tabular-nums">⏱ {formatElapsed(elapsed)}</span>
                <span className="text-green-600 font-medium">{translatedCount} ✓</span>
                {skippedCount > 0 && <span className="text-gray-500">{skippedCount} ignorados</span>}
                {failedCount > 0 && <span className="text-red-600 font-medium">{failedCount} ✗</span>}
                {!running && (
                  <button
                    onClick={() => { setProgressLog([]); setRunResult(null); setElapsed(0) }}
                    className="text-gray-400 hover:text-gray-600 text-xs underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Barra de progresso geral */}
            {currentItem && (
              <div className="h-1 bg-gray-100">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.round((processedCount / currentItem.total) * 100)}%` }}
                />
              </div>
            )}

            {/* Log de itens */}
            <div className="max-h-52 overflow-y-auto px-4 py-2 space-y-1">
              {progressLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 py-1 text-sm">
                  {entry.status === 'translated' && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                  {entry.status === 'skipped' && <SkipForward className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                  {entry.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                  <span className={`flex-1 truncate ${
                    entry.status === 'failed' ? 'text-red-700' :
                    entry.status === 'skipped' ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {entry.name}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {entry.status === 'translated' ? 'traduzido' :
                     entry.status === 'skipped' ? 'já em PT' : 'falhou'}
                  </span>
                </div>
              ))}

              {/* Item sendo processado agora */}
              {currentItem && (
                <div className="flex items-center gap-2 py-1 text-sm">
                  <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                  <span className="flex-1 truncate text-blue-700 font-medium">{currentItem.name}</span>
                  <span className="text-xs text-blue-400 flex-shrink-0">processando...</span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>

            {/* Resultado final */}
            {runResult && (
              <div className={`px-4 py-2 text-sm border-t ${
                runResult.startsWith('erro')
                  ? 'bg-red-50 text-red-700 border-red-100'
                  : 'bg-green-50 text-green-700 border-green-100'
              }`}>
                {runResult.startsWith('erro') ? `❌ ${runResult}` : `✅ ${runResult}`}
              </div>
            )}
          </div>
        )}

        {/* Resultado quando não tem log ativo */}
        {runResult && progressLog.length === 0 && (
          <div className={`px-4 py-2 rounded-lg text-sm ${
            runResult.startsWith('erro')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}>
            {runResult.startsWith('erro') ? `❌ ${runResult}` : `✅ ${runResult}`}
          </div>
        )}

        {/* Tabs + filtros */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 px-4 pt-4 border-b border-gray-200 flex-wrap">
            {(['artist', 'group', 'production', 'news'] as EntityType[]).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === type
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {ENTITY_LABELS[type]}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 pb-3">
              <Link
                href="/admin/translations/log"
                className="text-sm text-gray-500 hover:text-gray-700 px-3"
              >
                Log de alterações →
              </Link>
              {['artist', 'group'].includes(activeTab) && (
                <button
                  onClick={handleRunBatch}
                  disabled={running}
                  title="Traduzir próximos 10 pendentes com IA"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Zap className={`w-3.5 h-3.5 ${running ? 'animate-pulse' : ''}`} />
                  {running ? 'Traduzindo...' : 'Traduzir (IA)'}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 flex flex-wrap gap-3 items-center border-b border-gray-100">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>

            {/* Filtro de status */}
            <div className="flex gap-1">
              {([['', 'Todos'], ['pending', 'Pendentes'], ['draft', 'Rascunho'], ['approved', 'Aprovados']] as [StatusFilter, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStatusFilter(val)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    statusFilter === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchItems}
              className="ml-auto p-1.5 text-gray-400 hover:text-gray-600"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Lista */}
          {loading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {statusFilter === 'pending'
                ? `Nenhum ${ENTITY_LABELS[activeTab].toLowerCase().slice(0, -1)} pendente de tradução`
                : 'Nenhum resultado'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map(item => (
                <li key={item.id}>
                  <Link
                    href={`/admin/translations/${activeTab}/${item.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.fields.map(f => FIELD_LABELS[f] ?? f).join(', ')}
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                      {STATUS_LABELS[item.status]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Paginação */}
          {total > 30 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">{total} itens</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">Página {page}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={items.length < 30}
                  className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
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
