'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import { Plus, FlaskConical, CheckCircle, XCircle, Loader2, Eye, EyeOff, RefreshCw, Users, ImageOff } from 'lucide-react'
import Image from 'next/image'

interface LinkedArtist {
  id: string
  nameRomanized: string
  primaryImageUrl: string | null
}

interface NewsArtistLink {
  artistId: string
  artist: LinkedArtist
}

interface News {
  id: string
  title: string
  contentMd: string
  sourceUrl: string
  imageUrl: string | null
  publishedAt: Date
  tags: string[]
  isHidden: boolean
  createdAt: Date
  updatedAt: Date
  artists: NewsArtistLink[]
}

// ─── Per-news relink button ───────────────────────────────────────────────────

function RelinkButton({ newsId, onDone }: { newsId: string; onDone: (artists: LinkedArtist[]) => void }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  const handleRelink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('loading')
    try {
      const res = await fetch(`/api/admin/news/relink-artists?id=${newsId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setState('err'); return }
      onDone(data.artists.map((a: { id: string; name: string }) => ({
        id: a.id, nameRomanized: a.name, primaryImageUrl: null,
      })))
      setState('ok')
    } catch { setState('err') }
    finally { setTimeout(() => setState('idle'), 2500) }
  }

  return (
    <button
      onClick={handleRelink}
      disabled={state === 'loading'}
      title="Re-extrair artistas desta notícia"
      className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
        state === 'ok'  ? 'text-green-400 bg-green-400/10' :
        state === 'err' ? 'text-red-400 bg-red-400/10' :
        'text-zinc-400 hover:text-purple-300 hover:bg-purple-400/10'
      }`}
    >
      <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
    </button>
  )
}

// ─── Per-news refetch content button ─────────────────────────────────────────

function RefetchContentButton({ newsId }: { newsId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('loading')
    try {
      const res = await fetch(`/api/admin/news/refetch-content?id=${newsId}`, { method: 'POST' })
      const data = await res.json()
      setState(data.ok ? 'ok' : 'err')
    } catch { setState('err') }
    finally { setTimeout(() => setState('idle'), 2500) }
  }

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      title="Re-buscar conteúdo completo da fonte (restaura imagens)"
      className={`p-1.5 rounded transition-colors disabled:cursor-wait ${
        state === 'ok'  ? 'text-green-400 bg-green-400/10' :
        state === 'err' ? 'text-red-400 bg-red-400/10' :
        'text-zinc-400 hover:text-blue-300 hover:bg-blue-400/10'
      }`}
    >
      <ImageOff size={14} className={state === 'loading' ? 'animate-pulse' : ''} />
    </button>
  )
}

// ─── Artists cell ─────────────────────────────────────────────────────────────

