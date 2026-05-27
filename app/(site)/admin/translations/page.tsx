'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageGuide } from '@/components/admin/PageGuide'
import { AdminButton, AdminIconButton, AdminIconLink } from '@/components/admin'
import { Search, ChevronRight, RefreshCw, CheckCircle, Loader2, Pencil, AlertCircle, History, ExternalLink, ShieldAlert } from 'lucide-react'
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

const ENTITY_LABELS: Record<EntityType, string> = {
  artist: 'Artistas',
  group: 'Grupos',
  production: 'Produções',
  news: 'Notícias',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Sem tradução',
  draft: 'Rascunho',
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
  artist:     [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Rascunhos'], ['approved', 'Revisados']],
  group:      [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Rascunhos'], ['approved', 'Revisados']],
  production: [['', 'Todos'], ['pending', 'Pendentes'], ['draft', 'Rascunhos'], ['approved', 'Revisados'], ['no_synopsis', 'Sem sinopse']],
  news:       [['', 'Todos'], ['pending', 'Sem tradução'], ['draft', 'Rascunhos'], ['approved', 'Revisados']],
}

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
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-900/40 text-yellow-400 border border-yellow-700/30">Rascunho</span>
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
  const requestedStatus = searchParams.get('status') as StatusFilter | null
  const initialStatus: StatusFilter = ['', 'pending', 'draft', 'approved', 'no_synopsis'].includes(requestedStatus ?? '')
    ? (requestedStatus ?? '') as StatusFilter
    : ''
  const [activeTab, setActiveTab] = useState<EntityType>(
    ['artist', 'group', 'production', 'news'].includes(initialTab) ? initialTab : 'artist'
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus)
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

  const initializedTabRef = useRef(false)

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
  useEffect(() => {
    if (!initializedTabRef.current) {
      initializedTabRef.current = true
      return
    }
    setPage(1); setStatusFilter(''); setHiddenFilter('visible'); setSourceFilter(''); setSelected(new Set())
  }, [activeTab])
  useEffect(() => { setPage(1); setSelected(new Set()) }, [statusFilter, hiddenFilter, q, sourceFilter])
  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchItems() }

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

  const isProduction = activeTab === 'production'
  const prodStats = stats?.production
  const draftCount = items.filter(i => i.status === 'draft').length

  return (
    <AdminLayout title="Traduções">
      <div className="space-y-6">

        <PageGuide
          storageKey="translations"
          title="Como funciona o módulo de Traduções"
          description="Gerencia textos em português (PT-BR) aplicados manualmente. Copie o conteúdo original, traduza no Gemini, revise e salve o resultado antes de aprovar."
          steps={[
            { label: 'Pendente', description: 'Sem tradução — conteúdo só em inglês/coreano', color: 'zinc' },
            { label: 'Preparar no Gemini', description: 'Gere a tradução fora do admin usando seu prompt', color: 'purple' },
            { label: 'Rascunho', description: 'Cole o texto revisado no editor', color: 'yellow' },
            { label: 'Revisar', description: 'Editor lê e ajusta o texto gerado', color: 'blue' },
            { label: 'Aprovado', description: 'Texto revisado e publicado no site', color: 'green' },
          ]}
          tips={[
            { text: 'Filtre por "Sem tradução" para focar no backlog mais urgente.' },
            { text: 'Abra um item, cole a tradução produzida no Gemini e salve como rascunho ou aprovado.' },
            { text: 'Produções com "Sem sinopse" não entram na fila — prepare o conteúdo na Curadoria Gemini primeiro.' },
            { text: 'Status "Skipped" significa que a entidade foi marcada para não traduzir (ex: produção não-coreana).' },
            { text: 'Use o histórico (ícone de relógio) para ver versões anteriores de uma tradução.' },
          ]}
        />

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-foreground">Tradução automática via DeepSeek desativada</p>
            <p className="mt-1 text-xs text-muted">Esta área permanece para organizar pendências, colar traduções revisadas do Gemini, aprovar e acompanhar histórico.</p>
          </div>
        </div>

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
                      <span className="text-yellow-500/80">{(s as { draft: number }).draft} rasc.</span>
                    )}
                    <span className="text-muted ml-auto">{pct}%</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

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
              {/* Link para log */}
              <AdminIconLink href="/admin/translations/log" title="Ver log de traduções">
                <History className="w-4 h-4" />
              </AdminIconLink>
            </div>
          </div>

          {/* Info contextual para produções */}
          {isProduction && prodStats && !statsLoading && prodStats.pending > 0 && (
            <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-700/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400">
                <strong>{prodStats.pending}</strong> sinopses pendentes de tradução.
                Abra um item, traduza no Gemini e aplique o texto revisado.
                A sinopse original e o histórico são preservados.
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
              <AdminButton
                onClick={handleBulkApprove}
                disabled={bulkApproving}
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
                const isApprovingItem = approving.has(item.id)
                const isSelectedItem = selected.has(item.id)
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
