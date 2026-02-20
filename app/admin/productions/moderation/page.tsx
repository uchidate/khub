'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Film, AlertTriangle, CheckCircle, XCircle, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react'

type Production = {
  id: string
  titlePt: string
  titleKr: string | null
  type: string
  year: number | null
  synopsis: string | null
  imageUrl: string | null
  tmdbId: string | null
  tmdbType: string | null
  streamingPlatforms: string[]
  createdAt: Date | string
  flaggedAsNonKorean: boolean
  flaggedAt: Date | null | string
  _count: {
    artists: number
    userFavorites: number
  }
  suspicionScore: number
  suspicionReasons: string[]
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ProductionModerationPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filter, setFilter] = useState<'all' | 'suspicious' | 'recent' | 'flagged'>('suspicious')
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    fetchProductions()
  }, [filter])

  async function fetchProductions(page = 1) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/productions/moderation?filter=${filter}&page=${page}&limit=20`)
      const data = await res.json()

      if (res.ok) {
        setProductions(data.productions)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch productions:', data.error)
      }
    } catch (err: any) {
      console.error('Error fetching productions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(productionId: string, currentFlag: boolean) {
    if (actioningId) return

    const action = currentFlag ? 'desmarcar' : 'marcar'
    if (!confirm(`Tem certeza que deseja ${action} esta produção como não-relevante?`)) {
      return
    }

    setActioningId(productionId)
    try {
      const res = await fetch('/api/admin/productions/moderation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productionId,
          flaggedAsNonKorean: !currentFlag,
        }),
      })

      if (res.ok) {
        await fetchProductions(pagination?.page || 1)
      } else {
        const data = await res.json()
        alert(`Erro: ${data.error}`)
      }
    } catch (err: any) {
      console.error('Error toggling flag:', err)
      alert('Erro ao atualizar produção')
    } finally {
      setActioningId(null)
    }
  }

  async function deleteProduction(productionId: string, title: string) {
    if (actioningId) return

    if (!confirm(`⚠️ ATENÇÃO: Deletar permanentemente a produção "${title}"?\n\nEsta ação NÃO PODE ser desfeita!`)) {
      return
    }

    setActioningId(productionId)
    try {
      const res = await fetch(`/api/admin/productions/moderation?productionId=${productionId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchProductions(pagination?.page || 1)
      } else {
        const data = await res.json()
        alert(`Erro: ${data.error}`)
      }
    } catch (err: any) {
      console.error('Error deleting production:', err)
      alert('Erro ao deletar produção')
    } finally {
      setActioningId(null)
    }
  }

  function getSuspicionColor(score: number) {
    if (score >= 7) return 'border-red-500/30 bg-red-500/5'
    if (score >= 4) return 'border-yellow-500/30 bg-yellow-500/5'
    return 'border-green-500/30 bg-green-500/5'
  }

  function getSuspicionIcon(score: number) {
    if (score >= 7) return <XCircle className="w-5 h-5 text-red-500" />
    if (score >= 4) return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <CheckCircle className="w-5 h-5 text-green-500" />
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
            <Film className="text-purple-500" size={40} />
            <h1 className="text-4xl font-black text-white">Moderação de Produções</h1>
          </div>
          <p className="text-xl text-zinc-400">Revisar produções para relevância à cultura coreana</p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('suspicious')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'suspicious'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Suspeitas ({pagination?.total || 0})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'recent'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Recentes (7 dias)
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'flagged'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Marcadas
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        {/* Productions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : productions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <Film className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400 text-lg">Nenhuma produção encontrada</p>
            </div>
          ) : (
            productions.map((prod) => (
              <div
                key={prod.id}
                className={`border rounded-2xl p-6 ${getSuspicionColor(prod.suspicionScore)}`}
              >
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    {prod.imageUrl ? (
                      <Image
                        src={prod.imageUrl}
                        alt={prod.titlePt}
                        width={120}
                        height={180}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-[120px] h-[180px] bg-zinc-800 rounded-lg flex items-center justify-center">
                        <Film className="w-12 h-12 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          {getSuspicionIcon(prod.suspicionScore)}
                          <Link
                            href={`/productions/${prod.id}`}
                            target="_blank"
                            className="text-xl font-bold text-white hover:text-purple-400 transition-colors"
                          >
                            {prod.titlePt}
                          </Link>
                        </div>
                        {prod.titleKr && (
                          <p className="text-sm text-zinc-400 mb-1">{prod.titleKr}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="px-2 py-0.5 bg-zinc-800 rounded">{prod.type}</span>
                          {prod.year && <span>{prod.year}</span>}
                          {prod.tmdbId && (
                            <span className="text-blue-400">TMDB: {prod.tmdbId}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-white mb-1">
                          {prod.suspicionScore}
                        </div>
                        <div className="text-xs text-zinc-500">Suspeição</div>
                      </div>
                    </div>

                    {/* Synopsis */}
                    {prod.synopsis && (
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{prod.synopsis}</p>
                    )}

                    {/* Reasons */}
                    {prod.suspicionReasons.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-bold text-zinc-500 mb-1">Motivos:</p>
                        <div className="flex flex-wrap gap-2">
                          {prod.suspicionReasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                      <span>{prod._count.artists} artistas</span>
                      <span>•</span>
                      <span>{prod._count.userFavorites} favoritos</span>
                      <span>•</span>
                      <span>{prod.streamingPlatforms.length} plataformas</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => toggleFlag(prod.id, prod.flaggedAsNonKorean)}
                        disabled={actioningId === prod.id}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                          prod.flaggedAsNonKorean
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        {prod.flaggedAsNonKorean ? '✓ Desmarcar' : '✗ Marcar como Não-Relevante'}
                      </button>

                      <button
                        onClick={() => deleteProduction(prod.id, prod.titlePt)}
                        disabled={actioningId === prod.id}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => fetchProductions(page)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  page === pagination.page
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
