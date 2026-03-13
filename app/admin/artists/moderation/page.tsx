'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, CheckCircle, Trash2, RefreshCw,
  ShieldAlert, Flag, FlagOff, CheckSquare, Square, Minus,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

type Artist = {
  id: string
  nameRomanized: string
  nameHangul: string | null
  placeOfBirth: string | null
  bio: string | null
  primaryImageUrl: string | null
  roles: string[]
  tmdbId: string | null
  createdAt: string
  flaggedAsNonKorean: boolean
  flaggedAt: string | null
  suspicionScore: number
  suspicionReasons: string[]
  _count: { productions: number; memberships: number }
}

type Filter = 'suspicious' | 'recent' | 'flagged' | 'adult' | 'all'
type Stats = { suspicious: number; recent: number; flagged: number; adult: number; all: number }

const ADULT_KEYWORDS = [
  'porn', 'porno', 'pornô', 'xxx', 'jav',
  'gravure', 'av idol', 'av girl', 'av model',
  'hentai', 'erotic film', 'erotic movie', 'erotic drama',
  'adult film', 'adult video', 'adult movie', 'adult content',
  'nude model', 'nude film', 'softcore', 'hardcore',
  'fetish', 'bdsm', 'onlyfans', 'camgirl', 'cam girl',
  'sex tape', 'sex film', 'sex movie',
  'uncensored', 'leaked sex', 'explicit content',
]

function detectAdultKeywords(text: string): string[] {
  const lower = text.toLowerCase()
  return ADULT_KEYWORDS.filter(kw => lower.includes(kw))
}