function ArtistsCell({ artists }: { artists: NewsArtistLink[] }) {
  if (artists.length === 0) {
    return <span className="text-xs text-zinc-700 italic">nenhum</span>
  }
  const shown = artists.slice(0, 4)
  const extra = artists.length - shown.length
  return (
    <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
      {shown.map(({ artist }) => (
        <span
          key={artist.id}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-medium border border-purple-500/20"
          title={artist.nameRomanized}
        >
          {artist.primaryImageUrl ? (
            <Image
              src={artist.primaryImageUrl}
              alt={artist.nameRomanized}
              width={14}
              height={14}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full bg-purple-500/30 inline-flex items-center justify-center text-[8px] font-black flex-shrink-0">
              {artist.nameRomanized[0]}
            </span>
          )}
          <span className="truncate max-w-[70px]">{artist.nameRomanized}</span>
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-zinc-500 font-bold">+{extra}</span>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'title', label: 'Título', type: 'text', placeholder: 'Título da notícia', required: true },
  { key: 'contentMd', label: 'Conteúdo (Markdown)', type: 'textarea', placeholder: 'Conteúdo em Markdown', required: true },
  { key: 'sourceUrl', label: 'URL da Fonte', type: 'text', placeholder: 'https://...', required: true },
  { key: 'imageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://...' },
  { key: 'publishedAt', label: 'Data de Publicação', type: 'date' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Separar por vírgula (ex: k-drama, k-pop)' },
]

interface GenerateResult {
  success: boolean
  news?: { title: string; artistsCount: number; artists: { name: string }[] }
  error?: string
  duration?: number
}

interface BatchRelinkResult {
  ok: boolean
  processed: number
  linked: number
  skipped: number
  errors: number
}

interface BatchRefetchResult {
  ok: boolean
  processed: number
  updated: number
  skipped: number
  errors: number
  errorIds?: string[]
}

interface BatchRelinkResultEx extends BatchRelinkResult {
  errorIds?: string[]
}

const SOURCES = ['Soompi', 'Koreaboo', 'Dramabeans', 'Asian Junkie', 'HelloKpop', 'Kpopmap'] as const
type Source = typeof SOURCES[number]

export default function NewsAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)
  const [batchRelinking, setBatchRelinking] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchRelinkResultEx | null>(null)
  const [batchRefetching, setBatchRefetching] = useState(false)
  const [batchRefetchResult, setBatchRefetchResult] = useState<BatchRefetchResult | null>(null)

  // Por fonte
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [sourceRefetching, setSourceRefetching] = useState(false)
  const [sourceRelinking, setSourceRelinking] = useState(false)
  const [sourceRefetchResult, setSourceRefetchResult] = useState<BatchRefetchResult | null>(null)
  const [sourceRelinkResult, setSourceRelinkResult] = useState<BatchRelinkResultEx | null>(null)

  // Otimista: atualizar artistas localmente sem re-fetch completo
  const [localArtistsOverride, setLocalArtistsOverride] = useState<Record<string, LinkedArtist[]>>({})

  const columns: Column<News>[] = [
    {
      key: 'imageUrl',
      label: 'Img',
      render: (news) =>
        news.imageUrl ? (
          <Image
            src={news.imageUrl}
            alt={news.title}
            width={60}
            height={40}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="w-15 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">
            N/A
          </div>
        ),
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (news) => (
        <div className="max-w-xs">
          <p className="font-medium text-white truncate">{news.title}</p>
          <p className="text-xs text-zinc-500 truncate">{news.sourceUrl}</p>
        </div>
      ),
    },
    {
      key: 'artists',
      label: 'Artistas',
      render: (news) => {
        const artists = localArtistsOverride[news.id] != null
          ? localArtistsOverride[news.id].map(a => ({ artistId: a.id, artist: a }))
          : news.artists
        return <ArtistsCell artists={artists} />
      },
    },
    {
      key: 'publishedAt',
      label: 'Publicado',
      sortable: true,
      render: (news) => (
        <span className="text-sm text-zinc-400">
          {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (news) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {news.tags.slice(0, 3).map((tag, index) => (
            <span key={index} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
              {tag}
            </span>
          ))}
          {news.tags.length > 3 && (
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
              +{news.tags.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'isHidden',
      label: 'Status',
      render: (news) => news.isHidden
        ? <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs font-bold">Oculta</span>
        : <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">Visível</span>,
    },
  ]

  const handleCreate = () => {
    setEditingNews(null)
    setFormOpen(true)
  }

  const handleEdit = (news: News) => {
    setEditingNews(news)
    setFormOpen(true)
  }

  const handleDelete = (ids: string[]) => {
    setSelectedIds(ids)
    setDeleteOpen(true)
  }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (data.publishedAt && typeof data.publishedAt === 'string') {
      data.publishedAt = new Date(data.publishedAt).toISOString()
    }

    const url = editingNews ? `/api/admin/news?id=${editingNews.id}` : '/api/admin/news'
    const method = editingNews ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao salvar notícia')
    }

    refetchTable()
  }

  const handleGenerateOne = async () => {
    setGenerating(true)
    setGenerateResult(null)
    try {
      const res = await fetch('/api/admin/news/generate-one', { method: 'POST' })
      const data = await res.json()
      setGenerateResult(data)
      if (data.success) refetchTable()
    } catch {
      setGenerateResult({ success: false, error: 'Erro de rede' })
    } finally {
      setGenerating(false)
    }
  }

  const handleBatchRelink = async () => {
    setBatchRelinking(true)
    setBatchResult(null)
    try {
      const res = await fetch('/api/admin/news/relink-artists?mode=batch&limit=200', { method: 'POST' })
      const data = await res.json()
      setBatchResult(data)
      if (data.ok) refetchTable()
    } catch {
      setBatchResult({ ok: false, processed: 0, linked: 0, skipped: 0, errors: 1 })
    } finally {
      setBatchRelinking(false)
    }
  }

  const handleBatchRefetch = async () => {
    setBatchRefetching(true)
    setBatchRefetchResult(null)
    try {
      const res = await fetch('/api/admin/news/refetch-content?mode=batch&limit=50', { method: 'POST' })
      const data = await res.json()
      setBatchRefetchResult(data)
    } catch {
      setBatchRefetchResult({ ok: false, processed: 0, updated: 0, skipped: 0, errors: 1 })
    } finally {
      setBatchRefetching(false)
    }
  }

  const handleToggleHidden = async (news: News) => {
    await fetch(`/api/admin/news?id=${news.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden: !news.isHidden }),
    })
    refetchTable()
  }

  const handleSourceRefetch = async () => {
    if (!selectedSource) return
    setSourceRefetching(true)
    setSourceRefetchResult(null)
    try {
      const res = await fetch(
        `/api/admin/news/refetch-content?mode=batch&source=${encodeURIComponent(selectedSource)}&all=1&limit=200`,
        { method: 'POST' },
      )
      const data = await res.json()
      setSourceRefetchResult(data)
    } catch {
      setSourceRefetchResult({ ok: false, processed: 0, updated: 0, skipped: 0, errors: 1 })
    } finally {
      setSourceRefetching(false)
    }
  }

  const handleSourceRelink = async () => {
    if (!selectedSource) return
    setSourceRelinking(true)
    setSourceRelinkResult(null)
    try {
      const res = await fetch(
        `/api/admin/news/relink-artists?mode=batch&source=${encodeURIComponent(selectedSource)}&all=1&limit=500`,
        { method: 'POST' },
      )
      const data = await res.json()
      setSourceRelinkResult(data)
      if (data.ok) refetchTable()
    } catch {
      setSourceRelinkResult({ ok: false, processed: 0, linked: 0, skipped: 0, errors: 1 })
    } finally {
      setSourceRelinking(false)
    }
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao deletar notícias')
    }

    refetchTable()
  }

  return (
    <AdminLayout title="Notícias">
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-zinc-400">Gerencie notícias e artigos</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBatchRefetch}
              disabled={batchRefetching}
              title="Re-buscar conteúdo completo (imagens) de notícias sem imagens inline (até 50)"
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-lg hover:border-blue-500/50 hover:text-blue-300 transition-all disabled:opacity-50 text-sm"
            >
              {batchRefetching ? <Loader2 size={15} className="animate-spin" /> : <ImageOff size={15} />}
              {batchRefetching ? 'Re-buscando...' : 'Re-buscar conteúdo'}
            </button>
            <button
              onClick={handleBatchRelink}
              disabled={batchRelinking}
              title="Re-extrair artistas de notícias sem vínculos (até 200)"
              className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-bold rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
            >
              {batchRelinking ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
              {batchRelinking ? 'Re-vinculando...' : 'Re-extrair artistas'}
            </button>
            <button
              onClick={handleGenerateOne}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white font-bold rounded-lg hover:border-green-500 hover:text-green-400 transition-all disabled:opacity-50"
            >
              {generating ? <Loader2 size={18} className="animate-spin" /> : <FlaskConical size={18} />}
              {generating ? 'Gerando...' : 'Gerar 1 (Teste)'}
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all"
            >
              <Plus size={18} />
              Nova Notícia
            </button>
          </div>
        </div>

        {generateResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${generateResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {generateResult.success
              ? <CheckCircle size={20} className="text-green-400 mt-0.5 shrink-0" />
              : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div className="text-sm">
              {generateResult.success && generateResult.news ? (
                <>
                  <p className="font-bold text-white">{generateResult.news.title}</p>
                  <p className="text-zinc-400 mt-1">
                    {generateResult.news.artistsCount > 0
                      ? `Artistas: ${generateResult.news.artists.map(a => a.name).join(', ')}`
                      : 'Nenhum artista identificado'
                    }
                    {generateResult.duration && ` · ${(generateResult.duration / 1000).toFixed(1)}s`}
                  </p>
                </>
              ) : (
                <p className="text-red-400">{generateResult.error}</p>
              )}
            </div>
            <button onClick={() => setGenerateResult(null)} className="ml-auto text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {batchRefetchResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${batchRefetchResult.ok ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {batchRefetchResult.ok
              ? <CheckCircle size={20} className="text-blue-400 mt-0.5 shrink-0" />
              : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div className="text-sm">
              {batchRefetchResult.ok ? (
                <p className="text-zinc-300">
                  Re-fetch concluído — processadas: <strong>{batchRefetchResult.processed}</strong> · atualizadas: <strong className="text-blue-400">{batchRefetchResult.updated}</strong> · sem conteúdo: {batchRefetchResult.skipped} · erros: {batchRefetchResult.errors}
                </p>
              ) : (
                <p className="text-red-400">Erro no re-fetch em lote</p>
              )}
            </div>
            <button onClick={() => setBatchRefetchResult(null)} className="ml-auto text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {batchResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${batchResult.ok ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {batchResult.ok
              ? <CheckCircle size={20} className="text-purple-400 mt-0.5 shrink-0" />
              : <XCircle size={20} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div className="text-sm">
              {batchResult.ok ? (
                <p className="text-zinc-300">
                  Re-extração concluída — processadas: <strong>{batchResult.processed}</strong> · vinculadas: <strong className="text-purple-400">{batchResult.linked}</strong> · sem artistas: {batchResult.skipped} · erros: {batchResult.errors}
                </p>
              ) : (
                <p className="text-red-400">Erro na re-extração em lote</p>
              )}
            </div>
            <button onClick={() => setBatchResult(null)} className="ml-auto text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {/* ── Reprocessar por fonte ─────────────────────────────────────────── */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-zinc-300">Reprocessar por fonte</p>
            <div className="flex items-center gap-1 flex-wrap">
              {SOURCES.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSource(prev => prev === s ? null : s)
                    setSourceRefetchResult(null)
                    setSourceRelinkResult(null)
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors border ${
                    selectedSource === s
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {selectedSource && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSourceRefetch}
                  disabled={sourceRefetching || sourceRelinking}
                  title={`Re-buscar conteúdo de TODAS as notícias de ${selectedSource}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-blue-500/50 hover:text-blue-300 transition-all disabled:opacity-50 text-sm"
                >
                  {sourceRefetching ? <Loader2 size={14} className="animate-spin" /> : <ImageOff size={14} />}
                  {sourceRefetching ? 'Re-buscando...' : `Re-buscar conteúdo (${selectedSource})`}
                </button>
                <button
                  onClick={handleSourceRelink}
                  disabled={sourceRefetching || sourceRelinking}
                  title={`Re-extrair artistas de TODAS as notícias de ${selectedSource}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
                >
                  {sourceRelinking ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                  {sourceRelinking ? 'Re-vinculando...' : `Re-extrair artistas (${selectedSource})`}
                </button>
              </div>

              {sourceRefetchResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${sourceRefetchResult.ok ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  {sourceRefetchResult.ok
                    ? <CheckCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1">
                    {sourceRefetchResult.ok ? (
                      <p className="text-zinc-300">
                        Re-fetch <strong>{selectedSource}</strong> — processadas: <strong>{sourceRefetchResult.processed}</strong> · atualizadas: <strong className="text-blue-400">{sourceRefetchResult.updated}</strong> · sem conteúdo: {sourceRefetchResult.skipped} · erros: {sourceRefetchResult.errors}
                        {sourceRefetchResult.errorIds?.length ? (
                          <span className="ml-1 text-red-400">(IDs: {sourceRefetchResult.errorIds.join(', ')})</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-red-400">Erro no re-fetch de {selectedSource}</p>
                    )}
                  </div>
                  <button onClick={() => setSourceRefetchResult(null)} className="text-zinc-500 hover:text-white shrink-0">✕</button>
                </div>
              )}

              {sourceRelinkResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${sourceRelinkResult.ok ? 'bg-purple-500/10 border-purple-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                  {sourceRelinkResult.ok
                    ? <CheckCircle size={14} className="text-purple-400 mt-0.5 shrink-0" />
                    : <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  }
                  <div className="flex-1">
                    {sourceRelinkResult.ok ? (
                      <p className="text-zinc-300">
                        Re-extração <strong>{selectedSource}</strong> — processadas: <strong>{sourceRelinkResult.processed}</strong> · vínculos: <strong className="text-purple-400">{sourceRelinkResult.linked}</strong> · sem artistas: {sourceRelinkResult.skipped} · erros: {sourceRelinkResult.errors}
                        {sourceRelinkResult.errorIds?.length ? (
                          <span className="ml-1 text-red-400">(IDs: {sourceRelinkResult.errorIds.join(', ')})</span>
                        ) : null}
                      </p>
                    ) : (
                      <p className="text-red-400">Erro na re-extração de {selectedSource}</p>
                    )}
                  </div>
                  <button onClick={() => setSourceRelinkResult(null)} className="text-zinc-500 hover:text-white shrink-0">✕</button>
                </div>
              )}
            </div>
          )}
        </div>

        <DataTable<News>
          columns={columns}
          apiUrl="/api/admin/news"
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título ou conteúdo..."
          actions={(news) => (
            <div className="flex items-center gap-1">
              <RefetchContentButton newsId={news.id} />
              <RelinkButton
                newsId={news.id}
                onDone={(artists) => setLocalArtistsOverride(prev => ({ ...prev, [news.id]: artists }))}
              />
              <button
                onClick={() => handleToggleHidden(news)}
                title={news.isHidden ? 'Tornar visível' : 'Ocultar do site'}
                className={`p-1.5 rounded transition-colors ${
                  news.isHidden
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                }`}
              >
                {news.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          )}
        />
      </div>

      <FormModal
        title={editingNews ? 'Editar Notícia' : 'Nova Notícia'}
        fields={formFields}
        initialData={
          editingNews
            ? {
                ...editingNews,
                publishedAt: new Date(editingNews.publishedAt).toISOString().split('T')[0],
                tags: editingNews.tags,
              } as unknown as Record<string, unknown>
            : undefined
        }
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirm
        open={deleteOpen}
        count={selectedIds.length}
        entityName="notícia"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  )
}
