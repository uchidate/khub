'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, Users, RefreshCw, ShieldCheck, RotateCcw, CalendarSearch, ChevronLeft, ChevronRight, X } from 'lucide-react'

const AGE_RATING_STYLES: Record<string, string> = {
  'L':  'bg-green-500/20 text-green-400 border-green-500/30',
  '10': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '12': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '14': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '16': 'bg-red-600/20 text-red-400 border-red-600/30',
  '18': 'bg-red-900/40 text-red-300 border-red-700/50',
}

const MONTHS = [
  { value: '0', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

interface Production {
  id: string
  titlePt: string
  titleKr: string | null
  type: string
  year: number | null
  imageUrl: string | null
  ageRating: string | null
  artistsCount: number
  createdAt: string
}

interface PreviewItem {
  tmdbId: number
  tmdbType: 'tv' | 'movie'
  name: string
  originalName: string | null
  date: string | null
  posterUrl: string | null
  voteAverage: number
  voteCount: number
  exists: boolean
  existingId: string | null
}

interface PreviewResult {
  results: PreviewItem[]
  total: number
  page: number
  totalPages: number
}

const columns: Column<Production>[] = [
  {
    key: 'imageUrl',
    label: 'Imagem',
    render: (production) =>
      production.imageUrl ? (
        <img
          src={production.imageUrl}
          alt={production.titlePt}
          className="w-12 h-16 rounded object-cover"
        />
      ) : (
        <div className="w-12 h-16 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
          N/A
        </div>
      ),
  },
  { key: 'titlePt', label: 'Título (PT)', sortable: true },
  {
    key: 'titleKr',
    label: 'Título (KR)',
    render: (production) =>
      production.titleKr || <span className="text-zinc-500">N/A</span>,
  },
  {
    key: 'type',
    label: 'Tipo',
    render: (production) => (
      <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400">
        {production.type}
      </span>
    ),
  },
  {
    key: 'year',
    label: 'Ano',
    sortable: true,
    render: (production) =>
      production.year || <span className="text-zinc-500">N/A</span>,
  },
  {
    key: 'ageRating',
    label: 'Faixa',
    render: (production) => production.ageRating ? (
      <span className={`px-2 py-0.5 rounded text-xs font-black border ${AGE_RATING_STYLES[production.ageRating] ?? 'bg-zinc-700/50 text-zinc-400'}`}>
        {production.ageRating === 'L' ? 'Livre' : `${production.ageRating}+`}
      </span>
    ) : <span className="text-zinc-600 text-xs">—</span>,
  },
  {
    key: 'artistsCount',
    label: 'Artistas',
    sortable: true,
    render: (production) => <span className="text-zinc-400">{production.artistsCount}</span>,
  },
]

const formFields: FormField[] = [
  { key: 'titlePt', label: 'Título em Português', type: 'text', placeholder: 'Ex: Pousando no Amor', required: true },
  { key: 'titleKr', label: 'Título em Coreano', type: 'text', placeholder: 'Ex: 사랑의 불시착' },
  { key: 'type', label: 'Tipo', type: 'text', placeholder: 'Ex: Drama, Filme, Reality Show', required: true },
  { key: 'year', label: 'Ano', type: 'number', placeholder: '2024' },
  { key: 'tagline', label: 'Tagline / Slogan', type: 'text', placeholder: 'Ex: "사랑은 눈물이다" ou frase de impacto do TMDB' },
  { key: 'synopsis', label: 'Sinopse', type: 'textarea', placeholder: 'Breve descrição da produção...' },
  { key: 'imageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://exemplo.com/poster.jpg' },
  { key: 'trailerUrl', label: 'URL do Trailer', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Ex: k-drama, romance, 2024' },
  {
    key: 'ageRating',
    label: 'Classificação Etária (DJCTQ)',
    type: 'select',
    options: [
      { value: '', label: 'Não classificado' },
      { value: 'L', label: 'Livre' },
      { value: '10', label: '10 anos' },
      { value: '12', label: '12 anos' },
      { value: '14', label: '14 anos' },
      { value: '16', label: '16 anos' },
      { value: '18', label: '18 anos (adulto)' },
    ],
  },
]

export default function ProductionsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const [resetSyncing, setResetSyncing] = useState(false)
  const [ageSyncing, setAgeSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  // Import by period state
  const [importPanelOpen, setImportPanelOpen] = useState(false)
  const [importType, setImportType] = useState<'tv' | 'movie'>('tv')
  const [importYear, setImportYear] = useState(String(new Date().getFullYear()))
  const [importMonth, setImportMonth] = useState('0')
  const [importSortBy, setImportSortBy] = useState('popularity.desc')
  const [importPage, setImportPage] = useState(1)
  const [importSearching, setImportSearching] = useState(false)
  const [importPreview, setImportPreview] = useState<PreviewResult | null>(null)
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  const handleSyncCast = async (production: Production) => {
    if (syncingId) return
    setSyncingId(production.id)
    setSyncMsg('')
    try {
      const res = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionId: production.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg(`✅ ${production.titlePt}: ${data.synced} artistas importados`)
        refetchTable()
      } else {
        setSyncMsg(`❌ Erro: ${data.error ?? 'falha ao importar elenco'}`)
      }
    } catch {
      setSyncMsg('❌ Erro de rede')
    } finally {
      setSyncingId(null)
      setTimeout(() => setSyncMsg(''), 6000)
    }
  }

  const handleSyncPending = async () => {
    if (batchSyncing) return
    setBatchSyncing(true)
    setSyncMsg('Sincronizando elenco pendente...')
    try {
      const res = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, limit: 20 }),
      })
      const data = await res.json()
      if (res.ok) {
        setSyncMsg(`✅ ${data.processed} produções processadas · ${data.totalSynced} artistas importados`)
        refetchTable()
      } else {
        setSyncMsg(`❌ Erro: ${data.error ?? 'falha ao sincronizar'}`)
      }
    } catch {
      setSyncMsg('❌ Erro de rede')
    } finally {
      setBatchSyncing(false)
      setTimeout(() => setSyncMsg(''), 8000)
    }
  }

  const handleResetResync = async () => {
    if (resetSyncing || !confirm('Isso vai resetar e resincronizar o elenco de TODAS as produções automaticamente. Pode levar vários minutos. Continuar?')) return
    setResetSyncing(true)
    setSyncMsg('Resetando elenco de todas as produções...')
    try {
      const resetRes = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      const resetData = await resetRes.json()
      if (!resetRes.ok) {
        setSyncMsg(`❌ Erro ao resetar: ${resetData.error ?? 'falha'}`)
        return
      }

      const total = resetData.total as number
      let processed = 0
      let totalSynced = 0

      let hasMore = true
      while (hasMore) {
        setSyncMsg(`🔄 Resincronizando elenco... ${processed}/${total} produções processadas`)
        const batchRes = await fetch('/api/admin/productions/sync-cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pending: true, limit: 20 }),
        })
        const batchData = await batchRes.json()
        if (!batchRes.ok || batchData.processed === 0) {
          hasMore = false
        } else {
          processed += batchData.processed as number
          totalSynced += batchData.totalSynced as number
        }
      }

      setSyncMsg(`✅ Resync completo: ${processed}/${total} produções · ${totalSynced} artistas atualizados`)
      refetchTable()
    } catch {
      setSyncMsg('❌ Erro de rede durante o resync')
    } finally {
      setResetSyncing(false)
      setTimeout(() => setSyncMsg(''), 15000)
    }
  }

  const handleSyncAgeRating = async () => {
    if (ageSyncing) return
    setAgeSyncing(true)
    setSyncMsg('Buscando classificações no TMDB...')
    try {
      const res = await fetch('/api/admin/productions/sync-age-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, limit: 50 }),
      })
      const data = await res.json()
      if (res.ok) {
        const remainingMsg = data.remaining > 0
          ? ` · ${data.remaining} ainda sem classificação (serão retentadas em 7 dias)`
          : ' · Todas classificadas!'
        setSyncMsg(`✅ ${data.updated} classificadas · ${data.notFound} sem dados no TMDB (${data.processed} processadas)${remainingMsg}`)
        refetchTable()
      } else {
        setSyncMsg(`❌ Erro: ${data.error ?? 'falha ao classificar'}`)
      }
    } catch {
      setSyncMsg('❌ Erro de rede')
    } finally {
      setAgeSyncing(false)
      setTimeout(() => setSyncMsg(''), 15000)
    }
  }

  // --- Import by Period ---

  const handleImportSearch = async (page = 1) => {
    setImportSearching(true)
    setImportMsg('')
    setImportPage(page)
    try {
      const params = new URLSearchParams({
        type: importType,
        year: importYear,
        sortBy: importSortBy,
        page: String(page),
      })
      if (importMonth !== '0') params.set('month', importMonth)

      const res = await fetch(`/api/admin/productions/import-by-period?${params}`)
      const data: PreviewResult = await res.json()
      if (!res.ok) {
        setImportMsg(`❌ Erro: ${(data as { error?: string }).error ?? 'falha na busca'}`)
        return
      }
      setImportPreview(data)
      // Auto-select all new items
      const newIds = new Set(data.results.filter((r) => !r.exists).map((r) => r.tmdbId))
      setImportSelected(newIds)
    } catch {
      setImportMsg('❌ Erro de rede')
    } finally {
      setImportSearching(false)
    }
  }

  const toggleSelect = (tmdbId: number) => {
    setImportSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tmdbId)) next.delete(tmdbId)
      else next.add(tmdbId)
      return next
    })
  }

  const selectAllNew = () => {
    if (!importPreview) return
    const newIds = importPreview.results.filter((r) => !r.exists).map((r) => r.tmdbId)
    setImportSelected(new Set(newIds))
  }

  const handleImport = async () => {
    if (importing || importSelected.size === 0 || !importPreview) return
    setImporting(true)
    setImportMsg('Importando produções...')
    try {
      const items = importPreview.results
        .filter((r) => importSelected.has(r.tmdbId))
        .map((r) => ({ tmdbId: r.tmdbId, type: r.tmdbType }))

      const res = await fetch('/api/admin/productions/import-by-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportMsg(`✅ ${data.created} importadas · ${data.skipped} já existiam · ${data.errors} erros`)
        refetchTable()
        // Refresh preview to update exists flags
        await handleImportSearch(importPage)
      } else {
        setImportMsg(`❌ Erro: ${data.error ?? 'falha na importação'}`)
      }
    } catch {
      setImportMsg('❌ Erro de rede')
    } finally {
      setImporting(false)
    }
  }

  const handleCreate = () => {
    setEditingProduction(null)
    setFormOpen(true)
  }

  const handleEdit = (production: Production) => {
    setEditingProduction(production)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (data.year && typeof data.year === 'string') {
      data.year = parseInt(data.year)
    }

    const url = editingProduction ? `/api/admin/productions?id=${editingProduction.id}` : '/api/admin/productions'
    const method = editingProduction ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar produção')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/productions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar produções')
    }

    refetchTable()
  }

  const newCount = importSelected.size

  return (
    <AdminLayout title="Produções">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-zinc-400">Gerencie dramas, filmes e outras produções da plataforma</p>
          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={handleSyncAgeRating}
              disabled={ageSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck size={16} className={ageSyncing ? 'animate-pulse' : ''} />
              {ageSyncing ? 'Classificando...' : 'Classificar Pendentes'}
            </button>
            <button
              onClick={handleSyncPending}
              disabled={batchSyncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className={batchSyncing ? 'animate-spin' : ''} />
              {batchSyncing ? 'Importando...' : 'Importar Elenco Pendente'}
            </button>
            <button
              onClick={handleResetResync}
              disabled={resetSyncing}
              title="Reseta e reprocessa automaticamente o elenco de TODAS as produções em lotes de 20"
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/40 text-amber-400 font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} className={resetSyncing ? 'animate-spin' : ''} />
              {resetSyncing ? 'Resincronizando...' : 'Resync Completo'}
            </button>
            <button
              onClick={() => { setImportPanelOpen((v) => !v); setImportMsg('') }}
              className={`flex items-center gap-2 px-4 py-2.5 border font-bold rounded-lg transition-all ${
                importPanelOpen
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <CalendarSearch size={16} />
              Importar por Período
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Plus size={18} />
              Nova Produção
            </button>
          </div>
        </div>

        {syncMsg && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
            syncMsg.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {syncMsg}
          </div>
        )}

        {/* Import by Period Panel */}
        {importPanelOpen && (
          <div className="rounded-xl border border-cyan-500/20 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Importar por Período</h3>
              <button onClick={() => setImportPanelOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Tipo</label>
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as 'tv' | 'movie')}
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium"
                >
                  <option value="tv">K-Drama / Série</option>
                  <option value="movie">Filme</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Ano</label>
                <input
                  type="number"
                  value={importYear}
                  onChange={(e) => setImportYear(e.target.value)}
                  min="1990"
                  max="2030"
                  className="w-24 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Mês</label>
                <select
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Ordenar por</label>
                <select
                  value={importSortBy}
                  onChange={(e) => setImportSortBy(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-medium"
                >
                  <option value="popularity.desc">Popularidade</option>
                  <option value="vote_average.desc">Melhor avaliados</option>
                  <option value="first_air_date.desc">Mais recentes</option>
                  <option value="first_air_date.asc">Mais antigos</option>
                </select>
              </div>
              <button
                onClick={() => handleImportSearch(1)}
                disabled={importSearching}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {importSearching ? 'Buscando...' : 'Buscar no TMDB'}
              </button>
            </div>

            {importMsg && (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                importMsg.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}>
                {importMsg}
              </div>
            )}

            {/* Results */}
            {importPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{importPreview.total} resultados · página {importPreview.page}/{importPreview.totalPages}</span>
                  <button onClick={selectAllNew} className="text-cyan-400 hover:text-cyan-300 font-bold">
                    Selecionar todos novos
                  </button>
                </div>

                <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden max-h-[460px] overflow-y-auto">
                  {importPreview.results.map((item) => (
                    <label
                      key={item.tmdbId}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        item.exists
                          ? 'bg-zinc-900/40 opacity-60'
                          : importSelected.has(item.tmdbId)
                          ? 'bg-cyan-500/5 hover:bg-cyan-500/10'
                          : 'bg-zinc-900/20 hover:bg-zinc-800/40'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={importSelected.has(item.tmdbId)}
                        onChange={() => !item.exists && toggleSelect(item.tmdbId)}
                        disabled={item.exists}
                        className="accent-cyan-500 w-4 h-4 flex-shrink-0"
                      />
                      {item.posterUrl ? (
                        <Image
                          src={item.posterUrl}
                          alt={item.name}
                          width={32}
                          height={48}
                          className="rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-12 rounded bg-zinc-800 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                        {item.originalName && (
                          <p className="text-xs text-zinc-500 truncate">{item.originalName}</p>
                        )}
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {item.date ? item.date.slice(0, 7) : '—'}
                          {item.voteAverage > 0 && ` · ★ ${item.voteAverage.toFixed(1)}`}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full border ${
                        item.exists
                          ? 'bg-green-500/10 border-green-500/30 text-green-400'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      }`}>
                        {item.exists ? '✓ Existe' : '+ Novo'}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleImportSearch(importPage - 1)}
                      disabled={importPage <= 1 || importSearching}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-zinc-500">
                      {importPage} / {importPreview.totalPages}
                    </span>
                    <button
                      onClick={() => handleImportSearch(importPage + 1)}
                      disabled={importPage >= importPreview.totalPages || importSearching}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-400"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">
                      {newCount} selecionada{newCount !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={handleImport}
                      disabled={importing || newCount === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {importing ? 'Importando...' : `Importar ${newCount > 0 ? newCount : ''} Produção${newCount !== 1 ? 'ões' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DataTable<Production>
          columns={columns}
          apiUrl="/api/admin/productions"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título..."
          actions={(production) => (
            <button
              onClick={() => handleSyncCast(production)}
              disabled={syncingId === production.id}
              title="Importar elenco do TMDB"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users size={13} className={syncingId === production.id ? 'animate-pulse' : ''} />
              {syncingId === production.id ? '...' : 'Elenco'}
            </button>
          )}
        />
      </div>

      <FormModal
        title={editingProduction ? 'Editar Produção' : 'Nova Produção'}
        fields={formFields}
        initialData={editingProduction ? (editingProduction as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="produção"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
