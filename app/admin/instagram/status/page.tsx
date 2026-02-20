'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Instagram, CheckCircle, XCircle, Clock, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

type Stats = {
  totalArtists: number
  totalPosts: number
  artistsWithFeed: number
  artistsWithPosts: number
  artistsWithoutPosts: number
  artistsNeverSynced: number
  artistsWithInstagramButNoFeed: number
}

type ArtistWithFeed = {
  id: string
  name: string
  feedUrl: string
  lastSync: string | null
  postsCount: number
  status: 'ok' | 'synced_no_posts' | 'never_synced'
}

export default function InstagramStatusPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [artists, setArtists] = useState<ArtistWithFeed[]>([])

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/instagram/status')
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setStats(data.stats)
      setArtists(data.artistsWithFeed)
    } catch (err: any) {
      console.error('Failed to fetch status:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'synced_no_posts':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'never_synced':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-zinc-500" />
    }
  }

  function getStatusText(status: string) {
    switch (status) {
      case 'ok':
        return 'OK'
      case 'synced_no_posts':
        return 'Sincronizado mas sem posts'
      case 'never_synced':
        return 'Nunca sincronizado'
      default:
        return 'Desconhecido'
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ok':
        return 'border-green-500/20 bg-green-500/5'
      case 'synced_no_posts':
        return 'border-yellow-500/20 bg-yellow-500/5'
      case 'never_synced':
        return 'border-red-500/20 bg-red-500/5'
      default:
        return 'border-zinc-700 bg-zinc-900'
    }
  }

  function formatDate(date: string | null) {
    if (!date) return 'Nunca'
    const d = new Date(date)
    const now = Date.now()
    const diff = now - d.getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Menos de 1h atrás'
    if (hours < 24) return `${hours}h atrás`
    return `${days}d atrás`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-6 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Voltar ao Admin
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Instagram className="text-pink-500" size={40} />
            <h1 className="text-4xl font-black text-white">Status Instagram</h1>
          </div>
          <p className="text-xl text-zinc-400">Diagnóstico de sincronização de posts</p>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-1">Total de Posts</p>
              <p className="text-3xl font-black text-white">{stats.totalPosts}</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-1">Com Feed</p>
              <p className="text-3xl font-black text-white">{stats.artistsWithFeed}</p>
            </div>
            <div className="bg-zinc-900 border border-green-500/20 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-1">Com Posts</p>
              <p className="text-3xl font-black text-green-500">{stats.artistsWithPosts}</p>
            </div>
            <div className="bg-zinc-900 border border-red-500/20 rounded-2xl p-5">
              <p className="text-sm text-zinc-500 mb-1">Sem Posts</p>
              <p className="text-3xl font-black text-red-500">{stats.artistsWithoutPosts}</p>
            </div>
          </div>
        )}

        {/* Artists List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Artistas com Feed Configurado</h2>
            <button
              onClick={fetchStatus}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          <div className="space-y-3">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className={`border rounded-xl p-4 ${getStatusColor(artist.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(artist.status)}
                    <div>
                      <Link
                        href={`/artists/${artist.id}`}
                        target="_blank"
                        className="font-bold text-white hover:text-purple-400 transition-colors"
                      >
                        {artist.name}
                      </Link>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {getStatusText(artist.status)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-zinc-500">Posts</p>
                      <p className="font-bold text-white">{artist.postsCount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-zinc-500">Última Sync</p>
                      <p className="font-bold text-white">{formatDate(artist.lastSync)}</p>
                    </div>
                    <Link
                      href={`/admin/artists/${artist.id}/instagram-feed`}
                      className="text-purple-500 hover:text-purple-400 text-sm font-medium"
                    >
                      Configurar →
                    </Link>
                  </div>
                </div>

                {artist.status === 'synced_no_posts' && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      ⚠️ Feed foi sincronizado mas não retornou posts. Verifique se a URL do RSS.app está correta.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {artists.length === 0 && (
            <div className="text-center py-12">
              <Instagram className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500">Nenhum artista com feed configurado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
