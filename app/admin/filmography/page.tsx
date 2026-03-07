'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, Search, Info } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  tmdbId: string | null
  tmdbSyncStatus: string | null
  tmdbLastSync: Date | null | string
  productionsCount: number
}

interface Stats {
  totalArtists: number
  withFilmography: number
  withoutFilmography: number
  syncedRecently: number
  needsUpdate: number
}

type FilterType = 'all' | 'without' | 'outdated'

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; badge: string }> = {
  SYNCED:    { icon: CheckCircle,  label: 'Sincronizado',           color: 'text-green-400',  badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
  NOT_FOUND: { icon: XCircle,      label: 'Não encontrado no TMDB', color: 'text-yellow-400', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  ERROR:     { icon: AlertCircle,  label: 'Erro',                   color: 'text-red-400',    badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  PENDING:   { icon: Clock,        label: 'Pendente',               color: 'text-zinc-500',   badge: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
}

function getStatus(status: string | null) {
  return STATUS_CONFIG[status ?? ''] ?? STATUS_CONFIG.PENDING
}

function timeAgoOrDate(date: Date | string | null): string | null {
  if (!date) return null
  const d = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('pt-BR')
}

export default function FilmographyAdminPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const [batchResult, setBatchResult] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [statsRes, artistsRes] = await Promise.all([
        fetch('/api/admin/filmography'),
        fetch('/api/admin/artists?limit=100'),
      ])
      if (statsRes.ok) setStats((await statsRes.json()).stats)
      if (artistsRes.ok) setArtists((await artistsRes.json()).items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function syncArtist(artistId: string) {
    if (syncing) return
    try {
      setSyncing(artistId)
      const res = await fetch('/api/admin/filmography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistIds: [artistId], strategy: 'SMART_MERGE' }),
      })
      const result = await res.json()
      if (!result.success) alert(`Erro: ${result.message || 'Falha na sincronização'}`)
      await loadData()
    } catch {
      alert('Erro ao sincronizar filmografia')
    } finally {
      setSyncing(null)
    }
  }

  async function syncOutdated() {
    if (batchSyncing) return
    if (!confirm('Sincronizar filmografias desatualizadas?\n\nIsso pode levar alguns minutos.')) return
    try {
      setBatchSyncing(true)
      setBatchResult(null)
      const res = await fetch('/api/admin/filmography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: 'INCREMENTAL', concurrency: 3 }),
      })
      const result = await res.json()
      if (result.success) {
        setBatchResult(`✓ ${result.result.successCount}/${result.result.total} sincronizados · ${result.result.failureCount} falhas · ${(result.result.duration / 1000).toFixed(1)}s`)
        await loadData()
      } else {
        alert(`Erro: ${result.message || 'Falha na sincronização em lote'}`)
      }
    } catch {
      alert('Erro ao sincronizar filmografias')
    } finally {
      setBatchSyncing(false)
    }
  }

  const filteredArtists = artists.filter(artist => {
    if (filter === 'without' && artist.productionsCount > 0) return false
    if (filter === 'outdated' && artist.tmdbLastSync) {
      const days = Math.floor((Date.now() - new Date(artist.tmdbLastSync).getTime()) / 86400000)
      if (days < 30) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return artist.nameRomanized.toLowerCase().includes(q) || !!artist.nameHangul?.toLowerCase().includes(q)
    }
    return true
  })

  const filters: { value: FilterType; label: string; count?: number }[] = [
    { value: 'all',      label: 'Todos',          count: artists.length },
    { value: 'without',  label: 'Sem filmografia', count: stats?.withoutFilmography },
    { value: 'outdated', label: 'Desatualizados',  count: stats?.needsUpdate },
  ]

  return (
    <AdminLayout title="Filmografias">
      <div className="space-y-4">
        <p className="text-zinc-500 text-xs -mt-6 flex items-center gap-1.5">
          <Info size={12} />
          Sync automático a cada 15 min via cron · Use para forçar manualmente
        </p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { label: 'Total',            value: stats.totalArtists,     color: 'text-white' },
              { label: 'Com filmografia',  value: stats.withFilmography,  color: 'text-green-400' },
              { label: 'Sem filmografia',  value: stats.withoutFilmography, color: 'text-yellow-400' },
              { label: 'Atualizados (7d)', value: stats.syncedRecently,   color: 'text-blue-400' },
              { label: 'Precisam sync',    value: stats.needsUpdate,      color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar artista..."
                className="w-full pl-8 pr-3 py-2 bg-black border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            {/* Batch sync */}
            <button
              onClick={syncOutdated}
              disabled={batchSyncing}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <RefreshCw size={14} className={batchSyncing ? 'animate-spin' : ''} />
              {batchSyncing ? 'Sincronizando...' : 'Sync Desatualizados'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-1.5">
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                {f.label}
                {f.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    filter === f.value ? 'bg-purple-500/30' : 'bg-zinc-700'
                  }`}>{f.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Batch result */}
          {batchResult && (
            <p className="text-xs text-green-400 font-medium">{batchResult}</p>
          )}
        </div>

        {/* Artist list */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-xs font-black text-zinc-400 uppercase tracking-wider">
              Artistas
            </h2>
            <span className="text-xs text-zinc-600 tabular-nums">{filteredArtists.length} resultado{filteredArtists.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          ) : filteredArtists.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-12">Nenhum artista encontrado</p>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredArtists.map(artist => {
                const status = getStatus(artist.tmdbSyncStatus)
                const StatusIcon = status.icon
                const lastSync = timeAgoOrDate(artist.tmdbLastSync)
                const isSyncing = syncing === artist.id

                return (
                  <div key={artist.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors group">
                    <StatusIcon size={15} className={`flex-shrink-0 ${status.color}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{artist.nameRomanized}</span>
                        {artist.nameHangul && (
                          <span className="text-xs text-zinc-500">{artist.nameHangul}</span>
                        )}
                        <span className={`hidden sm:inline text-[10px] font-black px-1.5 py-0.5 rounded border ${status.badge}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px] text-zinc-600">
                        <span>{artist.productionsCount} prod.</span>
                        {lastSync && <span>sync {lastSync}</span>}
                        {!artist.tmdbId && <span className="text-red-400/70">sem TMDB ID</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => syncArtist(artist.id)}
                      disabled={!!syncing}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-400 border border-zinc-700 rounded-lg hover:border-purple-500/50 hover:text-purple-400 hover:bg-purple-500/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                      {isSyncing ? 'Sync...' : 'Sync'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
