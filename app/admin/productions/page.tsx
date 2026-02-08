'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus } from 'lucide-react'

interface Production {
  id: string
  titlePt: string
  titleKr: string | null
  type: string
  year: number | null
  imageUrl: string | null
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
]

export default function ProductionsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie dramas, filmes e outras produções da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Nova Produção
          </button>
        </div>

        <DataTable<Production>
          columns={columns}
          apiUrl="/api/admin/productions"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título..."
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
