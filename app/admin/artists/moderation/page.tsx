'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Shield, AlertTriangle, CheckCircle, XCircle, Trash2, RefreshCw, ArrowLeft } from 'lucide-react'

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
  _count: {
    productions: number
    memberships: number
  }
}

type Filter = 'suspicious' | 'recent' | 'flagged' | 'all'

export default function ArtistModerationPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('suspicious')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchArtists()
  }, [filter, page])

  async function fetchArtists() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/artists/moderation?filter=${filter}&page=${page}&limit=20`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to fetch artists')

      setArtists(data.artists)
      setTotalPages(data.pagination.pages)
    } catch (err: any) {
      console.error('Failed to fetch artists:', err)
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(artistId: string, currentFlag: boolean) {
    setProcessing(artistId)
    setMessage(null)

    try {
      const res = await fetch('/api/admin/artists/moderation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          flaggedAsNonKorean: !currentFlag,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to update artist')

      setMessage({
        type: 'success',
        text: !currentFlag ? 'Artista marcado como não-relevante' : 'Artista desmarcado',
      })

      // Atualizar lista
      await fetchArtists()
    } catch (err: any) {
      console.error('Failed to toggle flag:', err)
      setMessage({ type: 'error', text: err.message })
    } finally {
      setProcessing(null)
    }
  }

  async function deleteArtist(artistId: string, artistName: string) {
    if (!confirm(`Tem certeza que deseja remover permanentemente "${artistName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setProcessing(artistId)
    setMessage(null)

    try {
      const res = await fetch(`/api/admin/artists/moderation?artistId=${artistId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to delete artist')

      setMessage({ type: 'success', text: `Artista "${artistName}" removido com sucesso` })

      // Atualizar lista
      await fetchArtists()
    } catch (err: any) {
      console.error('Failed to delete artist:', err)
      setMessage({ type: 'error', text: err.message })
    } finally {
      setProcessing(null)
    }
  }

  function getSuspicionColor(score: number): string {
    if (score >= 8) return 'text-red-500'
    if (score >= 5) return 'text-orange-500'
    if (score >= 3) return 'text-yellow-500'
    return 'text-green-500'
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
            <Shield className="text-purple-500" size={40} />
            <h1 className="text-4xl font-black text-white">Moderação de Artistas</h1>
          </div>
          <p className="text-xl text-zinc-400">
            Revise e gerencie artistas com relevância duvidosa para a cultura coreana
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`border rounded-xl p-4 flex items-start gap-3 mb-6 ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'suspicious', label: 'Suspeitos', icon: AlertTriangle },
              { value: 'recent', label: 'Recentes (7 dias)', icon: RefreshCw },
              { value: 'flagged', label: 'Marcados', icon: XCircle },
              { value: 'all', label: 'Todos', icon: Shield },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setFilter(value as Filter)
                  setPage(1)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === value
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Artists List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : artists.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum artista encontrado</h3>
            <p className="text-zinc-400">
              {filter === 'suspicious'
                ? 'Não há artistas suspeitos no momento'
                : filter === 'recent'
                ? 'Não há artistas adicionados recentemente'
                : filter === 'flagged'
                ? 'Não há artistas marcados como não-relevantes'
                : 'Não há artistas cadastrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                    {artist.primaryImageUrl ? (
                      <img
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Shield size={32} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white">{artist.nameRomanized}</h3>
                        {artist.nameHangul && (
                          <p className="text-sm text-zinc-400">{artist.nameHangul}</p>
                        )}
                      </div>
                      {filter === 'suspicious' && (
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full ${getSuspicionColor(
                            artist.suspicionScore
                          )} bg-zinc-800`}
                        >
                          <AlertTriangle size={14} />
                          <span className="text-sm font-bold">Score: {artist.suspicionScore}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <span className="text-zinc-500">Local de nascimento: </span>
                        <span className="text-zinc-300">
                          {artist.placeOfBirth || (
                            <span className="text-red-400">Não informado</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Produções: </span>
                        <span className="text-zinc-300">{artist._count.productions}</span>
                        <span className="text-zinc-500"> | Grupos: </span>
                        <span className="text-zinc-300">{artist._count.memberships}</span>
                      </div>
                    </div>

                    {artist.suspicionReasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {artist.suspicionReasons.map((reason, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    {artist.bio && (
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-3">{artist.bio}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFlag(artist.id, artist.flaggedAsNonKorean)}
                        disabled={processing === artist.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          artist.flaggedAsNonKorean
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {processing === artist.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : artist.flaggedAsNonKorean ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {artist.flaggedAsNonKorean ? 'Desmarcar' : 'Marcar como Não-Relevante'}
                      </button>

                      <button
                        onClick={() => deleteArtist(artist.id, artist.nameRomanized)}
                        disabled={processing === artist.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>

                      <Link
                        href={`/artists/${artist.id}`}
                        target="_blank"
                        className="text-purple-500 hover:text-purple-400 text-sm underline"
                      >
                        Ver Página →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="text-white">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
