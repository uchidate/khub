'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { AdminButton, AdminIconButton } from '@/components/admin'
import { Plus, Users, Loader2, ExternalLink, User, X, CheckCircle2 } from 'lucide-react'
import { adminApi, ApiError } from '@/lib/admin-api'

interface Agency {
  id: string
  name: string
  type: string
  isVerified: boolean
  foundedYear: number | null
  country: string
  ceoName: string | null
  description: string | null
  website: string | null
  accentColor: string | null
  logoUrl: string | null
  parentId: string | null
  parent: { id: string; name: string } | null
  artistsCount: number
  _count: { artists: number; musicalGroups: number; subsidiaries: number }
  createdAt: string
}

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  primaryImageUrl: string | null
  roles: string[]
}

const TYPE_LABEL: Record<string, string> = {
  MAJOR: 'Grande',
  INDIE: 'Independente',
  SUBSIDIARY: 'Sub-label',
}

const TYPE_STYLE: Record<string, string> = {
  MAJOR: 'bg-amber-400/10 text-amber-500 border-amber-400/30',
  INDIE: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  SUBSIDIARY: 'bg-violet-400/10 text-violet-400 border-violet-400/30',
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

  if (artists === null && loading) load()

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-foreground">Artistas de {agencyName}</span>
          {artists && (
            <span className="text-xs text-muted font-medium">
              ({artists.length} artista{artists.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <AdminIconButton onClick={onClose} title="Fechar" variant="default">
          <X className="w-4 h-4" />
        </AdminIconButton>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : !artists || artists.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
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
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all group"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-surface">
                  {artist.primaryImageUrl ? (
                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="32px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-4 h-4 text-muted" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{artist.nameRomanized}</p>
                  {artist.nameHangul && <p className="text-[10px] text-muted truncate">{artist.nameHangul}</p>}
                </div>
                <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Type Filter ──────────────────────────────────────────────────────────────

function TypeFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = [
    { value: '', label: 'Todos' },
    { value: 'MAJOR', label: 'Grandes' },
    { value: 'INDIE', label: 'Independentes' },
    { value: 'SUBSIDIARY', label: 'Sub-labels' },
  ]
  return (
    <div className="flex gap-1">
      {opts.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
            value === o.value
              ? 'bg-foreground text-background border-foreground'
              : 'text-muted border-border hover:border-foreground/30 hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'name',        label: 'Nome da Agência',     type: 'text',     placeholder: 'Ex: HYBE Labels',          required: true },
  {
    key: 'type', label: 'Tipo', type: 'select',
    options: [
      { value: 'MAJOR',      label: 'Grande Agência' },
      { value: 'INDIE',      label: 'Independente' },
      { value: 'SUBSIDIARY', label: 'Sub-label' },
    ],
  },
  { key: 'isVerified',  label: 'Verificada',          type: 'toggle' },
  { key: 'description', label: 'Descrição',           type: 'textarea', placeholder: 'Breve descrição...' },
  { key: 'website',     label: 'Website',             type: 'text',     placeholder: 'https://www.exemplo.com' },
  { key: 'accentColor', label: 'Cor de destaque (hex)', type: 'text',   placeholder: '#0f172a' },
  { key: 'foundedYear', label: 'Ano de fundação',     type: 'number',   placeholder: '1989' },
  { key: 'country',     label: 'País (ISO 2)',         type: 'text',     placeholder: 'KR' },
  { key: 'ceoName',     label: 'CEO',                 type: 'text',     placeholder: 'Park Jin-young' },
  { key: 'logoUrl',     label: 'URL do Logo',         type: 'text',     placeholder: 'https://...' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgenciesPage() {
  const [formOpen,       setFormOpen]       = useState(false)
  const [deleteOpen,     setDeleteOpen]     = useState(false)
  const [editingAgency,  setEditingAgency]  = useState<Agency | null>(null)
  const [selectedIds,    setSelectedIds]    = useState<string[]>([])
  const [expanded,       setExpanded]       = useState<{ id: string; name: string } | null>(null)
  const [typeFilter,     setTypeFilter]     = useState('')

  const extraParams: Record<string, string> = {}
  if (typeFilter) extraParams.type = typeFilter

  const handleCreate = () => { setEditingAgency(null); setFormOpen(true) }
  const handleEdit   = (agency: Agency) => { setEditingAgency(agency); setFormOpen(true) }
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (data.foundedYear !== undefined && data.foundedYear !== '' && data.foundedYear !== null) {
      data.foundedYear = parseInt(String(data.foundedYear))
    } else if (data.foundedYear === '') {
      data.foundedYear = null
    }

    if (editingAgency) {
      await adminApi.agencies.update(editingAgency.id, data)
    } else {
      await adminApi.agencies.create(data)
    }
    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    await adminApi.agencies.delete(selectedIds)
    refetchTable()
    setExpanded(null)
  }

  const columns: Column<Agency>[] = [
    {
      key: 'name',
      label: 'Agência',
      sortable: true,
      render: (agency) => (
        <div className="flex items-center gap-2.5">
          {agency.accentColor ? (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-1 ring-black/10" style={{ backgroundColor: agency.accentColor }} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-border" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground truncate">{agency.name}</span>
              {agency.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            </div>
            {agency.parent && (
              <p className="text-[10px] text-muted truncate">via {agency.parent.name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (agency) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${TYPE_STYLE[agency.type] ?? 'text-muted border-border'}`}>
          {TYPE_LABEL[agency.type] ?? agency.type}
        </span>
      ),
    },
    {
      key: 'foundedYear',
      label: 'Fund.',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (agency) => <span className="text-sm text-muted tabular-nums">{agency.foundedYear ?? '—'}</span>,
    },
    {
      key: 'website',
      label: 'Website',
      className: 'hidden lg:table-cell',
      render: (agency) =>
        agency.website ? (
          <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-xs truncate max-w-[150px] block">
            {agency.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-muted text-xs">—</span>
        ),
    },
    {
      key: 'artistsCount',
      label: 'Artistas',
      sortable: true,
      render: (agency) => <span className="text-muted font-mono text-sm">{agency.artistsCount}</span>,
    },
  ]

  return (
    <AdminLayout title="Agências">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TypeFilter value={typeFilter} onChange={v => { setTypeFilter(v); setExpanded(null) }} />
          <AdminButton onClick={handleCreate} variant="primary">
            <Plus size={16} />
            Nova Agência
          </AdminButton>
        </div>

        <DataTable<Agency>
          columns={columns}
          apiUrl="/api/admin/agencies"
          extraParams={extraParams}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por nome..."
          actions={(agency) => (
            <AdminIconButton
              onClick={() => setExpanded(prev => prev?.id === agency.id ? null : { id: agency.id, name: agency.name })}
              title="Ver artistas"
              variant={expanded?.id === agency.id ? 'accent' : 'default'}
            >
              <Users className="w-3.5 h-3.5" />
            </AdminIconButton>
          )}
        />

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
