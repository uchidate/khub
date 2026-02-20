'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, Users, RefreshCw, ShieldCheck } from 'lucide-react'

const AGE_RATING_STYLES: Record<string, string> = {
  'L':  'bg-green-500/20 text-green-400 border-green-500/30',
  '10': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '12': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '14': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '16': 'bg-red-600/20 text-red-400 border-red-600/30',
  '18': 'bg-red-900/40 text-red-300 border-red-700/50',
}

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
  const [ageSyncing, setAgeSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

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
    // Convert year to number if it's a string
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

  return (
    <AdminLayout title="Produções">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-zinc-400">Gerencie dramas, filmes e outras produções da plataforma</p>
          <div className="flex items-center gap-3 flex-shrink-0">
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
