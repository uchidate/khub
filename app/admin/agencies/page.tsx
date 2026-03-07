'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, Users, Loader2, ExternalLink, User, X } from 'lucide-react'

interface Agency {
  id: string
  name: string
  website: string | null
  artistsCount: number
  createdAt: string
}

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  primaryImageUrl: string | null
  roles: string[]
}

// ─── Artists Panel ────────────────────────────────────────────────────────────

function ArtistsPanel({ agencyId, agencyName, onClose }: {
  agencyId: string
  agencyName: string
  onClose: () => void
}) {
  const [artists, setArtists] = useState<Artist[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/agencies?artists=${agencyId}`)
      if (res.ok) {
        const data = await res.json()
        setArtists(data.artists)
      }
    } finally {
      setLoading(false)
    }
  }, [agencyId])

  // Load on mount
  if (artists === null && loading) {
    load()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-white">Artistas de {agencyName}</span>
          {artists && (
            <span className="text-xs text-zinc-500 font-medium">
              ({artists.length} artista{artists.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : !artists || artists.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-600">
            Nenhum artista vinculado a esta agência
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {artists.map(artist => (
              <a
                key={artist.id}
                href={`/artists/${artist.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all group"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-700">
                  {artist.primaryImageUrl ? (
                    <Image
                      src={artist.primaryImageUrl}
                      alt={artist.nameRomanized}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-300 truncate group-hover:text-white transition-colors">
                    {artist.nameRomanized}
                  </p>
                  {artist.nameHangul && (
                    <p className="text-[10px] text-zinc-600 truncate">{artist.nameHangul}</p>
                  )}
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 flex-shrink-0 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'name', label: 'Nome da Agência', type: 'text', placeholder: 'Ex: HYBE Labels', required: true },
  { key: 'website', label: 'Website', type: 'text', placeholder: 'https://www.exemplo.com' },
]

export default function AgenciesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expanded, setExpanded] = useState<{ id: string; name: string } | null>(null)

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
    setExpanded(null)
  }

  const columns: Column<Agency>[] = [
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: 'website',
      label: 'Website',
      render: (agency) =>
        agency.website ? (
          <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate max-w-[180px] block">
            {agency.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-zinc-600 text-xs">—</span>
        ),
    },
    {
      key: 'artistsCount',
      label: 'Artistas',
      sortable: true,
      render: (agency) => (
        <span className="text-zinc-400 font-mono text-sm">{agency.artistsCount}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      sortable: true,
      render: (agency) => (
        <span className="text-xs text-zinc-500">{new Date(agency.createdAt).toLocaleDateString('pt-BR')}</span>
      ),
    },
  ]

  return (
    <AdminLayout title="Agências">
      <div className="space-y-4">
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
          actions={(agency) => (
            <button
              onClick={() => setExpanded(prev => prev?.id === agency.id ? null : { id: agency.id, name: agency.name })}
              title="Ver artistas"
              className={`p-1.5 rounded-lg transition-colors ${
                expanded?.id === agency.id
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'hover:bg-zinc-700 text-zinc-500 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          )}
        />

        {/* Artists panel — shown below table when an agency is expanded */}
        {expanded && (
          <ArtistsPanel
            key={expanded.id}
            agencyId={expanded.id}
            agencyName={expanded.name}
            onClose={() => setExpanded(null)}
          />
        )}
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