function ConfirmModal({
  open, title, message, confirmLabel, destructive, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel: string
  destructive?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ArtistModerationPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('suspicious')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{
    open: boolean; title: string; message: string
    confirmLabel: string; destructive?: boolean; onConfirm: () => void
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} })

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/artists/moderation?stats=1&filter=all')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchArtists = useCallback(async (p = page) => {
    setLoading(true)
    setSelected(new Set())
    try {
      const res = await fetch(`/api/admin/artists/moderation?filter=${filter}&page=${p}&limit=20`)
      const data = await res.json()
      if (res.ok) {
        setArtists(data.artists)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [filter, page])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1); fetchArtists(1) }, [filter]) // fetchArtists estável via useCallback
  useEffect(() => { fetchArtists(page) }, [page]) // fetchArtists estável via useCallback

  function openConfirm(opts: typeof modal) { setModal({ ...opts, open: true }) }
  const addActioning = (ids: string[]) => setActioningIds(prev => new Set(Array.from(prev).concat(ids)))
  const removeActioning = (ids: string[]) => setActioningIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s })

  async function doFlag(ids: string[], flaggedAsNonKorean: boolean) {
    addActioning(ids)
    try {
      await Promise.all(ids.map(id =>
        fetch('/api/admin/artists/moderation', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artistId: id, flaggedAsNonKorean }),
        })
      ))
      // eslint-disable-next-line no-empty
      await fetchArtists(page)
      await fetchStats()
    } finally { removeActioning(ids) }
  }

  async function doDelete(ids: string[]) {
    addActioning(ids)
    try {
      const res = await fetch('/api/admin/artists/moderation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) { await fetchArtists(page); await fetchStats() }
    } finally { removeActioning(ids) }
  }

  function handleDelete(artist: Artist) {
    openConfirm({
      open: true,
      title: 'Remover artista',
      message: `"${artist.nameRomanized}" será removido permanentemente. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Remover',
      destructive: true,
      onConfirm: () => doDelete([artist.id]),
    })
  }

  function handleBulkDelete() {
    const ids = Array.from(selected)
    openConfirm({
      open: true,
      title: `Remover ${ids.length} artistas`,
      message: `${ids.length} artistas serão removidos permanentemente.`,
      confirmLabel: 'Remover todos',
      destructive: true,
      onConfirm: () => doDelete(ids),
    })
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const allSelected = artists.length > 0 && artists.every(a => selected.has(a.id))
  const someSelected = artists.some(a => selected.has(a.id)) && !allSelected

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(artists.map(a => a.id)))
  }

  const filterTabs: { key: Filter; label: string; count?: number; danger?: boolean }[] = [
    { key: 'suspicious', label: 'Suspeitos', count: stats?.suspicious },
    { key: 'recent', label: 'Recentes (7d)', count: stats?.recent },
    { key: 'flagged', label: 'Marcados', count: stats?.flagged },
    { key: 'adult', label: 'Conteúdo adulto', count: stats?.adult, danger: true },
    { key: 'all', label: 'Todos', count: stats?.all },
  ]

  return (
    <AdminLayout title="Moderação de Artistas">
      <ConfirmModal
        {...modal}
        onConfirm={() => { setModal(m => ({ ...m, open: false })); modal.onConfirm() }}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      <div className="space-y-4">
        <p className="text-zinc-400 text-sm -mt-6">Revise e gerencie artistas com relevância duvidosa para a cultura coreana</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Suspeitos', value: stats.suspicious, color: 'text-red-400' },
              { label: 'Recentes (7d)', value: stats.recent, color: 'text-yellow-400' },
              { label: 'Marcados', value: stats.flagged, color: 'text-zinc-400' },
              { label: 'Adulto', value: stats.adult, color: 'text-pink-400' },
              { label: 'Total ativos', value: stats.all, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(f => {
              const isActive = filter === f.key
              const activeClass = f.danger ? 'bg-pink-700 text-white' : 'bg-purple-600 text-white'
              const inactiveClass = f.danger
                ? 'bg-pink-600/10 text-pink-400 border border-pink-600/30 hover:bg-pink-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              const badgeClass = isActive
                ? f.danger ? 'bg-pink-600/50' : 'bg-purple-500/50'
                : 'bg-zinc-700'
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? activeClass : inactiveClass}`}
                >
                  {f.danger && <ShieldAlert size={13} />}
                  {f.label}
                  {f.count !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeClass}`}>{f.count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 flex-wrap ${
            filter === 'adult'
              ? 'bg-pink-600/10 border border-pink-600/30'
              : 'bg-purple-600/10 border border-purple-600/30'
          }`}>
            <span className={`text-sm font-medium flex-1 min-w-fit ${filter === 'adult' ? 'text-pink-400' : 'text-purple-400'}`}>
              {selected.size} selecionado{selected.size !== 1 ? 's' : ''}
            </span>
            {filter !== 'adult' && (
              <>
                <button
                  onClick={() => {
                    const ids = Array.from(selected)
                    openConfirm({
                      open: true,
                      title: `Marcar ${ids.length} artistas`,
                      message: `${ids.length} artistas serão marcados como não-relevantes.`,
                      confirmLabel: 'Marcar todos',
                      onConfirm: () => doFlag(ids, true),
                    })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <Flag size={12} /> Marcar
                </button>
                <button
                  onClick={() => {
                    const ids = Array.from(selected)
                    openConfirm({
                      open: true,
                      title: `Desmarcar ${ids.length} artistas`,
                      message: `${ids.length} artistas serão desmarcados.`,
                      confirmLabel: 'Desmarcar todos',
                      onConfirm: () => doFlag(ids, false),
                    })
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 rounded-lg transition-colors"
                >
                  <FlagOff size={12} /> Desmarcar
                </button>
              </>
            )}
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 text-red-400 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <Trash2 size={12} /> Remover
            </button>
            <button onClick={() => setSelected(new Set())} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
              Limpar
            </button>
          </div>
        )}

        {/* Select-all + count */}
        {artists.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              {allSelected ? <CheckSquare size={14} className="text-purple-400" />
                : someSelected ? <Minus size={14} className="text-purple-400" />
                : <Square size={14} />}
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <span className="text-xs text-zinc-600 ml-auto">{total} artista{total !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : artists.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-zinc-400">Nenhum artista encontrado nesta categoria</p>
          </div>
        ) : (
          <div className="space-y-3">
            {artists.map(artist => {
              const adultKws = filter === 'adult'
                ? detectAdultKeywords((artist.nameRomanized ?? '') + ' ' + (artist.bio ?? ''))
                : []
              const isActioning = actioningIds.has(artist.id)
              const isSelected = selected.has(artist.id)
              const borderClass = filter === 'adult'
                ? 'border-pink-500/40 bg-pink-500/5'
                : artist.flaggedAsNonKorean
                ? 'border-zinc-700'
                : artist.suspicionScore >= 7 ? 'border-red-500/30 bg-red-500/5'
                : artist.suspicionScore >= 4 ? 'border-yellow-500/20 bg-yellow-500/5'
                : 'border-green-500/10'

              return (
                <div key={artist.id} className={`border rounded-xl transition-colors ${borderClass} ${isSelected ? 'ring-1 ring-purple-500' : ''}`}>
                  <div className="flex gap-3 p-3">
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(artist.id)} className="shrink-0 mt-1 text-zinc-500 hover:text-purple-400 transition-colors">
                      {isSelected ? <CheckSquare size={18} className="text-purple-400" /> : <Square size={18} />}
                    </button>

                    {/* Photo */}
                    <div className="shrink-0">
                      {artist.primaryImageUrl ? (
                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={56} height={56} className="rounded-lg object-cover w-14 h-14" />
                      ) : (
                        <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <Shield size={20} className="text-zinc-600" />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-white text-sm">{artist.nameRomanized}</span>
                          {artist.nameHangul && <span className="text-xs text-zinc-500 ml-2">{artist.nameHangul}</span>}
                          {artist.flaggedAsNonKorean && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">Marcado</span>
                          )}
                        </div>
                        {filter === 'suspicious' && (
                          <span className={`text-xs font-bold shrink-0 ${
                            artist.suspicionScore >= 7 ? 'text-red-400' : artist.suspicionScore >= 4 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            Score {artist.suspicionScore}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2 flex-wrap">
                        {artist.placeOfBirth
                          ? <span>{artist.placeOfBirth}</span>
                          : <span className="text-red-400/70">Sem local de nascimento</span>}
                        <span>·</span>
                        <span>{artist._count.productions} prod.</span>
                        <span>{artist._count.memberships} grupos</span>
                        {artist.tmdbId && <span className="text-blue-400/80">TMDB ✓</span>}
                      </div>

                      {/* Adult keywords */}
                      {adultKws.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {adultKws.map((kw, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-pink-600/20 border border-pink-500/30 text-pink-300 rounded-full font-mono">{kw}</span>
                          ))}
                        </div>
                      )}

                      {/* Suspicion reasons */}
                      {artist.suspicionReasons.length > 0 && filter !== 'adult' && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {artist.suspicionReasons.map((r, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400">{r}</span>
                          ))}
                        </div>
                      )}

                      {/* Bio preview */}
                      {artist.bio && (
                        <p className="text-xs text-zinc-500 line-clamp-1 mb-2">{artist.bio}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {filter !== 'adult' && (
                          <button
                            onClick={() => {
                              const ids = [artist.id]
                              openConfirm({
                                open: true,
                                title: artist.flaggedAsNonKorean ? 'Desmarcar artista' : 'Marcar como não-relevante',
                                message: `"${artist.nameRomanized}" será ${artist.flaggedAsNonKorean ? 'desmarcado' : 'marcado como não-relevante'}.`,
                                confirmLabel: artist.flaggedAsNonKorean ? 'Desmarcar' : 'Marcar',
                                onConfirm: () => doFlag(ids, !artist.flaggedAsNonKorean),
                              })
                            }}
                            disabled={isActioning}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                              artist.flaggedAsNonKorean
                                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                                : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
                            }`}
                          >
                            {artist.flaggedAsNonKorean ? <FlagOff size={12} /> : <Flag size={12} />}
                            {artist.flaggedAsNonKorean ? 'Desmarcar' : 'Não é coreano'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(artist)}
                          disabled={isActioning}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50 border border-zinc-700"
                        >
                          {isActioning ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          Remover
                        </button>
                        <Link href={`/artists/${artist.id}`} target="_blank" className="text-xs text-purple-400 hover:underline">
                          Ver →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Anterior
            </button>
            <span className="text-sm text-zinc-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
