'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { AdminModalOverlay, ConfirmDialog, AdminButton } from '@/components/admin'
import { Plus, RefreshCw, Trash2, ArrowLeft, Music, CheckCircle, Pencil, X, Check, ExternalLink, Sparkles } from 'lucide-react'
import { adminApi, ApiError } from '@/lib/admin-api'

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
  ALBUM: 'bg-accent/15 text-accent',
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
        <div className="w-12 h-12 rounded bg-surface flex items-center justify-center">
          <Music className="w-4 h-4 text-muted" />
        </div>
      ),
  },
  { key: 'title', label: 'Título', sortable: true },
  {
    key: 'type',
    label: 'Tipo',
    sortable: true,
    render: (album) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${TYPE_STYLE[album.type] ?? 'bg-surface text-muted'}`}>
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
        <span className="text-foreground text-sm">
          {new Date(album.releaseDate).getUTCFullYear()}
        </span>
      ) : (
        <span className="text-muted">—</span>
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
          <span className="text-muted text-xs">—</span>
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
          className="text-[10px] font-mono text-muted hover:text-accent transition-colors"
          title={album.mbid}
        >
          {album.mbid.slice(0, 8)}…
        </a>
      ) : (
        <span className="text-muted text-xs">—</span>
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
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Inline ID editors
  const [editingField, setEditingField] = useState<'tmdbId' | 'mbid' | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingId, setSavingId] = useState(false)

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const performSync = useCallback(async (clearFirst: boolean) => {
    setSyncLoading(true)
    setSyncModalOpen(false)
    try {
      const res = await fetch('/api/admin/artists/sync-discography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, clearFirst }),
      })
      const data = await res.json() as { ok?: boolean; addedCount?: number; source?: string; clearedCount?: number; error?: string }
      if (res.ok && data.ok) {
        const cleared = data.clearedCount ? ` (${data.clearedCount} removidos)` : ''
        showToast(`✅ ${data.addedCount} álbum(ns) adicionado(s) via ${data.source}${cleared}`)
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
  }, [artistId, showToast])

  const handleEnrich = useCallback(async () => {
    setEnrichLoading(true)
    try {
      const res = await fetch('/api/admin/artists/mb-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId }),
      })
      const data = await res.json() as {
        ok?: boolean
        error?: string
        applied?: { socialLinksAdded: number; tmdbId: boolean }
        found?: { socialLinks: Record<string, string>; tmdbId: string | null }
      }
      if (!res.ok) {
        showToast(`❌ ${data.error ?? 'Erro ao enriquecer'}`, false)
        return
      }
      const parts: string[] = []
      if (data.applied?.socialLinksAdded) parts.push(`${data.applied.socialLinksAdded} rede(s) social(is)`)
      if (data.applied?.tmdbId) {
        parts.push(`TMDB ID ${data.found?.tmdbId}`)
        setArtist(a => a ? { ...a, tmdbId: data.found?.tmdbId ?? a.tmdbId } : a)
      }
      if (parts.length === 0) {
        showToast('ℹ️ Nenhum dado novo encontrado no MusicBrainz')
      } else {
        showToast(`✅ Enriquecido via MB: ${parts.join(', ')}`)
      }
    } catch {
      showToast('❌ Erro de rede', false)
    } finally {
      setEnrichLoading(false)
    }
  }, [artistId, showToast])

  const handleSaveId = async (field: 'tmdbId' | 'mbid') => {
    setSavingId(true)
    try {
      const data = await adminApi.artists.update(artistId, { [field]: editingValue.trim() }) as { clearedAlbumsCount?: number }
      const newVal = editingValue.trim() || null
      setArtist(a => a ? {
        ...a,
        [field]: newVal,
        ...(field === 'mbid' && !newVal ? { discographySyncAt: null } : {}),
      } : a)
      setEditingField(null)
      if (data.clearedAlbumsCount) {
        refetchTable()
        showToast(`✅ MusicBrainz ID removido · ${data.clearedAlbumsCount} álbum(ns) limpos automaticamente`)
      } else if (field === 'mbid' && newVal) {
        // New MBID set — auto-sync discography
        showToast('✅ MusicBrainz ID salvo · Sincronizando discografia…')
        performSync(false)
      } else {
        showToast('✅ ID atualizado')
      }
    } catch (err) {
      showToast(`❌ ${err instanceof ApiError ? err.message : 'Erro de rede'}`, false)
    } finally {
      setSavingId(false)
    }
  }

  // Fetch artist info
  useEffect(() => {
    setArtistLoading(true)
    adminApi.artists.get(artistId)
      .then((data) => { if ((data as Record<string, unknown>)?.id) setArtist(data as unknown as typeof artist) })
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
    const payload = { ...data, artistId }
    if (editingAlbum) {
      await adminApi.albums.update(editingAlbum.id, payload)
    } else {
      await adminApi.albums.create(payload)
    }
    refetchTable()
    showToast(editingAlbum ? '✅ Álbum atualizado' : '✅ Álbum adicionado')
  }

  const handleDeleteConfirm = async () => {
    await adminApi.albums.delete(selectedIds)
    refetchTable()
    showToast(`✅ ${selectedIds.length} álbum(ns) deletado(s)`)
    setSelectedIds([])
  }

  const handleClearAll = async () => {
    // Fetch all album IDs for this artist, then delete
    const first = await adminApi.albums.list({ artistId, limit: 100, page: 1 }) as unknown as { data: Album[]; pagination: { total: number } }
    let allIds = first.data.map(a => a.id)

    // Paginate if more than 100
    const total = first.pagination.total
    if (total > 100) {
      const pages = Math.ceil(total / 100)
      for (let p = 2; p <= pages; p++) {
        const page = await adminApi.albums.list({ artistId, limit: 100, page: p }) as unknown as { data: Album[] }
        allIds = allIds.concat(page.data.map(a => a.id))
      }
    }

    if (allIds.length === 0) return

    await adminApi.albums.delete(allIds)
    refetchTable()
    showToast(`✅ ${allIds.length} álbum(ns) removido(s)`)
  }

  const handleSync = () => performSync(syncClearFirst)

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
                className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Artistas
              </Link>
              {!artistLoading && artist && (
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0">
                    {artist.primaryImageUrl ? (
                      <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="40px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-black text-foreground">{artist.nameRomanized}</p>
                    {artist.nameHangul && (
                      <p className="text-xs text-muted">{artist.nameHangul}</p>
                    )}
                  </div>
                  {syncLastDate && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Sync: {syncLastDate}
                    </span>
                  )}
                </div>
              )}
            </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => setSyncModalOpen(true)}
              disabled={syncLoading}
            >
              <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
              {syncLoading ? 'Sincronizando…' : 'Sincronizar'}
            </AdminButton>
            <button
              onClick={handleEnrich}
              disabled={enrichLoading || !artist?.mbid}
              title={artist?.mbid ? 'Buscar redes sociais e TMDB ID via MusicBrainz relationships' : 'Defina o MusicBrainz ID primeiro'}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/25 text-orange-400 font-bold text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 ${enrichLoading ? 'animate-pulse' : ''}`} />
              {enrichLoading ? 'Enriquecendo…' : 'Enriquecer'}
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
                    <span className="text-[10px] font-black uppercase text-muted">{label}</span>

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
                          className="text-xs font-mono bg-surface border border-border text-foreground rounded px-2 py-0.5 w-52 focus:outline-none focus:border-accent"
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
                          className="p-1 text-muted hover:text-foreground"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {currentVal ? (
                          <span className="text-xs font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                            {currentVal.length > 16 ? `${currentVal.slice(0, 8)}…` : currentVal}
                          </span>
                        ) : (
                          <span className="text-xs text-muted italic">não definido</span>
                        )}
                        {externalLink && (
                          <a href={externalLink} target="_blank" rel="noopener noreferrer"
                            className="p-0.5 text-muted hover:text-accent transition-colors"
                            title={`Abrir no ${label}`}>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setEditingField(field)
                            setEditingValue(artist[field] ?? '')
                          }}
                          className="p-0.5 text-muted hover:text-foreground transition-colors"
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
      <AdminModalOverlay
        open={syncModalOpen}
        onClose={() => { setSyncModalOpen(false); setSyncClearFirst(false) }}
        title="Sincronizar via MusicBrainz"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
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
              <span className="text-sm font-bold text-foreground">Limpar álbuns antes de sincronizar</span>
              <p className="text-xs text-muted">Remove todos os álbuns atuais e re-importa do zero. Útil para corrigir vinculações erradas.</p>
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setSyncModalOpen(false); setSyncClearFirst(false) }}
              className="px-4 py-2 text-sm font-bold text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSync}
              className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-colors"
            >
              {syncClearFirst ? 'Limpar e Sincronizar' : 'Sincronizar'}
            </button>
          </div>
        </div>
      </AdminModalOverlay>

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
      <ConfirmDialog
        open={clearAllOpen}
        title="Limpar discografia"
        description={`Remove todos os álbuns de ${artist?.nameRomanized ?? 'este artista'}. Esta ação não pode ser desfeita.`}
        confirmLabel="Limpar tudo"
        variant="danger"
        onConfirm={() => {
          setClearAllOpen(false)
          handleClearAll().catch(err => {
            showToast(`❌ ${err instanceof Error ? err.message : 'Erro ao limpar'}`, false)
          })
        }}
        onCancel={() => setClearAllOpen(false)}
      />
    </AdminLayout>
  )
}
