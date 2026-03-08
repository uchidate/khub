'use client'

import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { DeleteConfirm } from '@/components/admin/DeleteConfirm'
import {
  Plus, FlaskConical, CheckCircle, XCircle, Loader2,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Download,
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

// ─── Streaming state ──────────────────────────────────────────────────────────

type StreamResult = 'updated' | 'skipped' | 'exists' | 'error'

interface StreamLogEntry {
  title: string
  result: StreamResult
  artistCount: number
}

interface StreamProgress {
  phase: 'running' | 'done' | 'error'
  label: string
  total: number
  current: number
  updated: number
  skipped: number
  exists: number
  errors: number
  log: StreamLogEntry[]
}

// ─── BatchProgressPanel ───────────────────────────────────────────────────────

function BatchProgressPanel({
  progress,
  onClose,
}: {
  progress: StreamProgress
  onClose: () => void
}) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const isDone = progress.phase === 'done'
  const isError = progress.phase === 'error'

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      isError
        ? 'border-red-500/30 bg-red-500/5'
        : isDone
        ? 'border-green-500/30 bg-green-500/5'
        : 'border-purple-500/30 bg-purple-500/5'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {isError ? (
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
        ) : isDone ? (
          <CheckCircle size={16} className="text-green-400 shrink-0" />
        ) : (
          <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <span className="text-sm font-semibold text-white truncate">
              {isError
                ? 'Erro no reprocessamento'
                : isDone
                ? `Concluído — ${progress.label}`
                : progress.label}
            </span>
            <span className="text-xs text-zinc-400 shrink-0 font-mono">
              {progress.current}/{progress.total}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isError ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-purple-500'
              }`}
              style={{ width: `${isDone ? 100 : pct}%` }}
            />
          </div>
        </div>

        {isDone || isError ? (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-xs shrink-0 ml-1"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 pb-2 text-xs flex-wrap">
        <span className="flex items-center gap-1 text-green-400">
          <CheckCircle size={11} />
          <strong>{progress.updated}</strong> atualizadas
        </span>
        {progress.exists > 0 && (
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-full border border-blue-500/50 inline-block" />
            <strong>{progress.exists}</strong> já existem
          </span>
        )}
        {progress.skipped > 0 && (
          <span className="flex items-center gap-1 text-zinc-500">
            <span className="w-2.5 h-2.5 rounded-full border border-zinc-600 inline-block" />
            <strong>{progress.skipped}</strong> sem conteúdo
          </span>
        )}
        <span className="flex items-center gap-1 text-red-400">
          <XCircle size={11} />
          <strong>{progress.errors}</strong> erros
        </span>
        {!isDone && !isError && (
          <span className="ml-auto text-zinc-500 font-mono">{pct}%</span>
        )}
      </div>

      {/* Live log */}
      {progress.log.length > 0 && (
        <div className="border-t border-white/5 max-h-48 overflow-y-auto">
          {[...progress.log].reverse().map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 px-4 py-1.5 border-b border-white/[0.03] last:border-0"
            >
              <span className={`mt-0.5 shrink-0 ${
                entry.result === 'updated' ? 'text-green-400' :
                entry.result === 'exists'  ? 'text-blue-500' :
                entry.result === 'skipped' ? 'text-zinc-600' :
                'text-red-400'
              }`}>
                {entry.result === 'updated' ? '✓' : entry.result === 'exists' ? '=' : entry.result === 'skipped' ? '—' : '✕'}
              </span>
              <span className="text-xs text-zinc-400 leading-snug truncate flex-1">
                {entry.title}
              </span>
              {entry.result === 'updated' && entry.artistCount > 0 && (
                <span className="text-[10px] text-purple-400 shrink-0">
                  +{entry.artistCount} artista{entry.artistCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

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

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'title',      label: 'Título',              type: 'text',     placeholder: 'Título da notícia',  required: true },
  { key: 'contentMd',  label: 'Conteúdo (Markdown)', type: 'textarea', placeholder: 'Conteúdo em Markdown', required: true },
  { key: 'sourceUrl',  label: 'URL da Fonte',        type: 'text',     placeholder: 'https://...',          required: true },
  { key: 'imageUrl',   label: 'URL da Imagem',       type: 'text',     placeholder: 'https://...' },
  { key: 'publishedAt',label: 'Data de Publicação',  type: 'date' },
  { key: 'tags',       label: 'Tags',                type: 'tags',     placeholder: 'Separar por vírgula (ex: k-drama, k-pop)' },
]

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

  const [generating, setGenerating] = useState(false)
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null)

  // Streaming batch progress
  const [streamProgress, setStreamProgress] = useState<StreamProgress | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Per-source section
  const [sourceOpen, setSourceOpen] = useState(false)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [sourceCount, setSourceCount] = useState<number | null>(null)
  const [sourceTotal, setSourceTotal] = useState<number>(200)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  // null = loading, number = ok, -1 = error
  const [availableCount, setAvailableCount] = useState<number | null>(null)

  // Optimistic artist override
  const [localArtistsOverride, setLocalArtistsOverride] = useState<Record<string, LinkedArtist[]>>({})

  // Buscar contagem (DB) e disponíveis (WP API) ao selecionar fonte ou mudar período
  useEffect(() => {
    if (!selectedSource) { setSourceCount(null); setAvailableCount(null); return }
    setSourceCount(null)
    setAvailableCount(null)

    const params = new URLSearchParams({ source: selectedSource })
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    // Contagem de artigos no banco
    fetch(`/api/admin/news/reprocess?${params}`)
      .then(r => r.json())
      .then(d => {
        setSourceCount(d.count ?? null)
        setSourceTotal(d.count ?? 200)
      })
      .catch(() => setSourceCount(null))

    // Contagem de artigos disponíveis na fonte (só quando há filtro de data)
    if (dateFrom || dateTo) {
      fetch(`/api/admin/news/import?${params}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(d => setAvailableCount(typeof d.available === 'number' ? d.available : -1))
        .catch(() => setAvailableCount(-1))  // -1 = API indisponível
    }
  }, [selectedSource, dateFrom, dateTo])

  // ── SSE streaming helper ───────────────────────────────────────────────────

  const runStreamingBatch = async (url: string, label: string) => {
    // Abort any in-progress stream
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStreamProgress({
      phase: 'running',
      label,
      total: 0,
      current: 0,
      updated: 0,
      skipped: 0,
      exists: 0,
      errors: 0,
      log: [],
    })

    try {
      const res = await fetch(url, { method: 'POST', signal: controller.signal })

      if (!res.ok || !res.body) {
        setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'start') {
              setStreamProgress(prev => prev ? { ...prev, total: event.total } : null)

            } else if (event.type === 'item') {
              const entry: StreamLogEntry = {
                title: event.title,
                result: event.result,
                artistCount: event.artistCount ?? 0,
              }
              setStreamProgress(prev => {
                if (!prev) return null
                return {
                  ...prev,
                  current: event.current,
                  total: event.total,
                  updated: prev.updated + (event.result === 'updated' ? 1 : 0),
                  skipped: prev.skipped + (event.result === 'skipped' ? 1 : 0),
                  errors:  prev.errors  + (event.result === 'error'   ? 1 : 0),
                  log: [...prev.log, entry].slice(-100), // keep last 100
                }
              })

            } else if (event.type === 'done') {
              setStreamProgress(prev => prev ? {
                ...prev,
                phase: 'done',
                current: prev.total,
                updated: event.updated,
                skipped: event.skipped,
                errors: event.errors,
              } : null)
              refetchTable()

            } else if (event.type === 'error') {
              setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
            }
          } catch {
            // malformed event — skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
      }
    }
  }

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

  const handleBatchReprocess = () =>
    runStreamingBatch(
      '/api/admin/news/reprocess?mode=batch&limit=50&stream=1',
      'Reprocessando candidatos...',
    )

  /** Processa em lotes de 200 até atingir o total escolhido */
  const handleSourceReprocess = async () => {
    if (!selectedSource) return
    const total = sourceTotal
    const BATCH = 200

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStreamProgress({
      phase: 'running',
      label: `Reprocessando ${selectedSource}...`,
      total,
      current: 0,
      updated: 0,
      skipped: 0,
      exists: 0,
      errors: 0,
      log: [],
    })

    let offset = 0
    let accumUpdated = 0, accumSkipped = 0, accumErrors = 0

    while (offset < total && !controller.signal.aborted) {
      const limit = Math.min(BATCH, total - offset)
      const batchParams = new URLSearchParams({
          mode: 'batch',
          source: selectedSource,
          all: '1',
          limit: String(limit),
          offset: String(offset),
          stream: '1',
        })
        if (dateFrom) batchParams.set('dateFrom', dateFrom)
        if (dateTo) batchParams.set('dateTo', dateTo)
        const url = `/api/admin/news/reprocess?${batchParams}`

      let batchUpdated = 0, batchSkipped = 0, batchErrors = 0
      let batchDone = false

      try {
        const res = await fetch(url, { method: 'POST', signal: controller.signal })
        if (!res.ok || !res.body) {
          setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!batchDone) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'item') {
                if (event.result === 'updated') batchUpdated++
                else if (event.result === 'skipped') batchSkipped++
                else if (event.result === 'error') batchErrors++

                const entry: StreamLogEntry = { title: event.title, result: event.result, artistCount: event.artistCount ?? 0 }
                const au = accumUpdated + batchUpdated
                const as_ = accumSkipped + batchSkipped
                const ae = accumErrors + batchErrors
                setStreamProgress(prev => prev ? {
                  ...prev,
                  current: offset + event.current,
                  updated: au,
                  skipped: as_,
                  errors: ae,
                  log: [...prev.log, entry].slice(-100),
                } : null)

              } else if (event.type === 'done') {
                batchDone = true
              } else if (event.type === 'error') {
                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                return
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
        }
        return
      }

      accumUpdated += batchUpdated
      accumSkipped += batchSkipped
      accumErrors += batchErrors
      offset += limit
    }

    setStreamProgress(prev => prev ? {
      ...prev,
      phase: 'done',
      current: total,
      updated: accumUpdated,
      skipped: accumSkipped,
      errors: accumErrors,
    } : null)
    refetchTable()
  }

  /** Importa artigos históricos em lotes de 200, com delay entre fetches para evitar rate limiting */
  const handleSourceImport = async () => {
    if (!selectedSource || !dateFrom) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const total = availableCount && availableCount > 0 ? availableCount : 200
    const BATCH = 200
    const DELAY_MS = 500  // 500ms entre fetches para evitar rate limiting

    setStreamProgress({
      phase: 'running',
      label: `Importando ${selectedSource}...`,
      total,
      current: 0,
      updated: 0,
      skipped: 0,
      exists: 0,
      errors: 0,
      log: [],
    })

    let offset = 0
    let accumImported = 0, accumExists = 0, accumErrors = 0

    while (offset < total && !controller.signal.aborted) {
      const limit = Math.min(BATCH, total - offset)
      const batchParams = new URLSearchParams({
        source: selectedSource,
        limit: String(limit),
        offset: String(offset),
        delay: String(DELAY_MS),
        stream: '1',
      })
      if (dateFrom) batchParams.set('dateFrom', dateFrom)
      if (dateTo) batchParams.set('dateTo', dateTo)
      const url = `/api/admin/news/import?${batchParams}`

      let batchImported = 0, batchExists = 0, batchErrors = 0
      let batchDone = false

      try {
        const res = await fetch(url, { method: 'POST', signal: controller.signal })
        if (!res.ok || !res.body) {
          setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (!batchDone) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'item') {
                if (event.result === 'imported') batchImported++
                else if (event.result === 'exists') batchExists++
                else batchErrors++

                const entry: StreamLogEntry = {
                  title: event.title,
                  result: event.result === 'imported' ? 'updated' : event.result === 'exists' ? 'exists' : 'error',
                  artistCount: 0,
                }
                const au = accumImported + batchImported
                const ax = accumExists + batchExists
                const ae = accumErrors + batchErrors
                setStreamProgress(prev => prev ? {
                  ...prev,
                  current: offset + event.current,
                  updated: au,
                  exists: ax,
                  errors: ae,
                  log: [...prev.log, entry].slice(-100),
                } : null)

              } else if (event.type === 'done') {
                batchDone = true
              } else if (event.type === 'error') {
                setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
                return
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setStreamProgress(prev => prev ? { ...prev, phase: 'error' } : null)
        }
        return
      }

      accumImported += batchImported
      accumExists += batchExists
      accumErrors += batchErrors
      offset += limit
    }

    setStreamProgress(prev => prev ? {
      ...prev,
      phase: 'done',
      current: total,
      updated: accumImported,
      exists: accumExists,
      errors: accumErrors,
    } : null)
    refetchTable()
  }

  const isStreaming = streamProgress?.phase === 'running'

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
              disabled={isStreaming}
              title="Reprocessar pipeline completo em notícias candidatas (sem imagem / conteúdo curto)"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
            >
              {isStreaming ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Reprocessar candidatos
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

        {/* ── Generate result ──────────────────────────────────────────────── */}
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

        {/* ── Streaming progress panel ─────────────────────────────────────── */}
        {streamProgress && (
          <BatchProgressPanel
            progress={streamProgress}
            onClose={() => setStreamProgress(null)}
          />
        )}

        {/* ── Por fonte ────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <button
            onClick={() => setSourceOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/40 transition-colors"
          >
            <span>Reprocessar por fonte</span>
            {sourceOpen ? <ChevronUp size={15} className="text-zinc-500" /> : <ChevronDown size={15} className="text-zinc-500" />}
          </button>

          {sourceOpen && (
            <div className="px-4 pb-4 space-y-3 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 flex-wrap pt-3">
                {SOURCES.map(s => {
                  const c = SOURCE_COLORS[s]
                  const active = selectedSource === s
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSource(prev => prev === s ? null : s)
                        setDateFrom('')
                        setDateTo('')
                      }}
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
                <div className="space-y-2.5">
                  {/* Filtro de período */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 flex-wrap">
                    <span>Período</span>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      disabled={isStreaming}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                    />
                    <span>até</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      disabled={isStreaming}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo('') }}
                        disabled={isStreaming}
                        className="text-zinc-600 hover:text-zinc-400 disabled:opacity-50"
                        title="Limpar período"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Contagem no banco + disponíveis na fonte */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {sourceCount === null ? (
                      <span className="text-xs text-zinc-600 flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin" /> carregando...
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">
                        <strong className="text-zinc-300">{sourceCount.toLocaleString('pt-BR')}</strong> no banco
                        {(dateFrom || dateTo) && <span className="text-zinc-600"> no período</span>}
                      </span>
                    )}

                    {(dateFrom || dateTo) && (
                      <span className="text-xs text-zinc-500">
                        {availableCount === null ? (
                          <span className="text-zinc-600 flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> verificando fonte...
                          </span>
                        ) : availableCount === -1 ? (
                          <span className="text-zinc-600">API da fonte indisponível</span>
                        ) : (
                          <>
                            <strong className={availableCount > (sourceCount ?? 0) ? 'text-emerald-400' : 'text-zinc-300'}>
                              {availableCount.toLocaleString('pt-BR')}
                            </strong>
                            <span className="text-zinc-600"> disponíveis na fonte</span>
                          </>
                        )}
                      </span>
                    )}

                    {!(dateFrom || dateTo) && (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span>Processar</span>
                        <input
                          type="number"
                          min={1}
                          max={sourceCount ?? 9999}
                          value={sourceTotal}
                          onChange={e => setSourceTotal(Math.max(1, parseInt(e.target.value) || 1))}
                          disabled={isStreaming}
                          className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-200 text-center focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                        />
                        <span>de {sourceCount ?? '?'} · lotes de 200</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Importar novos (apenas quando há filtro de data) */}
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={handleSourceImport}
                        disabled={isStreaming || !dateFrom || availableCount === -1}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-emerald-500/50 hover:text-emerald-300 transition-all disabled:opacity-50 text-sm"
                      >
                        {isStreaming
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Download size={14} />
                        }
                        Importar novos
                      </button>
                    )}

                    {/* Reprocessar existentes */}
                    <button
                      onClick={handleSourceReprocess}
                      disabled={isStreaming || sourceCount === null}
                      className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium rounded-lg hover:border-purple-500/50 hover:text-purple-300 transition-all disabled:opacity-50 text-sm"
                    >
                      {isStreaming
                        ? <Loader2 size={14} className="animate-spin" />
                        : <RefreshCw size={14} />
                      }
                      Reprocessar {(dateFrom || dateTo) ? 'existentes' : selectedSource}
                    </button>
                  </div>
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
