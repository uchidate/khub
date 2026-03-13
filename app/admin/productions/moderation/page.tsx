'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Film, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2,
  Search, ChevronLeft, ChevronRight, Flag, FlagOff, CheckSquare,
  Square, Minus, ExternalLink, ShieldAlert, Users, Sparkles, ChevronDown, ChevronUp, EyeOff, Eye,
} from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

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
  createdAt: string
  flaggedAsNonKorean: boolean
  flaggedAt: string | null
  isAdultContent: boolean | null
  adultCheckedAt: string | null
  isHidden: boolean
  _count: { artists: number; userFavorites: number }
  suspicionScore: number
  suspicionReasons: string[]
}

type Pagination = { page: number; limit: number; total: number; pages: number }
type Filter = 'suspicious' | 'recent' | 'flagged' | 'adult' | 'all'
type Stats = { suspicious: number; recent: number; flagged: number; adult: number; all: number }

// Mesmas palavras-chave do backend para highlight no card
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

function detectAdultKeywords(title: string): string[] {
  const lower = title.toLowerCase()
  return ADULT_KEYWORDS.filter(kw => lower.includes(kw))
}

// ——— Confirmation modal ———
function ConfirmModal({
  open, title, message, confirmLabel, destructive, onConfirm, onCancel,
}: {
  open: boolean; title: string; message: string; confirmLabel: string
  destructive?: boolean; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ——— Score bar ———
function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, (score / 11) * 100)
  const color = score >= 7 ? 'bg-red-500' : score >= 4 ? 'bg-yellow-500' : 'bg-green-500'
  const label = score >= 7 ? 'text-red-400' : score >= 4 ? 'text-yellow-400' : 'text-green-400'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums shrink-0 ${label}`}>{score}</span>
    </div>
  )
}

// ——— Production card ———
function ProductionCard({
  prod, selected, onSelect, onFlag, onDelete, onHide, actioning, highlightAdult,
}: {
  prod: Production; selected: boolean; onSelect: () => void
  onFlag: () => void; onDelete: () => void; onHide: () => void; actioning: boolean; highlightAdult?: boolean
}) {
  const adultKeywordsFound = highlightAdult
    ? detectAdultKeywords((prod.titlePt ?? '') + ' ' + (prod.synopsis ?? ''))
    : []
  const borderColor = highlightAdult
    ? 'border-pink-500/50'
    : prod.flaggedAsNonKorean
    ? 'border-zinc-700'
    : prod.suspicionScore >= 7 ? 'border-red-500/40'
    : prod.suspicionScore >= 4 ? 'border-yellow-500/30'
    : 'border-green-500/20'

  const bgColor = highlightAdult
    ? 'bg-pink-500/5'
    : prod.flaggedAsNonKorean
    ? ''
    : prod.suspicionScore >= 7 ? 'bg-red-500/5'
    : prod.suspicionScore >= 4 ? 'bg-yellow-500/5'
    : 'bg-green-500/5'

  const SuspicionIcon = prod.suspicionScore >= 7 ? XCircle : prod.suspicionScore >= 4 ? AlertTriangle : CheckCircle
  const iconColor = prod.suspicionScore >= 7 ? 'text-red-500' : prod.suspicionScore >= 4 ? 'text-yellow-500' : 'text-green-500'

  return (
    <div className={`border rounded-xl transition-colors ${borderColor} ${bgColor} ${selected ? 'ring-1 ring-purple-500' : ''}`}>
      <div className="flex gap-3 p-3">
        {/* Checkbox */}
        <button onClick={onSelect} className="shrink-0 mt-1 text-zinc-500 hover:text-purple-400 transition-colors">
          {selected ? <CheckSquare size={18} className="text-purple-400" /> : <Square size={18} />}
        </button>

        {/* Poster */}
        <div className="shrink-0">
          {prod.imageUrl ? (
            <Image src={prod.imageUrl} alt={prod.titlePt} width={56} height={80} className="rounded object-cover w-14 h-20" />
          ) : (
            <div className="w-14 h-20 bg-zinc-800 rounded flex items-center justify-center">
              <Film size={20} className="text-zinc-600" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start gap-2 mb-1">
            <SuspicionIcon size={14} className={`shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-white text-sm leading-tight">{prod.titlePt}</span>
                <Link href={`/productions/${prod.id}`} target="_blank" className="text-zinc-500 hover:text-purple-400 transition-colors">
                  <ExternalLink size={12} />
                </Link>
              </div>
              {prod.titleKr && <p className="text-xs text-zinc-500 mt-0.5">{prod.titleKr}</p>}
            </div>
            {prod.flaggedAsNonKorean && (
              <span className="shrink-0 text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded">
                Marcada
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2 flex-wrap">
            <span className="px-1.5 py-0.5 bg-zinc-800 rounded">{prod.type}</span>
            {prod.year && <span>{prod.year}</span>}
            {prod.tmdbId && <span className="text-blue-400/80">TMDB ✓</span>}
            <span>{prod._count.artists} artistas</span>
            <span>{prod._count.userFavorites} favs</span>
            {prod.isHidden && (
              <span className="px-1.5 py-0.5 bg-zinc-700/60 text-zinc-400 border border-zinc-600/40 rounded flex items-center gap-1">
                <EyeOff size={10} /> Oculto
              </span>
            )}
            {prod.isAdultContent === true && (
              <span className="px-1.5 py-0.5 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded font-medium">IA: Adulto</span>
            )}
            {prod.isAdultContent === false && prod.adultCheckedAt && (
              <span className="px-1.5 py-0.5 bg-green-600/10 text-green-500/70 border border-green-600/20 rounded">IA: OK</span>
            )}
          </div>

          {/* Adult keywords found */}
          {adultKeywordsFound.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {adultKeywordsFound.map((kw, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-pink-600/20 border border-pink-500/30 text-pink-300 rounded-full font-mono">
                  {kw}
                </span>
              ))}
            </div>
          )}

          {/* Score bar */}
          {!prod.flaggedAsNonKorean && (
            <div className="mb-2">
              <ScoreBar score={prod.suspicionScore} />
            </div>
          )}

          {/* Reasons */}
          {prod.suspicionReasons.length > 0 && !prod.flaggedAsNonKorean && (
            <div className="flex flex-wrap gap-1 mb-2">
              {prod.suspicionReasons.map((r, i) => (
                <span key={i} className="text-xs px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400">{r}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onFlag}
              disabled={actioning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                prod.flaggedAsNonKorean
                  ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/30'
                  : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30'
              }`}
            >
              {prod.flaggedAsNonKorean ? <FlagOff size={12} /> : <Flag size={12} />}
              {prod.flaggedAsNonKorean ? 'Desmarcar' : 'Não é coreano'}
            </button>
            <button
              onClick={onHide}
              disabled={actioning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                prod.isHidden
                  ? 'bg-zinc-700/40 text-zinc-400 hover:bg-zinc-700 border border-zinc-600'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-yellow-400 border border-zinc-700'
              }`}
            >
              {prod.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
              {prod.isHidden ? 'Reexibir' : 'Ocultar'}
            </button>
            <button
              onClick={onDelete}
              disabled={actioning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-red-400 transition-colors disabled:opacity-50 border border-zinc-700"
            >
              <Trash2 size={12} />
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ——— Main page ———
export default function ProductionModerationPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<Filter>('suspicious')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<{
    open: boolean; title: string; message: string
    confirmLabel: string; destructive?: boolean; onConfirm: () => void
  }>({ open: false, title: '', message: '', confirmLabel: '', onConfirm: () => {} })

  // DeepSeek analysis panel
  const [autoHidePreview, setAutoHidePreview] = useState<{ adultVisible: number; artistsFromAdult: number } | null>(null)
  const [autoHideRunning, setAutoHideRunning] = useState(false)
  const [autoHideDone, setAutoHideDone] = useState<{ hiddenProductions: number } | null>(null)

  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiStats, setAiStats] = useState<{
    total: number; noRating: number; checked: number
    unchecked: number; uncheckedNoRating: number; isAdult: number; notAdult: number
  } | null>(null)
  const [aiLimit, setAiLimit] = useState(20)
  const [aiOnlyUnchecked, setAiOnlyUnchecked] = useState(true)
  const [aiOnlyNoRating, setAiOnlyNoRating] = useState(true)
  const [aiRunning, setAiRunning] = useState(false)
  const [aiLog, setAiLog] = useState<{ title: string; isAdult: boolean | null; error?: boolean }[]>([])
  const [aiDone, setAiDone] = useState(false)

  const searchTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/productions/moderation?stats=1')
      if (res.ok) setStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchProductions = useCallback(async (page = 1) => {
    setLoading(true)
    setSelected(new Set())
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: '20' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/admin/productions/moderation?${params}`)
      const data = await res.json()
      if (res.ok) {
        setProductions(data.productions)
        setPagination(data.pagination)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [filter, debouncedSearch])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchProductions(1) }, [fetchProductions])

  useEffect(() => {
    fetch('/api/admin/productions/auto-hide')
      .then(r => r.json())
      .then(d => setAutoHidePreview(d))
      .catch(() => {})
  }, [])

  async function runAutoHide() {
    setAutoHideRunning(true)
    setAutoHideDone(null)
    try {
      const res = await fetch('/api/admin/productions/auto-hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideAdult: true, hideLinkedArtists: false }),
      })
      const data = await res.json()
      if (res.ok) {
        setAutoHideDone({ hiddenProductions: data.hiddenProductions })
        setAutoHidePreview(prev => prev ? { ...prev, adultVisible: 0 } : null)
        await fetchStats()
      }
    } finally {
      setAutoHideRunning(false)
    }
  }

  const fetchAiStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/productions/adult-check')
      if (res.ok) setAiStats(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { if (aiPanelOpen) fetchAiStats() }, [aiPanelOpen, fetchAiStats])

  async function runAiAnalysis() {
    setAiRunning(true)
    setAiLog([])
    setAiDone(false)
    try {
      const res = await fetch('/api/admin/productions/adult-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: aiLimit, onlyUnchecked: aiOnlyUnchecked, onlyNoRating: aiOnlyNoRating }),
      })
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        setAiLog([{ title: err.error ?? 'Erro', isAdult: null, error: true }])
        return
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              setAiLog(prev => [...prev, { title: event.title, isAdult: event.isAdult, error: event.error }])
            } else if (event.type === 'done') {
              setAiDone(true)
              await fetchAiStats()
              await fetchStats()
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } finally {
      setAiRunning(false)
    }
  }

  function openConfirm(opts: typeof modal) { setModal({ ...opts, open: true }) }

  const addActioning = (ids: string[]) =>
    setActioningIds(prev => new Set(Array.from(prev).concat(ids)))
  const removeActioning = (ids: string[]) =>
    setActioningIds(prev => { const s = new Set(prev); ids.forEach(id => s.delete(id)); return s })

  async function doFlag(ids: string[], flaggedAsNonKorean: boolean) {
    addActioning(ids)
    try {
      const res = await fetch('/api/admin/productions/moderation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, flaggedAsNonKorean }),
      })
      if (res.ok) { await fetchProductions(pagination?.page || 1); await fetchStats() }
    } finally { removeActioning(ids) }
  }

  async function doHide(ids: string[], isHidden: boolean) {
    addActioning(ids)
    try {
      const res = await fetch('/api/admin/productions/moderation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isHidden }),
      })
      if (res.ok) { await fetchProductions(pagination?.page || 1); await fetchStats() }
    } finally { removeActioning(ids) }
  }

  async function doDelete(ids: string[], withArtists = false) {
    addActioning(ids)
    try {
      const res = await fetch('/api/admin/productions/moderation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, withArtists }),
      })
      if (res.ok) { await fetchProductions(pagination?.page || 1); await fetchStats() }
    } finally { removeActioning(ids) }
  }

  function handleFlag(prod: Production) {
    openConfirm({
      open: true,
      title: prod.flaggedAsNonKorean ? 'Desmarcar produção' : 'Marcar como não-relevante',
      message: `"${prod.titlePt}" será ${prod.flaggedAsNonKorean ? 'desmarcada' : 'marcada como não-relevante'}.`,
      confirmLabel: prod.flaggedAsNonKorean ? 'Desmarcar' : 'Marcar',
      onConfirm: () => doFlag([prod.id], !prod.flaggedAsNonKorean),
    })
  }

  function handleHide(prod: Production) {
    if (prod.isHidden) {
      doHide([prod.id], false)
      return
    }
    openConfirm({
      open: true,
      title: 'Ocultar produção',
      message: `"${prod.titlePt}" ficará invisível no site público e fora do sitemap. Você pode reexibir a qualquer momento.`,
      confirmLabel: 'Ocultar',
      onConfirm: () => doHide([prod.id], true),
    })
  }

  function handleDelete(prod: Production) {
    openConfirm({
      open: true,
      title: 'Deletar produção',
      message: `"${prod.titlePt}" será removida permanentemente. Esta ação não pode ser desfeita.`,
      confirmLabel: 'Deletar',
      destructive: true,
      onConfirm: () => doDelete([prod.id]),
    })
  }

  function handleBulkFlag(flaggedAsNonKorean: boolean) {
    const ids = Array.from(selected)
    openConfirm({
      open: true,
      title: `${flaggedAsNonKorean ? 'Marcar' : 'Desmarcar'} ${ids.length} produções`,
      message: `${ids.length} produções selecionadas serão ${flaggedAsNonKorean ? 'marcadas como não-relevantes' : 'desmarcadas'}.`,
      confirmLabel: flaggedAsNonKorean ? 'Marcar todas' : 'Desmarcar todas',
      onConfirm: () => doFlag(ids, flaggedAsNonKorean),
    })
  }

  function handleBulkHide(isHidden: boolean) {
    const ids = Array.from(selected)
    openConfirm({
      open: true,
      title: isHidden ? `Ocultar ${ids.length} produções` : `Reexibir ${ids.length} produções`,
      message: isHidden
        ? `${ids.length} produções ficarão invisíveis no site público e fora do sitemap.`
        : `${ids.length} produções voltarão a aparecer no site público.`,
      confirmLabel: isHidden ? 'Ocultar todas' : 'Reexibir todas',
      onConfirm: () => doHide(ids, isHidden),
    })
  }

  function handleBulkDelete(withArtists = false) {
    const ids = Array.from(selected)
    openConfirm({
      open: true,
      title: withArtists ? `Deletar ${ids.length} produções + artistas` : `Deletar ${ids.length} produções`,
      message: withArtists
        ? `${ids.length} produções e os artistas exclusivos delas (sem outras produções) serão removidos permanentemente.`
        : `${ids.length} produções serão removidas permanentemente.`,
      confirmLabel: withArtists ? 'Deletar tudo' : 'Deletar todas',
      destructive: true,
      onConfirm: () => doDelete(ids, withArtists),
    })
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const allSelected = productions.length > 0 && productions.every(p => selected.has(p.id))
  const someSelected = productions.some(p => selected.has(p.id)) && !allSelected

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(productions.map(p => p.id)))
  }

  const filterTabs: { key: Filter; label: string; count?: number; danger?: boolean }[] = [
    { key: 'suspicious', label: 'Suspeitas', count: stats?.suspicious },
    { key: 'recent', label: 'Recentes (7d)', count: stats?.recent },
    { key: 'flagged', label: 'Marcadas', count: stats?.flagged },
    { key: 'adult', label: 'Conteúdo adulto', count: stats?.adult, danger: true },
    { key: 'all', label: 'Todas', count: stats?.all },
  ]

  return (
    <AdminLayout title="Moderação de Produções">
      <ConfirmModal
        {...modal}
        onConfirm={() => { setModal(m => ({ ...m, open: false })); modal.onConfirm() }}
        onCancel={() => setModal(m => ({ ...m, open: false }))}
      />

      <div className="space-y-4">
        <p className="text-zinc-400 text-sm -mt-6">Revisar produções para relevância à cultura coreana</p>

        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Suspeitas', value: stats.suspicious, color: 'text-red-400' },
              { label: 'Recentes (7d)', value: stats.recent, color: 'text-yellow-400' },
              { label: 'Marcadas', value: stats.flagged, color: 'text-zinc-400' },
              { label: 'Adulto', value: stats.adult, color: 'text-pink-400' },
              { label: 'Total ativas', value: stats.all, color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Auto-hide panel */}
        {autoHidePreview && autoHidePreview.adultVisible > 0 && (
          <div className="bg-pink-600/10 border border-pink-600/30 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
            <EyeOff size={16} className="text-pink-400 shrink-0" />
            <span className="text-sm text-pink-300 flex-1 min-w-fit">
              {autoHidePreview.adultVisible} produção(ões) confirmadas como adultas ainda visíveis no site
            </span>
            {autoHideDone ? (
              <span className="text-xs text-green-400 flex items-center gap-1.5">
                <CheckCircle size={13} /> {autoHideDone.hiddenProductions} ocultada(s)
              </span>
            ) : (
              <button
                onClick={() => openConfirm({
                  open: true,
                  title: `Ocultar ${autoHidePreview.adultVisible} produções adultas`,
                  message: `${autoHidePreview.adultVisible} produções confirmadas como conteúdo adulto pela IA serão ocultadas do site público. Os artistas não serão afetados.`,
                  confirmLabel: 'Ocultar produções',
                  destructive: true,
                  onConfirm: runAutoHide,
                })}
                disabled={autoHideRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-pink-700/40 text-pink-200 hover:bg-pink-700/60 border border-pink-600/40 rounded-lg transition-colors disabled:opacity-50"
              >
                {autoHideRunning ? <RefreshCw size={12} className="animate-spin" /> : <EyeOff size={12} />}
                Ocultar agora
              </button>
            )}
          </div>
        )}

        {/* DeepSeek AI Analysis Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setAiPanelOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
          >
            <Sparkles size={16} className="text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-white flex-1 text-left">Analisar com DeepSeek</span>
            {aiStats && (
              <span className="text-xs text-zinc-500 mr-2">
                {aiStats.checked}/{aiStats.total} verificados · {aiStats.isAdult} adultos · {aiStats.uncheckedNoRating} sem classificação pendentes
              </span>
            )}
            {aiPanelOpen ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </button>

          {aiPanelOpen && (
            <div className="border-t border-zinc-800 p-4 space-y-4">
              {/* Config */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Quantidade:</label>
                  <select
                    value={aiLimit}
                    onChange={e => setAiLimit(Number(e.target.value))}
                    disabled={aiRunning}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    {[5, 10, 20, 30, 50].map(n => (
                      <option key={n} value={n}>{n} produções</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Verificadas:</label>
                  <select
                    value={aiOnlyUnchecked ? 'unchecked' : 'all'}
                    onChange={e => setAiOnlyUnchecked(e.target.value === 'unchecked')}
                    disabled={aiRunning}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value="unchecked">Apenas não verificadas ({aiStats?.unchecked ?? '?'})</option>
                    <option value="all">Todas (re-verificar)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400">Classificação:</label>
                  <select
                    value={aiOnlyNoRating ? 'no_rating' : 'all'}
                    onChange={e => setAiOnlyNoRating(e.target.value === 'no_rating')}
                    disabled={aiRunning}
                    className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-purple-500"
                  >
                    <option value="no_rating">Sem classificação etária ({aiStats?.uncheckedNoRating ?? '?'})</option>
                    <option value="all">Qualquer (incluindo classificadas)</option>
                  </select>
                </div>
                <button
                  onClick={runAiAnalysis}
                  disabled={aiRunning}
                  className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {aiRunning
                    ? <><RefreshCw size={13} className="animate-spin" /> Analisando...</>
                    : <><Sparkles size={13} /> Iniciar análise</>
                  }
                </button>
              </div>

              {/* Stats bar */}
              {aiStats && (
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-400">
                    Total: <strong className="text-white">{aiStats.total}</strong>
                  </span>
                  <span className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-400">
                    Sem classificação: <strong className="text-yellow-300">{aiStats.noRating}</strong>
                  </span>
                  <span className="px-2 py-1 bg-green-600/10 border border-green-600/20 rounded-lg text-green-400">
                    Verificadas: <strong>{aiStats.checked}</strong>
                  </span>
                  <span className="px-2 py-1 bg-yellow-600/10 border border-yellow-600/20 rounded-lg text-yellow-400">
                    Pendentes (sem class.): <strong>{aiStats.uncheckedNoRating}</strong>
                  </span>
                  <span className="px-2 py-1 bg-pink-600/10 border border-pink-600/20 rounded-lg text-pink-400">
                    Adultos detectados: <strong>{aiStats.isAdult}</strong>
                  </span>
                </div>
              )}

              {/* Log */}
              {aiLog.length > 0 && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
                  {aiLog.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {entry.error
                        ? <XCircle size={12} className="text-red-400 shrink-0" />
                        : entry.isAdult
                        ? <ShieldAlert size={12} className="text-pink-400 shrink-0" />
                        : <CheckCircle size={12} className="text-green-400 shrink-0" />
                      }
                      <span className={`flex-1 truncate ${entry.error ? 'text-red-400' : entry.isAdult ? 'text-pink-300' : 'text-zinc-400'}`}>
                        {entry.title}
                      </span>
                      {!entry.error && (
                        <span className={`shrink-0 font-medium ${entry.isAdult ? 'text-pink-400' : 'text-green-400'}`}>
                          {entry.isAdult ? 'ADULTO' : 'OK'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {aiDone && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle size={13} /> Análise concluída. Recarregue o filtro &quot;Conteúdo adulto&quot; para ver novos resultados.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Filters + Search */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(f => {
              const isActive = filter === f.key
              const activeClass = f.danger
                ? 'bg-pink-700 text-white'
                : 'bg-purple-600 text-white'
              const inactiveClass = f.danger
                ? 'bg-pink-600/10 text-pink-400 border border-pink-600/30 hover:bg-pink-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              const badgeClass = isActive
                ? f.danger ? 'bg-pink-600/50' : 'bg-purple-500/50'
                : 'bg-zinc-700'
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive ? activeClass : inactiveClass}`}
                >
                  {f.danger && <ShieldAlert size={13} />}
                  {f.label}
                  {f.count !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeClass}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
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
              {selected.size} selecionada{selected.size !== 1 ? 's' : ''}
            </span>
            {filter !== 'adult' && (
              <>
                <button
                  onClick={() => handleBulkFlag(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30 rounded-lg transition-colors"
                >
                  <Flag size={12} /> Marcar
                </button>
                <button
                  onClick={() => handleBulkFlag(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30 rounded-lg transition-colors"
                >
                  <FlagOff size={12} /> Desmarcar
                </button>
              </>
            )}
            <button
              onClick={() => handleBulkHide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 text-yellow-400 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <EyeOff size={12} /> Ocultar
            </button>
            <button
              onClick={() => handleBulkHide(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <Eye size={12} /> Reexibir
            </button>
            {filter === 'adult' && (
              <button
                onClick={() => handleBulkDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-pink-700/30 text-pink-300 hover:bg-pink-700/50 border border-pink-600/40 rounded-lg transition-colors"
              >
                <Users size={12} /> Deletar + artistas
              </button>
            )}
            <button
              onClick={() => handleBulkDelete(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-zinc-800 text-red-400 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            >
              <Trash2 size={12} /> Deletar
            </button>
            <button onClick={() => setSelected(new Set())} className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs">
              Limpar
            </button>
          </div>
        )}

        {/* Select-all + count */}
        {productions.length > 0 && !loading && (
          <div className="flex items-center gap-2 px-1">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              {allSelected ? <CheckSquare size={14} className="text-purple-400" />
                : someSelected ? <Minus size={14} className="text-purple-400" />
                : <Square size={14} />}
              {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
            </button>
            {pagination && (
              <span className="text-xs text-zinc-600 ml-auto">
                {pagination.total} produção{pagination.total !== 1 ? 'ões' : ''}
              </span>
            )}
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-7 h-7 text-purple-500 animate-spin" />
            </div>
          ) : productions.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
              <Film className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-400">Nenhuma produção encontrada</p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-3 text-sm text-purple-400 hover:underline">
                  Limpar busca
                </button>
              )}
            </div>
          ) : (
            productions.map(prod => (
              <ProductionCard
                key={prod.id}
                prod={prod}
                selected={selected.has(prod.id)}
                onSelect={() => toggleSelect(prod.id)}
                onFlag={() => handleFlag(prod)}
                onHide={() => handleHide(prod)}
                onDelete={() => handleDelete(prod)}
                actioning={actioningIds.has(prod.id)}
                highlightAdult={filter === 'adult'}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-4 pt-2">
            <button
              onClick={() => fetchProductions(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-zinc-500">{pagination.page} / {pagination.pages}</span>
            <button
              onClick={() => fetchProductions(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
