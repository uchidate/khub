'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Film, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import NavBar from '@/components/NavBar'

interface Artist {
  id: string
  nameRomanized: string
  nameHangul: string | null
  tmdbId: string | null
  tmdbSyncStatus: string | null
  tmdbLastSync: Date | null
  productionCount: number
}

interface Stats {
  totalArtists: number
  withFilmography: number
  withoutFilmography: number
  syncedRecently: number
  needsUpdate: number
}

export default function FilmographyAdminPage() {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'without' | 'outdated'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      // Load stats
      const statsRes = await fetch('/api/admin/filmography')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }

      // Load artists with filmography info
      // In a real implementation, this would be a dedicated API endpoint
      // For now, we'll use a client-side approach
      const artistsRes = await fetch('/api/artists') // Placeholder - needs implementation
      if (!artistsRes.ok) {
        // Fallback: redirect to main admin or show error
        console.error('Failed to load artists')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function syncArtist(artistId: string) {
    if (syncing) return

    try {
      setSyncing(artistId)
      const response = await fetch('/api/admin/filmography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistIds: [artistId],
          strategy: 'SMART_MERGE',
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`Filmografia sincronizada!\n\n${result.message}`)
        await loadData()
      } else {
        alert(`Erro: ${result.message || 'Falha na sincronização'}`)
      }
    } catch (error) {
      console.error('Sync error:', error)
      alert('Erro ao sincronizar filmografia')
    } finally {
      setSyncing(null)
    }
  }

  async function syncOutdated() {
    if (batchSyncing) return

    if (!confirm('Sincronizar filmografias desatualizadas?\n\nIsso pode levar alguns minutos.')) {
      return
    }

    try {
      setBatchSyncing(true)
      const response = await fetch('/api/admin/filmography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: 'INCREMENTAL',
          concurrency: 3,
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(
          `Sincronização em lote completa!\n\n` +
          `Sucesso: ${result.result.successCount}/${result.result.total}\n` +
          `Falhas: ${result.result.failureCount}\n` +
          `Duração: ${(result.result.duration / 1000).toFixed(1)}s`
        )
        await loadData()
      } else {
        alert(`Erro: ${result.message || 'Falha na sincronização em lote'}`)
      }
    } catch (error) {
      console.error('Batch sync error:', error)
      alert('Erro ao sincronizar filmografias')
    } finally {
      setBatchSyncing(false)
    }
  }

  function getStatusIcon(status: string | null) {
    switch (status) {
      case 'SYNCED':
        return <CheckCircle className="text-green-500" size={20} />
      case 'NOT_FOUND':
        return <XCircle className="text-yellow-500" size={20} />
      case 'ERROR':
        return <AlertCircle className="text-red-500" size={20} />
      default:
        return <Clock className="text-gray-500" size={20} />
    }
  }

  function getStatusText(status: string | null): string {
    switch (status) {
      case 'SYNCED':
        return 'Sincronizado'
      case 'NOT_FOUND':
        return 'Não encontrado no TMDB'
      case 'ERROR':
        return 'Erro'
      default:
        return 'Pendente'
    }
  }

  const filteredArtists = artists.filter(artist => {
    if (filter === 'without' && artist.productionCount > 0) return false
    if (filter === 'outdated' && artist.tmdbLastSync) {
      const daysSinceSync = Math.floor(
        (Date.now() - new Date(artist.tmdbLastSync).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceSync < 30) return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        artist.nameRomanized.toLowerCase().includes(query) ||
        artist.nameHangul?.toLowerCase().includes(query)
      )
    }

    return true
  })

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Film className="text-purple-500" size={40} />
              <h1 className="text-4xl md:text-5xl font-black text-white">Filmografias</h1>
            </div>
            <p className="text-xl text-zinc-400">Gerenciar filmografias de artistas via TMDB</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Total Artistas</p>
                <p className="text-3xl font-bold text-white">{stats.totalArtists}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Com Filmografia</p>
                <p className="text-3xl font-bold text-green-500">{stats.withFilmography}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Sem Filmografia</p>
                <p className="text-3xl font-bold text-yellow-500">{stats.withoutFilmography}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Atualizados (7d)</p>
                <p className="text-3xl font-bold text-blue-500">{stats.syncedRecently}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Precisam Atualizar</p>
                <p className="text-3xl font-bold text-orange-500">{stats.needsUpdate}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <button
                  onClick={syncOutdated}
                  disabled={batchSyncing}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <RefreshCw size={20} className={batchSyncing ? 'animate-spin' : ''} />
                  {batchSyncing ? 'Sincronizando...' : 'Sincronizar Desatualizados'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilter('without')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'without'
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Sem Filmografia
                </button>
                <button
                  onClick={() => setFilter('outdated')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === 'outdated'
                      ? 'bg-purple-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Desatualizados
                </button>
              </div>
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar artista..."
                className="w-full px-4 py-3 bg-black border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
            <p className="text-blue-400 text-center">
              <strong>Sistema Ativo:</strong> Filmografias são atualizadas automaticamente a cada 15 minutos via cron.
              <br />
              Use esta página para forçar sincronização manual quando necessário.
            </p>
          </div>

          {/* Placeholder for Artist List */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Lista de Artistas</h2>
            <p className="text-zinc-400 text-center py-8">
              A lista de artistas aparecerá aqui após implementar o endpoint <code className="bg-black px-2 py-1 rounded">/api/admin/artists</code>
            </p>
            <p className="text-zinc-500 text-sm text-center">
              Por enquanto, use o botão "Sincronizar Desatualizados" acima para atualizar filmografias em lote.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
