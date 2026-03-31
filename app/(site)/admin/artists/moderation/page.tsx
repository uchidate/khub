'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, CheckCircle, EyeOff, RefreshCw,
  ShieldAlert, Flag, FlagOff, CheckSquare, Square, Minus,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ConfirmDialog, AdminButton } from '@/components/admin'
import { adminApi, ApiError } from '@/lib/admin-api'

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
  hiddenProductionsCount: number
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

export default function ArtistModerationPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('suspicious')
  const [hiddenFilter, setHiddenFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{
    open: boolean; title: string; description: string
    confirmLabel: string; variant?: 'danger' | 'default'; onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: '', onConfirm: () => {} })

  const fetchStats = useCallback(async () => {
    try {
      const hiddenParam = hiddenFilter === 'hidden' ? '&hidden=true' : hiddenFilter === 'visible' ? '&hidden=false' : ''
      const res = await fetch(`/api/admin/artists/moderation?stats=1&filter=all${hiddenParam}`)
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [hiddenFilter])

  const fetchArtists = useCallback(async (p = page) => {
    setLoading(true)
    setSelected(new Set())
    try {
      const hiddenParam = hiddenFilter === 'hidden' ? '&hidden=true' : hiddenFilter === 'visible' ? '&hidden=false' : ''
      const res = await fetch(`/api/admin/artists/moderation?filter=${filter}&page=${p}&limit=20${hiddenParam}`)
      const data = await res.json()
      if (res.ok) {
        setArtists(data.artists)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [filter, hiddenFilter, page])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1); fetchArtists(1) }, [filter, hiddenFilter, fetchArtists])
  useEffect(() => { fetchArtists(page) }, [page, fetchArtists])

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
      await fetchArtists(page)
      await fetchStats()
    } finally { removeActioning(ids) }
  }

  async function doHide(ids: string[]) {
    addActioning(ids)
    try {
      await adminApi.artists.bulkHide(ids, true)
      await fetchArtists(page); await fetchStats()
    } catch { /* ignore */ } finally { removeActioning(ids) }
  }

  function handleHide(artist: Artist) {
    openConfirm({
      open: true,
      title: 'Ocultar artista',
      description: `"${artist.nameRomanized}" ficará oculto do site público. É possível restaurar depois em Admin → Artistas.`,
      confirmLabel: 'Ocultar',
      onConfirm: () => doHide([artist.id]),
    })
  }

  function handleBulkHide() {
    const ids = Array.from(selected)
    openConfirm({
      open: true,
      title: `Ocultar ${ids.length} artistas`,
      description: `${ids.length} artistas ficarão ocultos do site público. É possível restaurar depois em Admin → Artistas.`,
      confirmLabel: 'Ocultar todos',
      onConfirm: () => doHide(ids),
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
      <ConfirmDialog
        open={modal.open}
        title={modal.title}
        description={modal.description}
        confirmLabel={modal.confirmLabel}
        variant={modal.variant ?? 'default'}
        onConfirm={() => { setModal(m => ({ ...m, open: false })); modal.onConfirm() }}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      <div className="space-y-4">
        <p className="text-muted text-sm -mt-6">Revise e gerencie artistas com relevância duvidosa para a cultura coreana</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Suspeitos', value: stats.suspicious, color: 'text-red-400' },
              { label: 'Recentes (7d)', value: stats.recent, color: 'text-yellow-400' },
              { label: 'Marcados', value: stats.flagged, color: 'text-muted' },
              { label: 'Adulto', value: stats.adult, color: 'text-pink-400' },
              { label: 'Total ativos', value: stats.all, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-surface border border-border rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filter tabs */}
        <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(f => {
              const isActive = filter === f.key
              const activeClass = f.danger ? 'bg-pink-700 text-foreground' : 'bg-accent text-white'
              const inactiveClass = f.danger
                ? 'bg-pink-600/10 text-pink-400 border border-pink-600/30 hover:bg-pink-600/20'
                : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
              const badgeClass = isActive
                ? f.danger ? 'bg-pink-600/50' : 'bg-white/20 text-white'
                : 'bg-surface'
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${isActive ? activeClass : inactiveClass}`}
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
          {/* Subfiltro visibilidade */}
          <div className="flex items-center gap-1 pt-1 border-t border-border">
            <span className="text-xs text-muted mr-1">Visibilidade:</span>
            {(['all', 'visible', 'hidden'] as const).map(v => (
              <button
                key={v}
                onClick={() => setHiddenFilter(v)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  hiddenFilter === v
                    ? 'bg-accent text-white'
                    : 'bg-surface text-muted hover:bg-surface hover:text-foreground'
                }`}
              >
                {v === 'all' ? 'Todos' : v === 'visible' ? 'Visíveis' : 'Ocultos'}
              </button>
            ))}
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
                <AdminButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const ids = Array.from(selected)
                    openConfirm({
                      open: true,
                      title: `Marcar ${ids.length} artistas`,
                      description: `${ids.length} artistas serão marcados como não-relevantes.`,
                      confirmLabel: 'Marcar todos',
                      onConfirm: () => doFlag(ids, true),
                    })
                  }}
                >
                  <Flag size={12} /> Marcar
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const ids = Array.from(selected)
                    openConfirm({
                      open: true,
                      title: `Desmarcar ${ids.length} artistas`,
                      description: `${ids.length} artistas serão desmarcados.`,
                      confirmLabel: 'Desmarcar todos',
                      onConfirm: () => doFlag(ids, false),
                    })
                  }}
                >
                  <FlagOff size={12} /> Desmarcar
                </AdminButton>
              </>
            )}
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={handleBulkHide}
            >
              <EyeOff size={12} /> Ocultar
            </AdminButton>
            <button onClick={() => setSelected(new Set())} className="text-muted hover:text-foreground transition-colors text-xs">
              Limpar
            </button>
          </div>
        )}

        {/* Select-all + count */}
        {artists.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors">
              {allSelected ? <CheckSquare size={14} className="text-purple-400" />
                : someSelected ? <Minus size={14} className="text-purple-400" />
                : <Square size={14} />}
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            <span className="text-xs text-muted ml-auto">{total} artista{total !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : artists.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted">Nenhum artista encontrado nesta categoria</p>
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
                ? 'border-border'
                : artist.suspicionScore >= 7 ? 'border-red-500/30 bg-red-500/5'
                : artist.suspicionScore >= 4 ? 'border-yellow-500/20 bg-yellow-500/5'
                : 'border-green-500/10'

              return (
                <div key={artist.id} className={`border rounded-xl transition-colors ${borderClass} ${isSelected ? 'ring-1 ring-purple-500' : ''}`}>
                  <div className="flex gap-3 p-3">
                    {/* Checkbox */}
                    <button onClick={() => toggleSelect(artist.id)} className="shrink-0 mt-1 text-muted hover:text-purple-400 transition-colors">
                      {isSelected ? <CheckSquare size={18} className="text-purple-400" /> : <Square size={18} />}
                    </button>

                    {/* Photo */}
                    <div className="shrink-0">
                      {artist.primaryImageUrl ? (
                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} width={56} height={56} className="rounded-lg object-cover w-14 h-14" />
                      ) : (
                        <div className="w-14 h-14 bg-surface rounded-lg flex items-center justify-center">
                          <Shield size={20} className="text-muted" />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-foreground text-sm">{artist.nameRomanized}</span>
                          {artist.nameHangul && <span className="text-xs text-muted ml-2">{artist.nameHangul}</span>}
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

                      <div className="flex items-center gap-1.5 text-xs text-muted mb-2 flex-wrap">
                        {artist.placeOfBirth
                          ? <span>{artist.placeOfBirth}</span>
                          : <span className="text-red-400/70">Sem local de nascimento</span>}
                        <span>·</span>
                        <span>{artist._count.productions} prod.{artist.hiddenProductionsCount > 0 && <span className="text-muted ml-0.5">({artist.hiddenProductionsCount} ocultas)</span>}</span>
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
                            <span key={i} className="text-xs px-2 py-0.5 bg-surface border border-border rounded-full text-muted">{r}</span>
                          ))}
                        </div>
                      )}

                      {/* Bio preview */}
                      {artist.bio && (
                        <p className="text-xs text-muted line-clamp-1 mb-2">{artist.bio}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {filter !== 'adult' && (
                          <AdminButton
                            variant={artist.flaggedAsNonKorean ? 'secondary' : 'danger'}
                            size="sm"
                            onClick={() => {
                              const ids = [artist.id]
                              openConfirm({
                                open: true,
                                title: artist.flaggedAsNonKorean ? 'Desmarcar artista' : 'Marcar como não-relevante',
                                description: `"${artist.nameRomanized}" será ${artist.flaggedAsNonKorean ? 'desmarcado' : 'marcado como não-relevante'}.`,
                                confirmLabel: artist.flaggedAsNonKorean ? 'Desmarcar' : 'Marcar',
                                onConfirm: () => doFlag(ids, !artist.flaggedAsNonKorean),
                              })
                            }}
                            disabled={isActioning}
                          >
                            {artist.flaggedAsNonKorean ? <FlagOff size={12} /> : <Flag size={12} />}
                            {artist.flaggedAsNonKorean ? 'Desmarcar' : 'Não é coreano'}
                          </AdminButton>
                        )}
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          onClick={() => handleHide(artist)}
                          disabled={isActioning}
                        >
                          {isActioning ? <RefreshCw size={12} className="animate-spin" /> : <EyeOff size={12} />}
                          Ocultar
                        </AdminButton>
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
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
            >
              Anterior
            </AdminButton>
            <span className="text-sm text-muted">{page} / {totalPages}</span>
            <AdminButton
              variant="secondary"
              size="md"
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              Próxima
            </AdminButton>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
