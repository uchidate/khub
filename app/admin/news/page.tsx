'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import {
  Plus, FlaskConical, CheckCircle, XCircle, Loader2,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  source: string | null
  imageUrl: string | null
  publishedAt: Date
  tags: string[]
  isHidden: boolean
  contentType: string | null
  readingTimeMin: number | null
  createdAt: Date
  updatedAt: Date
  artists: NewsArtistLink[]
}

// ─── Display config ───────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Soompi:         { bg: 'bg-purple-500/15', text: 'text-purple-300',  border: 'border-purple-500/30' },
  Koreaboo:       { bg: 'bg-pink-500/15',   text: 'text-pink-300',    border: 'border-pink-500/30'   },
  Dramabeans:     { bg: 'bg-blue-500/15',   text: 'text-blue-300',    border: 'border-blue-500/30'   },
  'Asian Junkie': { bg: 'bg-amber-500/15',  text: 'text-amber-300',   border: 'border-amber-500/30'  },
  HelloKpop:      { bg: 'bg-emerald-500/15',text: 'text-emerald-300', border: 'border-emerald-500/30'},
  Kpopmap:        { bg: 'bg-violet-500/15', text: 'text-violet-300',  border: 'border-violet-500/30' },
}

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  debut:         { bg: 'bg-cyan-500/10',    text: 'text-cyan-300'    },
  comeback:      { bg: 'bg-pink-500/10',    text: 'text-pink-300'    },
  mv:            { bg: 'bg-red-500/10',     text: 'text-red-300'     },
  concert:       { bg: 'bg-orange-500/10',  text: 'text-orange-300'  },
  award:         { bg: 'bg-yellow-500/10',  text: 'text-yellow-300'  },
  collaboration: { bg: 'bg-teal-500/10',    text: 'text-teal-300'    },
  drama:         { bg: 'bg-blue-500/10',    text: 'text-blue-300'    },
  interview:     { bg: 'bg-violet-500/10',  text: 'text-violet-300'  },
  scandal:       { bg: 'bg-rose-500/10',    text: 'text-rose-300'    },
  general:       { bg: 'bg-zinc-700/50',    text: 'text-zinc-400'    },
}

const SOURCES = ['Soompi', 'Koreaboo', 'Dramabeans', 'Asian Junkie', 'HelloKpop', 'Kpopmap'] as const
type Source = typeof SOURCES[number]

// ─── Components ───────────────────────────────────────────────────────────────

/** Single unified reprocess button (content + artists + notifications) */
function ReprocessButton({
  newsId,
  onDone,
}: {
  newsId: string
  onDone: (artists: LinkedArtist[]) => void
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle')

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setState('loading')
    try {
      const res = await fetch(`/api/admin/news/reprocess?id=${newsId}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) { setState('err'); return }
      onDone(
        (data.artists ?? []).map((a: { id: string; name: string }) => ({
          id: a.id, nameRomanized: a.name, primaryImageUrl: null,
        }))
      )
      setState('ok')
    } catch { setState('err') }
    finally { setTimeout(() => setState('idle'), 2500) }
  }

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      title="Reprocessar — re-busca conteúdo, atualiza campos e re-extrai artistas"
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

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-zinc-700 text-xs italic">—</span>
  const c = SOURCE_COLORS[source] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {source}
    </span>
  )
}

function ContentTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-zinc-700 text-xs italic">—</span>
  const c = CONTENT_TYPE_COLORS[type] ?? CONTENT_TYPE_COLORS.general
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium capitalize ${c.bg} ${c.text}`}>
      {type}
    </span>
  )
}

function ArtistsCell({ artists }: { artists: NewsArtistLink[] }) {
  if (artists.length === 0) return <span className="text-xs text-zinc-700 italic">nenhum</span>
  const shown = artists.slice(0, 3)
  const extra = artists.length - shown.length
  return (
    <div className="flex items-center gap-1 flex-wrap max-w-[180px]">
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
          <span className="truncate max-w-[65px]">{artist.nameRomanized}</span>
        </span>
      ))}
      {extra > 0 && <span className="text-[10px] text-zinc-500 font-bold">+{extra}</span>}
    </div>
  )
}

