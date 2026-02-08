'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  emailVerified: Date | null
  createdAt: Date
  favoritesCount: number
}

const columns: Column<User>[] = [
  { key: 'name', label: 'Nome', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'role',
    label: 'Função',
    sortable: true,
    render: (user) => (
      <span
        className={`px-2 py-1 rounded text-xs font-bold ${
          user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700 text-zinc-300'
        }`}
      >
        {user.role === 'admin' ? 'Admin' : 'Usuário'}
      </span>
    ),
  },
  {
    key: 'emailVerified',
    label: 'Verificado',
    render: (user) => (
      <span className={user.emailVerified ? 'text-green-400' : 'text-zinc-500'}>
        {user.emailVerified ? 'Sim' : 'Não'}
      </span>
    ),
  },
  {
    key: 'favoritesCount',
    label: 'Favoritos',
    sortable: true,
    render: (user) => <span className="text-zinc-400">{user.favoritesCount}</span>,
  },
  {
    key: 'createdAt',
    label: 'Data de Cadastro',
    sortable: true,
    render: (user) => new Date(user.createdAt).toLocaleDateString('pt-BR'),
  },
]

const formFields: FormField[] = [
  { key: 'name', label: 'Nome', type: 'text', placeholder: 'Nome completo', required: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'email@exemplo.com', required: true },
  {
    key: 'role',
    label: 'Função',
    type: 'select',
    required: true,
    options: [
      { value: 'user', label: 'Usuário' },
      { value: 'admin', label: 'Admin' },
    ],
  },
]

export default function UsersAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleCreate = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const url = editingUser ? `/api/admin/users?id=${editingUser.id}` : '/api/admin/users'
    const method = editingUser ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar usuário')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar usuários')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie os usuários da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        </div>

        <DataTable<User>
          columns={columns}
          apiUrl="/api/admin/users"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome ou email..."
        />
      </div>

      <FormModal
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        fields={formFields}
        initialData={editingUser ? (editingUser as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="usuário"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
