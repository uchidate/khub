'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, ExternalLink, Music2, RefreshCw, Search, User } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { PageHeader } from '@/components/admin/PageHeader'
import { AdminEmptyState, StatCard } from '@/components/admin'
import { useAdminToast } from '@/lib/hooks/useAdminToast'

type SpotifyLink = {
  externalId: string
  url: string
  matchStatus: string
  matchedAt: string | null
}

type Artist = {
  id: string
  nameRomanized: string
  nameHangul: string | null
  stageNames: string[]
  primaryImageUrl: string | null
  spotifyLink: SpotifyLink | null
}

type SpotifyCandidate = {
  id: string
  name: string
  url: string
  imageUrl: string | null
  followers: number
  popularity: number
  genres: string[]
}

type Stats = {
  total: number
  linked: number
  missing: number
}

const FILTERS = [
  { value: 'missing', label: 'Sem Spotify' },
  { value: 'linked', label: 'Vinculados' },
  { value: 'all', label: 'Todos' },
] as const

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
}

export default function MusicCatalogPage() {
  const toast = useAdminToast()
  const [artists, setArtists] = useState<Artist[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, linked: 0, missing: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('missing')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [activeArtistId, setActiveArtistId] = useState<string | null>(null)
  const [spotifyQuery, setSpotifyQuery] = useState('')
  const [spotifyCandidates, setSpotifyCandidates] = useState<SpotifyCandidate[]>([])
  const [spotifyLoading, setSpotifyLoading] = useState(false)
  const [spotifySavingId, setSpotifySavingId] = useState<string | null>(null)

  const loadArtists = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        filter,
        search,
        page: String(page),
      })
      const res = await fetch(`/api/admin/music-catalog/artists?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar catálogo')
      setArtists(data.artists)
      setStats(data.stats)
      setPages(data.pages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar catálogo')
    } finally {
      setLoading(false)
    }
  }, [filter, page, search, toast])

  useEffect(() => {
    loadArtists()
  }, [loadArtists])

  const activeArtist = artists.find(artist => artist.id === activeArtistId) ?? null

  const openSpotifySearch = (artist: Artist) => {
    setActiveArtistId(artist.id)
    setSpotifyQuery(artist.stageNames[0] || artist.nameRomanized)
    setSpotifyCandidates([])
  }

  const searchSpotify = async () => {
    if (!spotifyQuery.trim()) return
    setSpotifyLoading(true)
    try {
      const res = await fetch(`/api/admin/artists/spotify-search?name=${encodeURIComponent(spotifyQuery.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao buscar no Spotify')
      setSpotifyCandidates(data.artists ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao buscar no Spotify')
    } finally {
      setSpotifyLoading(false)
    }
  }

  const linkSpotify = async (candidate: SpotifyCandidate) => {
    if (!activeArtist) return
    setSpotifySavingId(candidate.id)
    try {
      const res = await fetch(`/api/admin/artists/${activeArtist.id}/spotify-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ externalId: candidate.id, url: candidate.url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao vincular Spotify')
      setActiveArtistId(null)
      setSpotifyCandidates([])
      toast.success('Spotify vinculado')
      await loadArtists()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao vincular Spotify')
    } finally {
      setSpotifySavingId(null)
    }
  }

  const knownNames = activeArtist
    ? [activeArtist.nameRomanized, ...activeArtist.stageNames, activeArtist.nameHangul ?? ''].filter(Boolean)
    : []
  const normalizedNames = new Set(knownNames.map(normalizeName))

  return (
    <AdminLayout title="Catálogo Musical">
      <div className="px-4 py-8 space-y-6">
        <PageHeader
          title="Catálogo Musical"
          subtitle="Curadoria de vínculos oficiais com plataformas musicais."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard label="Artistas" value={stats.total} />
          <StatCard label="Spotify confirmados" value={stats.linked} />
          <StatCard label="Pendentes" value={stats.missing} />
        </div>

        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(item => (
              <button
                key={item.value}
                onClick={() => { setFilter(item.value); setPage(1) }}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  filter === item.value
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'bg-surface text-muted border-border hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative lg:ml-auto lg:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={event => { setSearch(event.target.value); setPage(1) }}
              placeholder="Buscar artista..."
              className="w-full px-4 pr-10 py-2 bg-background border border-border rounded-lg text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-16 rounded-lg bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <AdminEmptyState title="Nenhum artista encontrado" size="md" />
        ) : (
          <div className="space-y-2">
            {artists.map(artist => (
              <div key={artist.id} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-surface">
                {artist.primaryImageUrl ? (
                  <Image
                    src={artist.primaryImageUrl}
                    alt={artist.nameRomanized}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-background flex items-center justify-center">
                    <User className="w-4 h-4 text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{artist.nameRomanized}</p>
                  <p className="text-xs text-muted truncate">
                    {[artist.stageNames[0], artist.nameHangul].filter(Boolean).join(' · ') || 'Sem aliases cadastrados'}
                  </p>
                </div>
                {artist.spotifyLink ? (
                  <>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 text-green-400">
                      <CheckCircle className="w-3 h-3" />
                      Spotify
                    </span>
                    <a href={artist.spotifyLink.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-muted hover:text-foreground">
                      Abrir
                    </a>
                  </>
                ) : (
                  <button
                    onClick={() => openSpotifySearch(artist)}
                    className="px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20"
                  >
                    Vincular Spotify
                  </button>
                )}
                <Link href={`/admin/artists/${artist.id}`} className="text-xs text-muted hover:text-foreground">
                  Editar
                </Link>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-end items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(current => current - 1)}
              className="px-3 py-2 text-xs border border-border rounded-lg disabled:opacity-50">
              Anterior
            </button>
            <span className="text-xs text-muted">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(current => current + 1)}
              className="px-3 py-2 text-xs border border-border rounded-lg disabled:opacity-50">
              Próxima
            </button>
          </div>
        )}

        {activeArtist && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-lg border border-border bg-background p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{activeArtist.nameRomanized}</h2>
                  <p className="text-sm text-muted">Escolha o perfil oficial do Spotify.</p>
                </div>
                <button onClick={() => setActiveArtistId(null)} className="text-sm text-muted hover:text-foreground">
                  Fechar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={spotifyQuery}
                  onChange={event => setSpotifyQuery(event.target.value)}
                  className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm"
                />
                <button onClick={searchSpotify} disabled={spotifyLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50">
                  {spotifyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Music2 className="w-4 h-4" />}
                  Buscar
                </button>
              </div>

              {knownNames.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {knownNames.map(name => (
                    <button key={name} onClick={() => setSpotifyQuery(name)}
                      className="px-2 py-1 rounded border border-border text-[11px] text-muted hover:text-foreground">
                      {name}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-[420px] overflow-y-auto space-y-2">
                {spotifyCandidates.map(candidate => {
                  const strongMatch = normalizedNames.has(normalizeName(candidate.name))
                  return (
                    <div key={candidate.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                      {candidate.imageUrl ? (
                        <Image src={candidate.imageUrl} alt={candidate.name} width={44} height={44}
                          className="w-11 h-11 rounded object-cover" unoptimized />
                      ) : (
                        <div className="w-11 h-11 rounded bg-background flex items-center justify-center">
                          <User className="w-4 h-4 text-muted" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{candidate.name}</p>
                          {strongMatch && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                              Correspondência forte
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted truncate">{candidate.url}</p>
                      </div>
                      <a href={candidate.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground">
                        Abrir
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button onClick={() => linkSpotify(candidate)} disabled={spotifySavingId === candidate.id}
                        className="px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-xs font-bold disabled:opacity-50">
                        {spotifySavingId === candidate.id ? 'Salvando...' : 'Vincular'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
