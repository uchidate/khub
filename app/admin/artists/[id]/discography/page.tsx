'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, RefreshCw, Trash2, ArrowLeft, Music, CheckCircle, Pencil, X, Check, ExternalLink } from 'lucide-react'

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  primaryImageUrl: string | null
  discographySyncAt: string | null
  tmdbId: string | null
  mbid: string | null
}

interface Album {
  id: string
  title: string
  type: string
  releaseDate: string | null
  coverUrl: string | null
  spotifyUrl: string | null
  appleMusicUrl: string | null
  youtubeUrl: string | null
  mbid: string | null
  artistId: string
  artistName: string
}

const TYPE_STYLE: Record<string, string> = {
  ALBUM: 'bg-purple-500/20 text-purple-400',
  EP: 'bg-blue-500/20 text-blue-400',
  SINGLE: 'bg-pink-500/20 text-pink-400',
}

const TYPE_LABEL: Record<string, string> = {
  ALBUM: 'Álbum',
  EP: 'EP',
  SINGLE: 'Single',
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
        <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
          <Music className="w-4 h-4 text-zinc-600" />
        </div>
      ),
  },
  { key: 'title', label: 'Título', sortable: true },
  {
    key: 'type',
    label: 'Tipo',
    sortable: true,
    render: (album) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${TYPE_STYLE[album.type] ?? 'bg-zinc-800 text-zinc-400'}`}>
        {TYPE_LABEL[album.type] ?? album.type}
      </span>
    ),
  },
  {
    key: 'releaseDate',
    label: 'Lançamento',
    sortable: true,
    render: (album) =>
      album.releaseDate ? (
        <span className="text-zinc-300 text-sm">
          {new Date(album.releaseDate).getUTCFullYear()}
        </span>
      ) : (
        <span className="text-zinc-600">—</span>
      ),
  },
  {
    key: 'spotifyUrl',
    label: 'Links',
    render: (album) => (
      <div className="flex items-center gap-1.5">
        {album.spotifyUrl && (
          <a href={album.spotifyUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"
            title="Spotify">
            SP
          </a>
        )}
        {album.appleMusicUrl && (
          <a href={album.appleMusicUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 hover:bg-pink-500/40 transition-colors"
            title="Apple Music">
            AM
          </a>
        )}
        {album.youtubeUrl && (
          <a href={album.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"
            title="YouTube">
            YT
          </a>
        )}
        {!album.spotifyUrl && !album.appleMusicUrl && !album.youtubeUrl && (
          <span className="text-zinc-600 text-xs">—</span>
        )}
      </div>
    ),
  },
  {
    key: 'mbid',
    label: 'MusicBrainz',
    render: (album) =>
      album.mbid ? (
        <a
          href={`https://musicbrainz.org/release-group/${album.mbid}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-mono text-zinc-500 hover:text-purple-400 transition-colors"
          title={album.mbid}
        >
          {album.mbid.slice(0, 8)}…
        </a>
      ) : (
        <span className="text-zinc-700 text-xs">—</span>
      ),
  },
]

