'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus } from 'lucide-react'

interface Agency {
  id: string
  name: string
  website: string | null
  artistsCount: number
  createdAt: string
}

const columns: Column<Agency>[] = [
  { key: 'name', label: 'Nome', sortable: true },
  {
    key: 'website',
    label: 'Website',
    render: (agency) =>
      agency.website ? (
        <a
          href={agency.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {agency.website}
        </a>
      ) : (
        <span className="text-zinc-500">N/A</span>
      ),
  },
  {
    key: 'artistsCount',
    label: 'Artistas',
    sortable: true,
    render: (agency) => <span className="text-zinc-400">{agency.artistsCount}</span>,
  },
  {
    key: 'createdAt',
    label: 'Data de Cadastro',
    sortable: true,
    render: (agency) => new Date(agency.createdAt).toLocaleDateString('pt-BR'),
  },
]

const formFields: FormField[] = [
  { key: 'name', label: 'Nome da Agência', type: 'text', placeholder: 'Ex: HYBE Labels', required: true },
  { key: 'website', label: 'Website', type: 'text', placeholder: 'https://www.exemplo.com' },
]

export default function AgenciesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleCreate = () => {
    setEditingAgency(null)
    setFormOpen(true)
  }

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const url = editingAgency ? `/api/admin/agencies?id=${editingAgency.id}` : '/api/admin/agencies'
    const method = editingAgency ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar agência')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/agencies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar agências')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Agências">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie as agências de entretenimento da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Nova Agência
          </button>
        </div>

        <DataTable<Agency>
          columns={columns}
          apiUrl="/api/admin/agencies"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome..."
        />
      </div>

      <FormModal
        title={editingAgency ? 'Editar Agência' : 'Nova Agência'}
        fields={formFields}
        initialData={editingAgency ? (editingAgency as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="agência"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
