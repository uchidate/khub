'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, Shield, Users, CheckCircle, UserPlus, Heart } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string
  name: string | null
  email: string
  role: string
  emailVerified: Date | null
  createdAt: Date
  favoritesCount: number
}

interface UserStats {
  total: number
  admins: number
  verified: number
  newThisWeek: number
}

type RoleFilter = '' | 'user' | 'admin'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string | null; role: string }) {
  const letters = name
    ? name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
    : '?'
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
      role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-700/80 text-zinc-300'
    }`}>
      {letters}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
      role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-400'
    }`}>
      {role === 'admin' && <Shield size={10} />}
      {role === 'admin' ? 'Admin' : 'Usuário'}
    </span>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [stats, setStats] = useState<UserStats | null>(null)

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/users?stats=1')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const extraParams = useMemo(
    () => (roleFilter ? { role: roleFilter } : undefined),
    [roleFilter],
  )

  const columns: Column<User>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Usuário',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} role={user.role} />
          <div className="min-w-0">
            <div className="font-medium text-white truncate">
              {user.name ?? <span className="text-zinc-500 italic">sem nome</span>}
            </div>
            <div className="text-xs text-zinc-500 truncate">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (user) => <span className="text-zinc-400 text-sm">{user.email}</span>,
    },
    {
      key: 'role',
      label: 'Função',
      sortable: true,
      render: (user) => <RoleBadge role={user.role} />,
    },
    {
      key: 'emailVerified',
      label: 'Verificado',
      className: 'hidden lg:table-cell',
      render: (user) => user.emailVerified
        ? <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle size={12} /> Sim</span>
        : <span className="text-zinc-600 text-xs">—</span>,
    },
    {
      key: 'favoritesCount',
      label: 'Favoritos',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (user) => (
        <span className="flex items-center gap-1 text-pink-400 font-bold tabular-nums text-sm">
          <Heart size={11} />
          {user.favoritesCount}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (user) => (
        <span className="text-zinc-500 text-xs">
          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ], [])

  const handleCreate = () => { setEditingUser(null); setFormOpen(true) }
  const handleEdit = (user: User) => { setEditingUser(user); setFormOpen(true) }
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const url = editingUser ? `/api/admin/users?id=${editingUser.id}` : '/api/admin/users'
    const method = editingUser ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao salvar') }
    refetchTable()
    fetchStats()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Erro ao deletar') }
    refetchTable()
    fetchStats()
  }

  const roleFilterEl = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(['', 'user', 'admin'] as RoleFilter[]).map(role => (
        <button key={role} onClick={() => setRoleFilter(role)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
            roleFilter === role
              ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          {role === '' ? 'Todos' : role === 'admin' ? 'Admins' : 'Usuários'}
          {role === '' && stats != null && (
            <span className={`font-mono tabular-nums ${roleFilter === '' ? 'text-purple-300' : 'text-zinc-500'}`}>
              {stats.total}
            </span>
          )}
          {role === 'admin' && stats != null && (
            <span className={`font-mono tabular-nums ${roleFilter === 'admin' ? 'text-purple-300' : 'text-zinc-500'}`}>
              {stats.admins}
            </span>
          )}
        </button>
      ))}
    </div>
  )

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-zinc-400 text-sm -mt-4">Gerencie os usuários da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex-shrink-0"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,       label: 'Total',        value: stats?.total,       color: 'bg-blue-500/10 text-blue-400' },
            { icon: Shield,      label: 'Admins',       value: stats?.admins,      color: 'bg-purple-500/10 text-purple-400' },
            { icon: CheckCircle, label: 'Verificados',  value: stats?.verified,    color: 'bg-green-500/10 text-green-400' },
            { icon: UserPlus,    label: 'Esta semana',  value: stats?.newThisWeek, color: 'bg-pink-500/10 text-pink-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">{value ?? '—'}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <DataTable<User>
          columns={columns}
          apiUrl="/api/admin/users"
          extraParams={extraParams}
          filters={roleFilterEl}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome ou email..."
          renderMobileCard={(user) => (
            <div className="p-4 flex items-start gap-3">
              <Avatar name={user.name} role={user.role} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-white truncate">
                    {user.name ?? <span className="text-zinc-500 italic">sem nome</span>}
                  </span>
                  <RoleBadge role={user.role} />
                </div>
                <div className="text-zinc-400 text-sm truncate mt-0.5">{user.email}</div>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className={user.emailVerified ? 'text-green-400' : 'text-zinc-600'}>
                    {user.emailVerified ? '✓ verificado' : 'não verificado'}
                  </span>
                  <span className="text-pink-400/80 flex items-center gap-0.5">
                    <Heart size={10} /> {user.favoritesCount}
                  </span>
                  <span className="text-zinc-600">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          )}
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
