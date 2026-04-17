'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, Shield, Users, CheckCircle, UserPlus, Heart } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { FilterPills } from '@/components/admin/FilterPills'
import { AdminButton } from '@/components/admin'

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
      role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-surface text-foreground'
    }`}>
      {letters}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
      role === 'admin' ? 'bg-accent/15 text-accent' : 'bg-surface text-muted'
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

  const fetchStats = useCallback(() => {
    adminApi.users.stats().then(s => setStats(s as unknown as UserStats)).catch(() => {})
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
            <div className="font-medium text-foreground truncate">
              {user.name ?? <span className="text-muted italic">sem nome</span>}
            </div>
            <div className="text-xs text-muted truncate">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (user) => <span className="text-muted text-sm">{user.email}</span>,
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
        : <span className="text-muted text-xs">—</span>,
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
        <span className="text-muted text-xs">
          {new Date(user.createdAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ], [])

  const handleCreate = () => { setEditingUser(null); setFormOpen(true) }
  const handleEdit = (user: User) => { setEditingUser(user); setFormOpen(true) }
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingUser) {
      await adminApi.users.update(editingUser.id, data)
    } else {
      await adminApi.users.create(data)
    }
    refetchTable()
    fetchStats()
  }

  const handleDeleteConfirm = async () => {
    await adminApi.users.delete(selectedIds)
    refetchTable()
    fetchStats()
  }

  const roleFilterEl = (
    <FilterPills
      pills={[
        { value: '' as RoleFilter, label: 'Todos', count: stats?.total ?? null },
        { value: 'user' as RoleFilter, label: 'Usuários' },
        { value: 'admin' as RoleFilter, label: 'Admins', count: stats?.admins ?? null },
      ]}
      active={roleFilter}
      onChange={setRoleFilter}
    />
  )

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-muted text-sm -mt-4">Gerencie os usuários da plataforma</p>
          <AdminButton variant="primary" size="lg" onClick={handleCreate}>
            <Plus size={16} />
            Novo Usuário
          </AdminButton>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,       label: 'Total',        value: stats?.total,       color: 'bg-blue-500/10 text-blue-400' },
            { icon: Shield,      label: 'Admins',       value: stats?.admins,      color: 'bg-accent/10 text-accent' },
            { icon: CheckCircle, label: 'Verificados',  value: stats?.verified,    color: 'bg-green-500/10 text-green-400' },
            { icon: UserPlus,    label: 'Esta semana',  value: stats?.newThisWeek, color: 'bg-pink-500/10 text-pink-400' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={16} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground tabular-nums">{value ?? '—'}</div>
                <div className="text-xs text-muted">{label}</div>
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
                  <span className="font-semibold text-foreground truncate">
                    {user.name ?? <span className="text-muted italic">sem nome</span>}
                  </span>
                  <RoleBadge role={user.role} />
                </div>
                <div className="text-muted text-sm truncate mt-0.5">{user.email}</div>
                <div className="flex items-center gap-3 mt-1.5 text-xs">
                  <span className={user.emailVerified ? 'text-green-400' : 'text-muted'}>
                    {user.emailVerified ? '✓ verificado' : 'não verificado'}
                  </span>
                  <span className="text-pink-400/80 flex items-center gap-0.5">
                    <Heart size={10} /> {user.favoritesCount}
                  </span>
                  <span className="text-muted">
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
