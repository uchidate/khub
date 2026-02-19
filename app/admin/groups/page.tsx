'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { GroupMembersModal } from '@/components/admin/GroupMembersModal'
import { Plus, Users } from 'lucide-react'
import Image from 'next/image'

interface MusicalGroup {
  id: string
  name: string
  nameHangul: string | null
  mbid: string | null
  profileImageUrl: string | null
  debutDate: Date | null
  disbandDate: Date | null
  agencyId: string | null
  agencyName: string | null
  socialLinks: Record<string, string> | null
  membersCount: number
  createdAt: Date
}

const SOCIAL_PLATFORMS = ['website', 'instagram', 'youtube', 'twitter', 'tiktok', 'spotify', 'weverse', 'vlive'] as const

const columns: Column<MusicalGroup>[] = [
  {
    key: 'profileImageUrl',
    label: 'Foto',
    render: (group) =>
      group.profileImageUrl ? (
        <Image
          src={group.profileImageUrl}
          alt={group.name}
          width={40}
          height={40}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold">
          {group.name.charAt(0).toUpperCase()}
        </div>
      ),
  },
  { key: 'name', label: 'Nome', sortable: true },
  {
    key: 'nameHangul',
    label: 'Nome Hangul',
    render: (group) =>
      group.nameHangul ? (
        <span className="text-zinc-400">{group.nameHangul}</span>
      ) : (
        <span className="text-zinc-600">-</span>
      ),
  },
  {
    key: 'debutDate',
    label: 'Debut',
    sortable: true,
    render: (group) =>
      group.debutDate ? (
        <span>{new Date(group.debutDate).getFullYear()}</span>
      ) : (
        <span className="text-zinc-600">-</span>
      ),
  },
  {
    key: 'disbandDate',
    label: 'Status',
    render: (group) =>
      group.disbandDate ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/40 text-red-400 border border-red-800/50">
          Disbandado
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/40 text-green-400 border border-green-800/50">
          Ativo
        </span>
      ),
  },
  {
    key: 'membersCount',
    label: 'Membros',
    sortable: true,
    render: (group) => <span className="text-purple-400 font-medium">{group.membersCount}</span>,
  },
  {
    key: 'agencyName',
    label: 'Agência',
    render: (group) =>
      group.agencyName ? (
        <span className="text-zinc-300">{group.agencyName}</span>
      ) : (
        <span className="text-zinc-600">-</span>
      ),
  },
  {
    key: 'createdAt',
    label: 'Data de Cadastro',
    sortable: true,
    render: (group) => new Date(group.createdAt).toLocaleDateString('pt-BR'),
  },
]

const formFields: FormField[] = [
  { key: 'name', label: 'Nome do Grupo', type: 'text', placeholder: 'Ex: BTS', required: true },
  { key: 'nameHangul', label: 'Nome em Hangul', type: 'text', placeholder: 'Ex: 방탄소년단' },
  { key: 'mbid', label: 'MusicBrainz ID', type: 'text', placeholder: 'UUID do MusicBrainz' },
  { key: 'bio', label: 'Biografia', type: 'textarea', placeholder: 'Descrição do grupo...' },
  { key: 'profileImageUrl', label: 'URL da Foto', type: 'text', placeholder: 'https://...' },
  { key: 'debutDate', label: 'Data de Debut', type: 'date' },
  { key: 'disbandDate', label: 'Data de Disbandamento', type: 'date' },
  { key: 'agencyId', label: 'Agência', type: 'select-async', optionsUrl: '/api/admin/agencies/all' },
  // Redes sociais — armazenadas como JSON socialLinks
  { key: 'sl_website', label: '🌐 Site Oficial', type: 'text', placeholder: 'https://bts.weverse.io' },
  { key: 'sl_instagram', label: '📸 Instagram', type: 'text', placeholder: 'https://instagram.com/bts.bighitofficial' },
  { key: 'sl_youtube', label: '▶️ YouTube', type: 'text', placeholder: 'https://youtube.com/@BANGTANTV' },
  { key: 'sl_twitter', label: '🐦 Twitter / X', type: 'text', placeholder: 'https://twitter.com/BTS_twt' },
  { key: 'sl_tiktok', label: '🎵 TikTok', type: 'text', placeholder: 'https://tiktok.com/@bts_official_bighit' },
  { key: 'sl_spotify', label: '🎧 Spotify', type: 'text', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'sl_weverse', label: '💬 Weverse', type: 'text', placeholder: 'https://weverse.io/bts' },
  { key: 'sl_vlive', label: '📺 VLive', type: 'text', placeholder: 'https://channels.vlive.tv/...' },
]

export default function GroupsPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<MusicalGroup | null>(null)
  const [managingGroup, setManagingGroup] = useState<MusicalGroup | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleCreate = () => {
    setEditingGroup(null)
    setFormOpen(true)
  }

  const handleEdit = (group: MusicalGroup) => {
    const socialFlat: Record<string, string> = {}
    if (group.socialLinks) {
      for (const platform of SOCIAL_PLATFORMS) {
        socialFlat[`sl_${platform}`] = group.socialLinks[platform] ?? ''
      }
    }
    setEditingGroup({ ...group, ...socialFlat } as unknown as MusicalGroup)
    setFormOpen(true)
  }

  const handleManageMembers = (group: MusicalGroup) => {
    setManagingGroup(group)
    setMembersOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const url = editingGroup ? `/api/admin/groups?id=${editingGroup.id}` : '/api/admin/groups'
    const method = editingGroup ? 'PATCH' : 'POST'

    // Assemble sl_* flat fields into socialLinks JSON
    const socialLinks: Record<string, string> = {}
    for (const platform of SOCIAL_PLATFORMS) {
      const val = data[`sl_${platform}`] as string | undefined
      if (val && val.trim()) socialLinks[platform] = val.trim()
      delete data[`sl_${platform}`]
    }
    const payload = {
      ...data,
      socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar grupo musical')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/groups', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar grupos musicais')
    }

    refetchTable()
  }

  const getInitialData = () => {
    if (!editingGroup) return undefined
    return {
      ...editingGroup,
      debutDate: editingGroup.debutDate
        ? new Date(editingGroup.debutDate).toISOString().split('T')[0]
        : '',
      disbandDate: editingGroup.disbandDate
        ? new Date(editingGroup.disbandDate).toISOString().split('T')[0]
        : '',
    } as unknown as Record<string, unknown>
  }

  return (
    <AdminLayout title="Grupos Musicais">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie os grupos musicais da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Novo Grupo
          </button>
        </div>

        <DataTable<MusicalGroup>
          columns={columns}
          apiUrl="/api/admin/groups"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome ou nome em hangul..."
          actions={(group) => (
            <button
              onClick={() => handleManageMembers(group)}
              title="Gerenciar Membros"
              className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              <Users size={16} />
            </button>
          )}
        />
      </div>

      <FormModal
        title={editingGroup ? 'Editar Grupo Musical' : 'Novo Grupo Musical'}
        fields={formFields}
        initialData={getInitialData()}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="grupo musical"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {managingGroup && (
        <GroupMembersModal
          groupId={managingGroup.id}
          groupName={managingGroup.name}
          open={membersOpen}
          onClose={() => { setMembersOpen(false); setManagingGroup(null) }}
        />
      )}
    </AdminLayout>
  )
}