export default function ArtistDiscographyPage() {
  const params = useParams()
  const artistId = params.id as string

  const [artist, setArtist] = useState<Artist | null>(null)
  const [artistLoading, setArtistLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncClearFirst, setSyncClearFirst] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Inline ID editors
  const [editingField, setEditingField] = useState<'tmdbId' | 'mbid' | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingId, setSavingId] = useState(false)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const handleSaveId = async (field: 'tmdbId' | 'mbid') => {
    setSavingId(true)
    try {
      const res = await fetch(`/api/admin/artists?id=${artistId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: editingValue.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        showToast(`❌ ${err.error ?? 'Erro ao salvar'}`, false)
      } else {
        const data = await res.json() as { clearedAlbumsCount?: number }
        const newVal = editingValue.trim() || null
        setArtist(a => a ? {
          ...a,
          [field]: newVal,
          // When mbid is cleared, reset the sync date too
          ...(field === 'mbid' && !newVal ? { discographySyncAt: null } : {}),
        } : a)
        setEditingField(null)
        if (data.clearedAlbumsCount) {
          refetchTable()
          showToast(`✅ MusicBrainz ID removido · ${data.clearedAlbumsCount} álbum(ns) limpos automaticamente`)
        } else {
          showToast('✅ ID atualizado')
        }
      }
    } catch {
      showToast('❌ Erro de rede', false)
    } finally {
      setSavingId(false)
    }
  }

  // Fetch artist info
  useEffect(() => {
    setArtistLoading(true)
    fetch(`/api/admin/artists?id=${artistId}`)
      .then(r => r.json())
      .then((data) => {
        if (data?.id) setArtist(data)
      })
      .catch(() => {})
      .finally(() => setArtistLoading(false))
  }, [artistId])

  const extraParams = useMemo(() => ({ artistId }), [artistId])

  const formFields: FormField[] = [
    { key: 'title', label: 'Título', type: 'text', placeholder: 'Ex: LILAC', required: true },
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
    { key: 'releaseDate', label: 'Data de Lançamento', type: 'date' },
    { key: 'coverUrl', label: 'URL da Capa', type: 'text', placeholder: 'https://...' },
    { key: 'spotifyUrl', label: 'Spotify URL', type: 'text', placeholder: 'https://open.spotify.com/album/...' },
    { key: 'appleMusicUrl', label: 'Apple Music URL', type: 'text', placeholder: 'https://music.apple.com/...' },
    { key: 'youtubeUrl', label: 'YouTube URL', type: 'text', placeholder: 'https://youtube.com/playlist?list=...' },
  ]

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
    const url = editingAlbum
      ? `/api/admin/albums?id=${editingAlbum.id}`
      : '/api/admin/albums'
    const method = editingAlbum ? 'PATCH' : 'POST'

    const payload = { ...data, artistId }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || 'Erro ao salvar álbum')
    }

    refetchTable()
    showToast(editingAlbum ? '✅ Álbum atualizado' : '✅ Álbum adicionado')
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || 'Erro ao deletar')
    }

    refetchTable()
    showToast(`✅ ${selectedIds.length} álbum(ns) deletado(s)`)
    setSelectedIds([])
  }

  const handleClearAll = async () => {
    // Fetch all album IDs for this artist, then delete
    const res = await fetch(`/api/admin/albums?artistId=${artistId}&limit=100&page=1`)
    if (!res.ok) throw new Error('Falha ao buscar álbuns')
    const data = await res.json() as { data: Album[]; total: number }

    let allIds = data.data.map(a => a.id)

    // Paginate if more than 100
    const total = data.total
    if (total > 100) {
      const pages = Math.ceil(total / 100)
      for (let p = 2; p <= pages; p++) {
        const r = await fetch(`/api/admin/albums?artistId=${artistId}&limit=100&page=${p}`)
        if (r.ok) {
          const d = await r.json() as { data: Album[] }
          allIds = allIds.concat(d.data.map(a => a.id))
        }
      }
    }

    if (allIds.length === 0) return

    const del = await fetch('/api/admin/albums', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: allIds }),
    })

    if (!del.ok) {
      const err = await del.json().catch(() => ({}))
      throw new Error((err as { error?: string }).error || 'Erro ao limpar discografia')
    }

    refetchTable()
    showToast(`✅ ${allIds.length} álbum(ns) removido(s)`)
  }

  const handleSync = async () => {
    setSyncLoading(true)
    setSyncModalOpen(false)
    try {
      const res = await fetch('/api/admin/artists/sync-discography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, clearFirst: syncClearFirst }),
      })
      const data = await res.json() as { ok?: boolean; addedCount?: number; source?: string; clearedCount?: number; error?: string }
      if (res.ok && data.ok) {
        const cleared = data.clearedCount ? ` (${data.clearedCount} removidos)` : ''
        showToast(`✅ ${data.addedCount} álbum(ns) adicionado(s) via ${data.source}${cleared}`)
        // Update discographySyncAt in artist header
        setArtist(a => a ? { ...a, discographySyncAt: new Date().toISOString() } : a)
        refetchTable()
      } else {
        showToast(`❌ ${data.error ?? 'Falha na sincronização'}`, false)
      }
    } catch {
      showToast('❌ Erro de rede', false)
    } finally {
      setSyncLoading(false)
      setSyncClearFirst(false)
    }
  }

  const syncLastDate = artist?.discographySyncAt
    ? new Date(artist.discographySyncAt).toLocaleDateString('pt-BR')
    : null

  return (
    <AdminLayout title={artist ? `Discografia: ${artist.nameRomanized}` : 'Discografia'}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg ${
          toast.ok ? 'bg-green-900/90 text-green-300 border border-green-700' : 'bg-red-900/90 text-red-300 border border-red-700'
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Back + Artist header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/admin/artists"
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Artistas
              </Link>
              {!artistLoading && artist && (
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0">
                    {artist.primaryImageUrl ? (
                      <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-white">{artist.nameRomanized}</p>
                    {artist.nameHangul && (
                      <p className="text-xs text-zinc-500">{artist.nameHangul}</p>
                    )}
                  </div>
                  {syncLastDate && (
                    <span className="text-xs text-zinc-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Sync: {syncLastDate}
                    </span>
                  )}
                </div>
              )}
            </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSyncModalOpen(true)}
              disabled={syncLoading}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 font-bold text-sm rounded-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Sincronizando…' : 'Sincronizar'}
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
            <button
              onClick={() => setClearAllOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-800/40 text-red-400 font-bold text-sm rounded-lg transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Limpar tudo
            </button>
          </div>
          </div>

          {/* ID editors row */}
          {!artistLoading && artist && (
            <div className="flex items-center gap-3 flex-wrap pl-0">
              {(['tmdbId', 'mbid'] as const).map((field) => {
                const label = field === 'tmdbId' ? 'TMDB' : 'MusicBrainz'
                const mbLink = field === 'mbid' && artist.mbid
                  ? `https://musicbrainz.org/artist/${artist.mbid}`
                  : null
                const tmdbLink = field === 'tmdbId' && artist.tmdbId
                  ? `https://www.themoviedb.org/person/${artist.tmdbId}`
                  : null
                const externalLink = mbLink ?? tmdbLink

                const isEditing = editingField === field
                const currentVal = artist[field]

                return (
                  <div key={field} className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-zinc-600">{label}</span>

                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveId(field)
                            if (e.key === 'Escape') setEditingField(null)
                          }}
                          placeholder={field === 'mbid' ? 'UUID do MusicBrainz' : 'ID numérico do TMDB'}
                          className="text-xs font-mono bg-zinc-800 border border-zinc-600 text-white rounded px-2 py-0.5 w-52 focus:outline-none focus:border-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveId(field)}
                          disabled={savingId}
                          className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"
                          title="Salvar"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {currentVal ? (
                          <span className="text-xs font-mono text-zinc-400 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700">
                            {currentVal.length > 16 ? `${currentVal.slice(0, 8)}…` : currentVal}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-600 italic">não definido</span>
                        )}
                        {externalLink && (
                          <a href={externalLink} target="_blank" rel="noopener noreferrer"
                            className="p-0.5 text-zinc-600 hover:text-purple-400 transition-colors"
                            title={`Abrir no ${label}`}>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setEditingField(field)
                            setEditingValue(artist[field] ?? '')
                          }}
                          className="p-0.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                          title={`Editar ${label} ID`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* DataTable */}
        <DataTable<Album>
          columns={columns}
          apiUrl="/api/admin/albums"
          extraParams={extraParams}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título…"
        />
      </div>

      {/* Sync modal */}
      {syncModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-black text-white">Sincronizar via MusicBrainz</h2>
            <p className="text-sm text-zinc-400">
              Busca a discografia no MusicBrainz (com fallback via IA). Pode demorar até 1 min.
            </p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={syncClearFirst}
                onChange={e => setSyncClearFirst(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <div>
                <span className="text-sm font-bold text-white">Limpar álbuns antes de sincronizar</span>
                <p className="text-xs text-zinc-500">Remove todos os álbuns atuais e re-importa do zero. Útil para corrigir vinculações erradas.</p>
              </div>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setSyncModalOpen(false); setSyncClearFirst(false) }}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSync}
                className="px-4 py-2 text-sm font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                {syncClearFirst ? 'Limpar e Sincronizar' : 'Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create form */}
      <FormModal
        title={editingAlbum ? 'Editar Álbum' : 'Novo Álbum'}
        fields={formFields}
        initialData={editingAlbum ? (editingAlbum as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete selected */}
      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="álbum"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Clear all confirmation */}
      {clearAllOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-black text-white">Limpar discografia</h2>
            <p className="text-sm text-zinc-400">
              Remove <strong className="text-white">todos</strong> os álbuns de{' '}
              <strong className="text-white">{artist?.nameRomanized ?? 'este artista'}</strong>.
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setClearAllOpen(false)}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setClearAllOpen(false)
                  try {
                    await handleClearAll()
                  } catch (err) {
                    showToast(`❌ ${err instanceof Error ? err.message : 'Erro ao limpar'}`, false)
                  }
                }}
                className="px-4 py-2 text-sm font-bold bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
