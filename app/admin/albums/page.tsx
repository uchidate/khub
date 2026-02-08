'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus } from 'lucide-react'

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
        <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">
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
        : <span className="text-zinc-500">N/A</span>,
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
    const fetchArtists = async () => {
      try {
        const response = await fetch('/api/admin/artists?limit=1000')
        if (!response.ok) throw new Error('Failed to fetch artists')
        const data = await response.json()
        setArtists(data.data)
      } catch (error) {
        console.error('Fetch artists error:', error)
      }
    }
    fetchArtists()
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
    const url = editingAlbum ? `/api/admin/albums?id=${editingAlbum.id}` : '/api/admin/albums'
    const method = editingAlbum ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar álbum')
    }

    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar álbuns')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Álbuns">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-zinc-400">Gerencie os álbuns, EPs e singles da plataforma</p>
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

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="álbum"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