/** Inline toast-style result banner */
function ResultBanner({
  result,
  color,
  message,
  onClose,
}: {
  result: Record<string, unknown>
  color: 'blue' | 'purple' | 'green'
  message: string
  onClose: () => void
}) {
  const ok = result.ok as boolean
  const colorMap = {
    blue:   { icon: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
    purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
    green:  { icon: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30'  },
  }
  const { icon, bg, border } = ok ? colorMap[color] : { icon: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bg} ${border} text-sm`}>
      {ok
        ? <CheckCircle size={16} className={`${icon} mt-0.5 shrink-0`} />
        : <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
      }
      <p className="flex-1 text-zinc-300">{ok ? message : 'Erro na operação'}</p>
      <button onClick={onClose} className="text-zinc-500 hover:text-white shrink-0 text-xs">✕</button>
    </div>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'title',      label: 'Título',              type: 'text',     placeholder: 'Título da notícia',  required: true },
  { key: 'contentMd',  label: 'Conteúdo (Markdown)', type: 'textarea', placeholder: 'Conteúdo em Markdown', required: true },
  { key: 'sourceUrl',  label: 'URL da Fonte',        type: 'text',     placeholder: 'https://...',          required: true },
  { key: 'imageUrl',   label: 'URL da Imagem',       type: 'text',     placeholder: 'https://...' },
  { key: 'publishedAt',label: 'Data de Publicação',  type: 'date' },
  { key: 'tags',       label: 'Tags',                type: 'tags',     placeholder: 'Separar por vírgula (ex: k-drama, k-pop)' },
]

// ─── Batch result types ───────────────────────────────────────────────────────

interface BatchResult extends Record<string, unknown> {
  ok: boolean
  processed: number
  updated?: number
  linked?: number
  skipped: number
  errors: number
  errorIds?: string[]
}

interface GenerateResult {
  success: boolean
  news?: { title: string; artistsCount: number; artists: { name: string }[] }
  error?: string
  duration?: number
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewsAdminPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Generate one
  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

  // Batch reprocess (candidates)
  const [batchProcessing, setBatchProcessing] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)

  // Per-source section
  const [sourceOpen, setSourceOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [sourceProcessing, setSourceProcessing] = useState(false)
  const [sourceResult, setSourceResult] = useState<BatchResult | null>(null)

  // Optimistic artist override
  const [localArtistsOverride, setLocalArtistsOverride] = useState<Record<string, LinkedArtist[]>>({})

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns: Column<News>[] = [
    {
      key: 'imageUrl',
      label: '',
      render: (news) =>
        news.imageUrl ? (
          <Image
            src={news.imageUrl}
            alt={news.title}
            width={56}
            height={38}
            className="rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-9 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] text-zinc-600 font-bold">SEM IMG</span>
          </div>
        ),
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (news) => (
        <div className="max-w-xs">
          <p className="font-medium text-white leading-snug line-clamp-2">{news.title}</p>
          <p className="text-[11px] text-zinc-600 truncate mt-0.5">{news.sourceUrl}</p>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Fonte',
      render: (news) => <SourceBadge source={news.source} />,
    },
    {
      key: 'contentType',
      label: 'Tipo',
      render: (news) => <ContentTypeBadge type={news.contentType} />,
    },
    {
      key: 'artists',
      label: 'Artistas',
      render: (news) => {
        const overridden = localArtistsOverride[news.id]
        const artists = overridden != null
          ? overridden.map(a => ({ artistId: a.id, artist: a }))
          : news.artists
        return <ArtistsCell artists={artists} />
      },
    },
    {
      key: 'publishedAt',
      label: 'Publicado',
      sortable: true,
      render: (news) => (
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {new Date(news.publishedAt).toLocaleDateString('pt-BR')}
        </span>
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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (data.publishedAt && typeof data.publishedAt === 'string') {
      data.publishedAt = new Date(data.publishedAt).toISOString()
    }
    const url = editingNews ? `/api/admin/news?id=${editingNews.id}` : '/api/admin/news'
    const res = await fetch(url, {
      method: editingNews ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const e = await res.json()
      throw new Error(e.error || 'Erro ao salvar notícia')
    }
    refetchTable()
  }

  const handleDeleteConfirm = async () => {
    const res = await fetch('/api/admin/news', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds }),
    })
    if (!res.ok) {
      const e = await res.json()
      throw new Error(e.error || 'Erro ao deletar notícias')
    }
    refetchTable()
  }

  const handleToggleHidden = async (news: News) => {
    await fetch(`/api/admin/news?id=${news.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden: !news.isHidden }),
    })
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

  /** Reprocess candidates (no content/short content) using the full pipeline */
  const handleBatchReprocess = async () => {
    setBatchProcessing(true)
    setBatchResult(null)
    try {
      const res = await fetch('/api/admin/news/reprocess?mode=batch&limit=50', { method: 'POST' })
      const data = await res.json()
      setBatchResult(data)
      if (data.ok) refetchTable()
    } catch {
      setBatchResult({ ok: false, processed: 0, skipped: 0, errors: 1 })
    } finally {
      setBatchProcessing(false)
    }
  }

  /** Reprocess ALL news from selected source using the full pipeline */
  const handleSourceReprocess = async () => {
    if (!selectedSource) return
    setSourceProcessing(true)
    setSourceResult(null)
    try {
      const res = await fetch(
        `/api/admin/news/reprocess?mode=batch&source=${encodeURIComponent(selectedSource)}&all=1&limit=200`,
        { method: 'POST' },
      )
      const data = await res.json()
      setSourceResult(data)
      if (data.ok) refetchTable()
    } catch {
      setSourceResult({ ok: false, processed: 0, skipped: 0, errors: 1 })
    } finally {
      setSourceProcessing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Notícias">
      <div className="space-y-5">

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-zinc-400 text-sm">Gerencie notícias e artigos do HallyuHub</p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleBatchReprocess}
              disabled={batchProcessing}
              title="Reprocessar pipeline completo em notícias candidatas (sem imagem / conteúdo curto)"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
            >
              {batchProcessing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {batchProcessing ? 'Reprocessando...' : 'Reprocessar candidatos'}
            </button>
            <button
              onClick={handleGenerateOne}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-white font-medium rounded-lg hover:border-green-500/50 hover:text-green-400 transition-all disabled:opacity-50 text-sm"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
              {generating ? 'Gerando...' : 'Gerar 1'}
            </button>
            <button
              onClick={() => { setEditingNews(null); setFormOpen(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-sm"
            >
              <Plus size={16} />
              Nova Notícia
            </button>
          </div>
        </div>

        {/* ── Result banners ───────────────────────────────────────────────── */}
        {generateResult && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${generateResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {generateResult.success
              ? <CheckCircle size={18} className="text-green-400 mt-0.5 shrink-0" />
              : <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            }
            <div className="text-sm flex-1">
              {generateResult.success && generateResult.news ? (
                <>
                  <p className="font-bold text-white">{generateResult.news.title}</p>
                  <p className="text-zinc-400 mt-0.5">
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
            <button onClick={() => setGenerateResult(null)} className="text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {batchResult && (
          <ResultBanner
            result={batchResult}
            color="purple"
            message={`Reprocessamento concluído — processadas: ${batchResult.processed} · atualizadas: ${batchResult.updated ?? 0} · sem conteúdo: ${batchResult.skipped} · erros: ${batchResult.errors}`}
            onClose={() => setBatchResult(null)}
          />
        )}

        {/* ── Por fonte ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <button
            onClick={() => { setSourceOpen(o => !o); setSourceResult(null) }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition-colors"
          >
            <span>Reprocessar por fonte</span>
            {sourceOpen ? <ChevronUp size={15} className="text-zinc-500" /> : <ChevronDown size={15} className="text-zinc-500" />}
          </button>

          {sourceOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
              {/* Source selector */}
              <div className="flex items-center gap-1.5 flex-wrap pt-3">
                {SOURCES.map(s => {
                  const c = SOURCE_COLORS[s]
                  const active = selectedSource === s
                  return (
                    <button
                      key={s}
                      onClick={() => { setSelectedSource(prev => prev === s ? null : s); setSourceResult(null) }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors border ${
                        active && c
                          ? `${c.bg} ${c.text} ${c.border}`
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>

              {selectedSource && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSourceReprocess}
                      disabled={sourceProcessing}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
                    >
                      {sourceProcessing
                        ? <Loader2 size={14} className="animate-spin" />
                        : <RefreshCw size={14} />
                      }
                      {sourceProcessing
                        ? `Reprocessando ${selectedSource}...`
                        : `Reprocessar todas de ${selectedSource} (pipeline completo)`
                      }
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-600">
                    Re-busca conteúdo, recalcula campos e re-extrai artistas para todas as notícias de {selectedSource}.
                  </p>

                  {sourceResult && (
                    <ResultBanner
                      result={sourceResult}
                      color="purple"
                      message={`${selectedSource} — processadas: ${sourceResult.processed} · atualizadas: ${sourceResult.updated ?? 0} · sem conteúdo: ${sourceResult.skipped} · erros: ${sourceResult.errors}${sourceResult.errorIds?.length ? ` (IDs: ${sourceResult.errorIds.join(', ')})` : ''}`}
                      onClose={() => setSourceResult(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <DataTable<News>
          columns={columns}
          apiUrl="/api/admin/news"
          onEdit={(news) => { setEditingNews(news); setFormOpen(true) }}
          onDelete={(ids) => { setSelectedIds(ids); setDeleteOpen(true) }}
          searchPlaceholder="Buscar por título ou conteúdo..."
          actions={(news) => (
            <div className="flex items-center gap-1">
              <ReprocessButton
                newsId={news.id}
                onDone={(artists) =>
                  setLocalArtistsOverride(prev => ({ ...prev, [news.id]: artists }))
                }
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleHidden(news) }}
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
