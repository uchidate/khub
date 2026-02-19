'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus } from 'lucide-react'
import Image from 'next/image'

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  stageName: string | null
  country: string | null
  primaryImageUrl: string | null
  gender: string | null
  createdAt: Date
  productionsCount: number
  albumsCount: number
  agencyName: string | null
  musicalGroupName: string | null
  musicalGroupId: string | null
}

const columns: Column<Artist>[] = [
  {
    key: 'imageUrl',
    label: 'Foto',
    render: (artist) =>
      artist.primaryImageUrl ? (
        <Image
          src={artist.primaryImageUrl}
          alt={artist.nameRomanized}
          width={40}
          height={40}
          className="rounded-lg object-cover"
        />
      ) : (
        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">
          N/A
        </div>
      ),
  },
  { key: 'nameRomanized', label: 'Nome', sortable: true },
  {
    key: 'nameHangul',
    label: 'Nome Original',
    render: (artist) => <span className="text-zinc-400">{artist.nameHangul || '-'}</span>,
  },
  {
    key: 'agencyName',
    label: 'Agência',
    render: (artist) => <span className="text-zinc-400">{artist.agencyName || '-'}</span>,
  },
  {
    key: 'musicalGroupName',
    label: 'Grupo',
    render: (artist) =>
      artist.musicalGroupName ? (
        <span className="text-electric-cyan text-xs font-medium px-2 py-0.5 bg-electric-cyan/10 rounded-full">
          {artist.musicalGroupName}
        </span>
      ) : (
        <span className="text-zinc-600">-</span>
      ),
  },
  {
    key: 'productionsCount',
    label: 'Produções',
    sortable: true,
    render: (artist) => <span className="text-purple-400">{artist.productionsCount}</span>,
  },
  {
    key: 'albumsCount',
    label: 'Álbuns',
    sortable: true,
    render: (artist) => <span className="text-pink-400">{artist.albumsCount}</span>,
  },
  {
    key: 'createdAt',
    label: 'Cadastro',
    sortable: true,
    render: (artist) => new Date(artist.createdAt).toLocaleDateString('pt-BR'),
  },
]

const formFields: FormField[] = [
  { key: 'nameRomanized', label: 'Nome (Romanizado)', type: 'text', placeholder: 'Ex: Kim Soo-hyun', required: true },
  { key: 'nameHangul', label: 'Nome em Hangul', type: 'text', placeholder: 'Ex: 김수현' },
  { key: 'stageNames', label: 'Nomes Artísticos', type: 'text', placeholder: 'Ex: Suzy, Bae (separados por vírgula)' },
  { key: 'bio', label: 'Biografia', type: 'textarea', placeholder: 'Biografia do artista...' },
  { key: 'birthDate', label: 'Data de Nascimento', type: 'date' },
  {
    key: 'gender',
    label: 'Gênero',
    type: 'select',
    options: [
      { value: 'male', label: 'Masculino' },
      { value: 'female', label: 'Feminino' },
      { value: 'non_binary', label: 'Não-binário' },
      { value: 'other', label: 'Outro' },
    ],
  },
  {
    key: 'musicalGroupId',
    label: 'Grupo Musical',
    type: 'select-async',
    optionsUrl: '/api/admin/groups/all',
    placeholder: 'Selecionar grupo...',
  },
  { key: 'primaryImageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://...' },
  { key: 'tmdbId', label: 'TMDB ID', type: 'text', placeholder: 'ID do The Movie Database' },
]

export default function ArtistsAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleCreate = () => {
    setEditingArtist(null)
    setFormOpen(true)
  }

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const url = editingArtist ? `/api/admin/artists?id=${editingArtist.id}` : '/api/admin/artists'
    const method = editingArtist ? 'PATCH' : 'POST'

    // Converter stageNames de string CSV para array
    if (typeof data.stageNames === 'string') {
      data.stageNames = data.stageNames
        ? data.stageNames.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
    }
    // URL vazia → null para limpar foto
    if (data.primaryImageUrl === '') {
      data.primaryImageUrl = null
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar artista')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/artists', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar artistas')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Artistas">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie artistas de K-Drama e K-Pop</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Novo Artista
          </button>
        </div>

        <DataTable<Artist>
          columns={columns}
          apiUrl="/api/admin/artists"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome..."
        />
      </div>

      <FormModal
        title={editingArtist ? 'Editar Artista' : 'Novo Artista'}
        fields={formFields}
        initialData={editingArtist ? {
          ...(editingArtist as unknown as Record<string, unknown>),
          stageNames: Array.isArray((editingArtist as any).stageNames)
            ? (editingArtist as any).stageNames.join(', ')
            : '',
          musicalGroupId: (editingArtist as any).musicalGroupId ?? '',
        } : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="artista"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
