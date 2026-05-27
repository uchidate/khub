'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { ArrowRight, Library, Plus } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'

interface Album {
  id: string
  title: string
  type: string
  releaseDate: string | null
  coverUrl: string | null
  artistId: string
  artistName: string
  createdAt: string
}

interface Artist {
  id: string
  nameRomanized: string
}

const columns: Column<Album>[] = [
  {
    key: 'coverUrl',
    label: 'Capa',
    render: (album) =>
      album.coverUrl ? (
        <img
          src={album.coverUrl}
          alt={album.title}
          className="w-12 h-12 rounded object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded bg-surface flex items-center justify-center text-muted text-xs">
          N/A
        </div>
      ),
  },
  { key: 'title', label: 'Título', sortable: true },
  {
    key: 'type',
    label: 'Tipo',
    render: (album) => (
      <span className="px-2 py-1 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
        {album.type}
      </span>
    ),
  },
  { key: 'artistName', label: 'Artista', sortable: true },
  {
    key: 'releaseDate',
    label: 'Lançamento',
    sortable: true,
    render: (album) =>
      album.releaseDate
        ? new Date(album.releaseDate).toLocaleDateString('pt-BR')
        : <span className="text-muted">N/A</span>,
  },
]

export default function AlbumsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const formFields: FormField[] = [
    { key: 'title', label: 'Título do Álbum', type: 'text', placeholder: 'Ex: The Album', required: true },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { value: 'ALBUM', label: 'Álbum' },
        { value: 'EP', label: 'EP' },
        { value: 'SINGLE', label: 'Single' },
      ],
    },
    {
      key: 'artistId',
      label: 'Artista',
      type: 'select',
      required: true,
      options: artists.map((artist) => ({
        value: artist.id,
        label: artist.nameRomanized,
      })),
    },
    { key: 'releaseDate', label: 'Data de Lançamento', type: 'date' },
    { key: 'coverUrl', label: 'URL da Capa', type: 'text', placeholder: 'https://exemplo.com/capa.jpg' },
    { key: 'spotifyUrl', label: 'Spotify URL', type: 'text', placeholder: 'https://open.spotify.com/album/...' },
    { key: 'appleMusicUrl', label: 'Apple Music URL', type: 'text', placeholder: 'https://music.apple.com/album/...' },
    { key: 'youtubeUrl', label: 'YouTube URL', type: 'text', placeholder: 'https://youtube.com/playlist?list=...' },
  ]

  useEffect(() => {
    adminApi.artists.list({ limit: 1000 })
      .then(data => setArtists((data as unknown as { data: Artist[] }).data))
      .catch(() => {})
  }, [])

  const handleCreate = () => {
    setEditingAlbum(null)
    setFormOpen(true)
  }

  const handleEdit = (album: Album) => {
    setEditingAlbum(album)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (editingAlbum) {
      await adminApi.albums.update(editingAlbum.id, data)
    } else {
      await adminApi.albums.create(data)
    }
    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    await adminApi.albums.delete(selectedIds)
    refetchTable()
  }

  return (
    <AdminLayout
      title="Álbuns"
      subtitle="Discografia operacional do catálogo. Use esta área para manter lançamentos, capas e links musicais vinculados aos artistas."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/artists"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <Library className="w-4 h-4" />
            Ver artistas
          </Link>
          <Link
            href="/admin/productions"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-medium text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Ver produções
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted mb-2">Onde isso fica no admin</p>
          <p className="text-sm text-muted leading-relaxed">
            Álbuns não ficam mais agrupados como configuração de sistema. Esta é uma área de catálogo, voltada para manutenção de discografia e vínculos editoriais.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted">Gerencie os álbuns, EPs e singles da plataforma</p>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <Plus size={18} />
            Novo Álbum
          </button>
        </div>

        <DataTable<Album>
          columns={columns}
          apiUrl="/api/admin/albums"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título..."
        />
      </div>

      <FormModal
        title={editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}
        fields={formFields}
        initialData={editingAlbum ? (editingAlbum as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Excluir ${selectedIds.length} álbum${selectedIds.length !== 1 ? 'ns' : ''}`}
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={async () => { await handleDeleteConfirm(); setDeleteOpen(false) }}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminLayout>
  )
}
