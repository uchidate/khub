'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { DataTable, Column, refetchTable } from '@/components/admin/DataTable'
import { FormModal, FormField } from '@/components/admin/FormModal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { useAdminToast } from '@/lib/hooks/useAdminToast'
import {
  Plus, Users, RefreshCw, ShieldCheck, RotateCcw, CalendarSearch,
  ChevronLeft, ChevronRight, ChevronDown, X, ExternalLink, Pencil, Trash2,
  Check, AlertCircle, Film, Star, Languages,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const AGE_RATING_STYLES: Record<string, string> = {
  'L':  'bg-green-500/20 text-green-400 border-green-500/30',
  '10': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '12': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '14': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '16': 'bg-red-600/20 text-red-400 border-red-600/30',
  '18': 'bg-red-900/40 text-red-300 border-red-700/50',
}

const MONTHS = [
  { value: '0', label: 'Todos os meses' },
  { value: '1', label: 'Janeiro' }, { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' }, { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface Production {
  id: string
  titlePt: string
  titleKr: string | null
  type: string
  year: number | null
  imageUrl: string | null
  ageRating: string | null
  artistsCount: number
  castSyncAt: string | null
  tmdbId: string | null
}

interface CastMember {
  artistId: string
  productionId: string
  role: string | null
  castOrder: number | null
  artist: {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    stageNames: string[]
  }
}

interface PreviewItem {
  tmdbId: number
  tmdbType: 'tv' | 'movie'
  name: string
  originalName: string | null
  date: string | null
  posterUrl: string | null
  voteAverage: number
  voteCount: number
  exists: boolean
  existingId: string | null
}

interface PreviewResult {
  results: PreviewItem[]
  total: number
  page: number
  totalPages: number
}

interface Stats {
  total: number
  noCast: number
  noRating: number
  noCastPending: number
  noCastAttempted: number
  noCastNoTmdb: number
  noRatingPending: number
  noRatingAttempted: number
  noRatingNoTmdb: number
  noTmdb: number
  hasTmdb: number
  hiddenFromPublic: number
}

type FilterType =
  | ''
  | 'no_cast' | 'no_cast_pending' | 'no_cast_attempted' | 'no_cast_no_tmdb'
  | 'no_rating' | 'no_rating_pending' | 'no_rating_attempted' | 'no_rating_no_tmdb'
  | 'no_tmdb' | 'has_tmdb'
  | 'hidden_from_public'

// ─── Cast Modal ───────────────────────────────────────────────────────────────

function CastModal({
  production,
  onClose,
  onSyncCast,
}: {
  production: Production
  onClose: () => void
  onSyncCast: (production: Production) => Promise<void>
}) {
  const [cast, setCast] = useState<CastMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editOrder, setEditOrder] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  const fetchCast = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/productions/cast?productionId=${production.id}`)
      if (res.ok) setCast(await res.json())
    } finally {
      setLoading(false)
    }
  }, [production.id])

  useEffect(() => { fetchCast() }, [fetchCast])

  const startEdit = (m: CastMember) => {
    setEditingId(m.artistId)
    setEditRole(m.role ?? '')
    setEditOrder(m.castOrder != null ? String(m.castOrder) : '')
  }

  const saveEdit = async (artistId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/productions/cast', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          productionId: production.id,
          role: editRole || null,
          castOrder: editOrder !== '' ? parseInt(editOrder) : null,
        }),
      })
      if (res.ok) {
        const updated: CastMember = await res.json()
        setCast(prev =>
          prev.map(m => m.artistId === artistId ? updated : m)
            .sort((a, b) => (a.castOrder ?? 999) - (b.castOrder ?? 999))
        )
        setEditingId(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteMember = async (artistId: string) => {
    if (!confirm('Remover este artista do elenco desta produção?')) return
    setDeleting(artistId)
    try {
      const res = await fetch('/api/admin/productions/cast', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, productionId: production.id }),
      })
      if (res.ok) {
        setCast(prev => prev.filter(m => m.artistId !== artistId))
        refetchTable()
      }
    } finally {
      setDeleting(null)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setMsg('')
    try {
      await onSyncCast(production)
      await fetchCast()
      setMsg('✅ Elenco sincronizado com o TMDB!')
      refetchTable()
    } catch {
      setMsg('❌ Erro ao sincronizar')
    } finally {
      setSyncing(false)
      setTimeout(() => setMsg(''), 5000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-black text-white">{production.titlePt}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {loading ? '...' : `${cast.length} artista${cast.length !== 1 ? 's' : ''} no elenco`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {production.tmdbId && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-xs font-bold transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sincronizando...' : 'Re-sync TMDB'}
              </button>
            )}
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {msg && (
          <div className={`mx-5 mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
            msg.startsWith('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {msg}
          </div>
        )}

        {/* Cast list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {loading ? (
            <div className="text-center py-12 text-zinc-500">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-sm">Carregando elenco...</p>
            </div>
          ) : cast.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Users size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum artista no elenco</p>
              {production.tmdbId && (
                <p className="text-xs mt-1 text-zinc-600">Use &quot;Re-sync TMDB&quot; para importar</p>
              )}
            </div>
          ) : (
            cast.map((member) => (
              <div
                key={member.artistId}
                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors group"
              >
                {/* Avatar */}
                {member.artist.primaryImageUrl ? (
                  <img
                    src={member.artist.primaryImageUrl}
                    alt={member.artist.nameRomanized}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-zinc-500" />
                  </div>
                )}

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{member.artist.nameRomanized}</p>
                  {member.artist.nameHangul && (
                    <p className="text-xs text-zinc-500">{member.artist.nameHangul}</p>
                  )}
                </div>

                {/* Edit mode */}
                {editingId === member.artistId ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      placeholder="papel"
                      className="w-28 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                    <input
                      value={editOrder}
                      onChange={(e) => setEditOrder(e.target.value)}
                      placeholder="#"
                      type="number"
                      className="w-14 px-2 py-1 bg-zinc-700 border border-zinc-600 rounded text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={() => saveEdit(member.artistId)}
                      disabled={saving}
                      className="p-1.5 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded bg-zinc-700 text-zinc-400 hover:bg-zinc-600 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Display (visible, fades on hover) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 group-hover:hidden">
                      {member.castOrder != null && (
                        <span className="text-xs text-zinc-600 font-mono">#{member.castOrder}</span>
                      )}
                      {member.role && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700">
                          {member.role}
                        </span>
                      )}
                    </div>
                    {/* Actions (hidden, shows on hover) */}
                    <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                      {member.castOrder != null && (
                        <span className="text-xs text-zinc-600 font-mono mr-1">#{member.castOrder}</span>
                      )}
                      {member.role && (
                        <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700 mr-1">
                          {member.role}
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(member)}
                        className="p-1.5 rounded bg-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors"
                        title="Editar papel e ordem"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteMember(member.artistId)}
                        disabled={deleting === member.artistId}
                        className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        title="Remover do elenco"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Stats / Filter Bar ───────────────────────────────────────────────────────

function StatsBar({
  stats,
  filter,
  onFilter,
}: {
  stats: Stats | null
  filter: FilterType
  onFilter: (f: FilterType) => void
}) {
  const isNoCast = filter === 'no_cast' || filter === 'no_cast_pending' || filter === 'no_cast_attempted' || filter === 'no_cast_no_tmdb'
  const isNoRating = filter === 'no_rating' || filter === 'no_rating_pending' || filter === 'no_rating_attempted' || filter === 'no_rating_no_tmdb'
  const isAll = filter === '' || filter === 'no_tmdb' || filter === 'has_tmdb'
  const isHiddenFromPublic = filter === 'hidden_from_public'

  const mainTabs = [
    { label: 'Todas', value: '' as FilterType, count: stats?.total ?? null, dot: 'bg-zinc-400' },
    { label: 'Sem classificação', value: 'no_rating' as FilterType, count: stats?.noRating ?? null, dot: 'bg-yellow-400' },
    { label: 'Sem elenco', value: 'no_cast' as FilterType, count: stats?.noCast ?? null, dot: 'bg-red-400' },
    { label: 'Ocultas do público', value: 'hidden_from_public' as FilterType, count: stats?.hiddenFromPublic ?? null, dot: 'bg-orange-500' },
  ]

  const castSubTabs = [
    {
      label: 'Pendentes',
      value: 'no_cast_pending' as FilterType,
      count: stats?.noCastPending ?? null,
      title: 'Tem TMDB ID mas nunca foi tentado — clique "Elenco Pendente" para processar',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20',
      activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20',
    },
    {
      label: 'Já tentados',
      value: 'no_cast_attempted' as FilterType,
      count: stats?.noCastAttempted ?? null,
      title: 'Tem TMDB ID, foi processado, mas não encontrou elenco — verificar dados no TMDB',
      color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60',
      activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60',
    },
    {
      label: 'Sem TMDB',
      value: 'no_cast_no_tmdb' as FilterType,
      count: stats?.noCastNoTmdb ?? null,
      title: 'Sem TMDB ID — requer entrada manual',
      color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
      activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800',
    },
  ]

  const ratingSubTabs = [
    {
      label: 'Pendentes',
      value: 'no_rating_pending' as FilterType,
      count: stats?.noRatingPending ?? null,
      title: 'Tem TMDB ID mas nunca foi tentado — clique "Classificar Pendentes" para processar',
      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20',
      activeColor: 'text-orange-300 border-orange-400/50 bg-orange-500/20',
    },
    {
      label: 'Já tentados',
      value: 'no_rating_attempted' as FilterType,
      count: stats?.noRatingAttempted ?? null,
      title: 'Tem TMDB ID, foi processado, mas não encontrou classificação — verificar dados no TMDB',
      color: 'text-zinc-400 border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700/60',
      activeColor: 'text-zinc-300 border-zinc-500 bg-zinc-700/60',
    },
    {
      label: 'Sem TMDB',
      value: 'no_rating_no_tmdb' as FilterType,
      count: stats?.noRatingNoTmdb ?? null,
      title: 'Sem TMDB ID — requer entrada manual',
      color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
      activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800',
    },
  ]

  const allSubTabs = [
    {
      label: 'Com TMDB',
      value: 'has_tmdb' as FilterType,
      count: stats?.hasTmdb ?? null,
      title: 'Produções com TMDB ID vinculado',
      color: 'text-green-400 border-green-500/30 bg-green-500/10 hover:bg-green-500/20',
      activeColor: 'text-green-300 border-green-400/50 bg-green-500/20',
    },
    {
      label: 'Sem TMDB',
      value: 'no_tmdb' as FilterType,
      count: stats?.noTmdb ?? null,
      title: 'Produções sem TMDB ID — requer vinculação manual',
      color: 'text-zinc-600 border-zinc-800 bg-zinc-900 hover:bg-zinc-800',
      activeColor: 'text-zinc-500 border-zinc-700 bg-zinc-800',
    },
  ]

  const subTabs = isNoCast ? castSubTabs : isNoRating ? ratingSubTabs : isAll ? allSubTabs : []


  return (
    <div className="space-y-2">
      {/* Main tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {mainTabs.map((tab) => {
          const isActive = tab.value === ''
            ? isAll
            : tab.value === 'no_cast' ? isNoCast
            : tab.value === 'no_rating' ? isNoRating
            : tab.value === 'hidden_from_public' ? isHiddenFromPublic
            : filter === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => onFilter(tab.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />
              {tab.label}
              {tab.count != null && (
                <span className={`font-mono tabular-nums ${isActive ? 'text-purple-300' : 'text-zinc-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Sub-tabs (visible when a category filter is active) */}
      {subTabs.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pl-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mr-1">↳</span>
          {subTabs.map((sub) => {
            const isActive = filter === sub.value
            return (
              <button
                key={sub.value}
                onClick={() => onFilter(isActive ? (isNoCast ? 'no_cast' : isNoRating ? 'no_rating' : '') : sub.value)}
                title={sub.title}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
                  isActive ? sub.activeColor : sub.color
                }`}
              >
                {sub.label}
                {sub.count != null && (
                  <span className="font-mono tabular-nums opacity-80">{sub.count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Form fields ──────────────────────────────────────────────────────────────

const formFields: FormField[] = [
  { key: 'titleKr', label: 'Título Original (Coreano/Inglês)', type: 'text', placeholder: 'Ex: 사랑의 불시착 ou Crash Landing on You', required: true },
  { key: 'titlePt', label: 'Título em Português', type: 'text', placeholder: 'Se vazio, usa o título original' },
  { key: 'type', label: 'Tipo', type: 'text', placeholder: 'Ex: Drama, Filme, Reality Show', required: true },
  { key: 'year', label: 'Ano', type: 'number', placeholder: '2024' },
  { key: 'tagline', label: 'Tagline / Slogan', type: 'text', placeholder: 'Ex: "사랑은 눈물이다"' },
  { key: 'synopsis', label: 'Sinopse', type: 'textarea', placeholder: 'Breve descrição da produção...' },
  { key: 'imageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://exemplo.com/poster.jpg' },
  { key: 'trailerUrl', label: 'URL do Trailer', type: 'text', placeholder: 'https://youtube.com/watch?v=...' },
  { key: 'tags', label: 'Tags', type: 'tags', placeholder: 'Ex: k-drama, romance, 2024' },
  {
    key: 'ageRating',
    label: 'Classificação Etária (DJCTQ)',
    type: 'select',
    options: [
      { value: '', label: 'Não classificado' },
      { value: 'L', label: 'Livre' },
      { value: '10', label: '10 anos' },
      { value: '12', label: '12 anos' },
      { value: '14', label: '14 anos' },
      { value: '16', label: '16 anos' },
      { value: '18', label: '18 anos (adulto)' },
    ],
  },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductionsPage() {
  const toast = useAdminToast()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editingProduction, setEditingProduction] = useState<Production | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [batchSyncing, setBatchSyncing] = useState(false)
  const [resetSyncing, setResetSyncing] = useState(false)
  const [fixNoTypeSyncing, setFixNoTypeSyncing] = useState(false)
  const [ageSyncing, setAgeSyncing] = useState(false)
  const [ageSyncingId, setAgeSyncingId] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState('')
  const [castModalProduction, setCastModalProduction] = useState<Production | null>(null)
  const [filter, setFilter] = useState<FilterType>('')
  const [stats, setStats] = useState<Stats | null>(null)

  // Backfill pt-BR state
  const [backfillPanelOpen, setBackfillPanelOpen] = useState(false)
  const [backfillYear, setBackfillYear] = useState('')
  const [backfillRunning, setBackfillRunning] = useState(false)
  const [backfillLog, setBackfillLog] = useState<string[]>([])
  const [backfillStats, setBackfillStats] = useState<{ updated: number; noChange: number; errors: number } | null>(null)
  const [backfillProgress, setBackfillProgress] = useState<{ current: number; total: number; totalGlobal: number } | null>(null)

  // Mobile "more actions" dropdown
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)

  // Import by period state
  const [importPanelOpen, setImportPanelOpen] = useState(false)
  const [importType, setImportType] = useState<'tv' | 'movie'>('tv')
  const [importYear, setImportYear] = useState(String(new Date().getFullYear()))
  const [importMonth, setImportMonth] = useState('0')
  const [importSortBy, setImportSortBy] = useState('popularity.desc')
  const [importPage, setImportPage] = useState(1)
  const [importSearching, setImportSearching] = useState(false)
  const [importPreview, setImportPreview] = useState<PreviewResult | null>(null)
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  const fetchStats = useCallback(async () => {
    const res = await fetch('/api/admin/productions/stats')
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const showMsg = (msg: string, timeout = 8000) => {
    setSyncMsg(msg)
    setTimeout(() => setSyncMsg(''), timeout)
  }

  // ─── Cast sync ─────────────────────────────────────────────────────────────

  const handleSyncCast = async (production: Production) => {
    if (syncingId) return
    setSyncingId(production.id)
    let success = false
    try {
      const res = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionId: production.id }),
      })
      const data = await res.json().catch(() => ({})) as { synced?: number; error?: string }
      if (res.ok) {
        showMsg(`✅ ${production.titlePt}: ${data.synced} artistas importados`)
        refetchTable()
        fetchStats()
        success = true
      } else {
        showMsg(`❌ Erro: ${data.error ?? 'falha ao importar elenco'}`)
      }
    } catch {
      showMsg('❌ Erro de rede')
    } finally {
      setSyncingId(null)
    }
    // Propagate failure so CastModal can show the error instead of false "✅"
    if (!success) throw new Error('sync failed')
  }

  // ─── Age rating per production ─────────────────────────────────────────────

  const handleSyncAgeRatingOne = async (production: Production) => {
    if (ageSyncingId) return
    setAgeSyncingId(production.id)
    try {
      const res = await fetch('/api/admin/productions/sync-age-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productionId: production.id }),
      })
      const data = await res.json()
      if (res.ok) {
        const rated = data.ageRating
          ? `classificado como ${data.ageRating === 'L' ? 'Livre' : data.ageRating + '+'}`
          : 'sem dados no TMDB'
        showMsg(`✅ ${production.titlePt}: ${rated}`, 6000)
        refetchTable()
        fetchStats()
      } else {
        showMsg(`❌ Erro: ${data.error ?? 'falha ao classificar'}`)
      }
    } catch {
      showMsg('❌ Erro de rede')
    } finally {
      setAgeSyncingId(null)
    }
  }

  // ─── Batch ops ─────────────────────────────────────────────────────────────

  const handleSyncPending = async () => {
    if (batchSyncing) return
    setBatchSyncing(true)
    setSyncMsg('Sincronizando elenco pendente...')
    try {
      const res = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, limit: 20 }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg(`✅ ${data.processed} produções · ${data.totalSynced} artistas importados`)
        refetchTable()
        fetchStats()
      } else {
        showMsg(`❌ Erro: ${data.error ?? 'falha ao sincronizar'}`)
      }
    } catch {
      showMsg('❌ Erro de rede')
    } finally {
      setBatchSyncing(false)
    }
  }

  const handleResetResync = async () => {
    if (resetSyncing || !confirm('Isso vai resetar e resincronizar o elenco de TODAS as produções. Pode levar vários minutos. Continuar?')) return
    setResetSyncing(true)
    setSyncMsg('Resetando elenco de todas as produções...')
    try {
      const resetRes = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      })
      const resetData = await resetRes.json()
      if (!resetRes.ok) { showMsg(`❌ Erro ao resetar: ${resetData.error ?? 'falha'}`); return }
      const total = resetData.total as number
      let processed = 0; let totalSynced = 0
      let keepGoing = true
      while (keepGoing) {
        setSyncMsg(`🔄 Resincronizando... ${processed}/${total} produções`)
        const batchRes = await fetch('/api/admin/productions/sync-cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pending: true, limit: 20 }),
        })
        const batchData = await batchRes.json()
        if (!batchRes.ok || batchData.processed === 0) { keepGoing = false; break }
        processed += batchData.processed as number
        totalSynced += batchData.totalSynced as number
      }
      showMsg(`✅ Resync completo: ${processed}/${total} produções · ${totalSynced} artistas`, 15000)
      refetchTable()
      fetchStats()
    } catch {
      showMsg('❌ Erro de rede durante o resync')
    } finally {
      setResetSyncing(false)
    }
  }

  // Reseta e resincroniza apenas produções com tmdbId mas sem tmdbType
  const handleFixNoTmdbType = async () => {
    if (fixNoTypeSyncing || !confirm('Isso vai recuperar produções com TMDB ID mas sem tipo (movie/tv) definido. Continuar?')) return
    setFixNoTypeSyncing(true)
    setSyncMsg('Corrigindo produções sem tmdbType...')
    try {
      const resetRes = await fetch('/api/admin/productions/sync-cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true, resetMode: 'no-tmdb-type' }),
      })
      const resetData = await resetRes.json()
      if (!resetRes.ok) { showMsg(`❌ Erro ao resetar: ${resetData.error ?? 'falha'}`); return }
      const total = resetData.resetCount as number
      if (total === 0) { showMsg('✅ Nenhuma produção com tmdbType ausente encontrada.'); return }
      let processed = 0; let totalSynced = 0; let keepGoing = true
      while (keepGoing) {
        setSyncMsg(`🔄 Corrigindo sem tmdbType... ${processed}/${total} produções`)
        const batchRes = await fetch('/api/admin/productions/sync-cast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pending: true, limit: 20 }),
        })
        const batchData = await batchRes.json()
        if (!batchRes.ok || batchData.processed === 0) { keepGoing = false; break }
        processed += batchData.processed as number
        totalSynced += batchData.totalSynced as number
      }
      showMsg(`✅ Correção concluída: ${processed}/${total} produções · ${totalSynced} artistas`, 15000)
      refetchTable()
      fetchStats()
    } catch {
      showMsg('❌ Erro de rede durante correção')
    } finally {
      setFixNoTypeSyncing(false)
    }
  }

  const handleBackfillPt = async () => {
    if (backfillRunning) return
    setBackfillRunning(true)
    setBackfillLog([])
    setBackfillStats(null)
    setBackfillProgress(null)

    const BATCH = 50
    let offset = 0
    let totalGlobal = 0
    let grandUpdated = 0; let grandNoChange = 0; let grandErrors = 0

    try {
      let keepRunning = true
      while (keepRunning) {
        const res = await fetch('/api/admin/productions/backfill-pt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year: backfillYear ? parseInt(backfillYear) : undefined, limit: BATCH, offset }),
        })
        if (!res.ok || !res.body) break

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let batchTotal = 0; let batchDone = false

        while (!batchDone) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          for (const rawLine of chunk.split('\n')) {
            const line = rawLine.trim()
            if (!line) continue

            if (line.startsWith('TOTAL_GLOBAL:')) {
              totalGlobal = parseInt(line.split(':')[1])
            } else if (line.startsWith('TOTAL:')) {
              batchTotal = parseInt(line.split(':')[1])
              if (batchTotal === 0) { batchDone = true; break }
            } else if (line.startsWith('PROGRESS:')) {
              const m = line.match(/PROGRESS:(\d+)\/(\d+):(.+)/)
              if (m) setBackfillProgress({ current: offset + parseInt(m[1]), total: totalGlobal, totalGlobal })
            } else if (line.startsWith('DONE:')) {
              const m = line.match(/updated=(\d+),noChange=(\d+).*errors=(\d+)/)
              if (m) { grandUpdated += parseInt(m[1]); grandNoChange += parseInt(m[2]); grandErrors += parseInt(m[3]) }
              batchDone = true
            } else if (line.startsWith('UPDATED:') || line.startsWith('ERROR:')) {
              setBackfillLog(prev => [...prev.slice(-199), line])
            }
          }
        }

        if (batchTotal < BATCH) { keepRunning = false; break }
        offset += BATCH
      }

      setBackfillStats({ updated: grandUpdated, noChange: grandNoChange, errors: grandErrors })
      setBackfillProgress(null)
      refetchTable()
    } catch {
      setBackfillLog(prev => [...prev, '❌ Erro de rede'])
    } finally {
      setBackfillRunning(false)
    }
  }

  const handleSyncAgeRating = async () => {
    if (ageSyncing) return
    setAgeSyncing(true)
    setSyncMsg('Buscando classificações no TMDB...')
    try {
      const res = await fetch('/api/admin/productions/sync-age-rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending: true, limit: 50 }),
      })
      const data = await res.json()
      if (res.ok) {
        const rem = data.remaining > 0 ? ` · ${data.remaining} ainda pendentes` : ' · Todas classificadas!'
        showMsg(`✅ ${data.updated} classificadas · ${data.notFound} sem dados${rem}`, 15000)
        refetchTable()
        fetchStats()
      } else {
        showMsg(`❌ Erro: ${data.error ?? 'falha ao classificar'}`)
      }
    } catch {
      showMsg('❌ Erro de rede')
    } finally {
      setAgeSyncing(false)
    }
  }

  // ─── Import by Period ──────────────────────────────────────────────────────

  const handleImportSearch = async (page = 1) => {
    setImportSearching(true); setImportMsg(''); setImportPage(page)
    try {
      const params = new URLSearchParams({ type: importType, year: importYear, sortBy: importSortBy, page: String(page) })
      if (importMonth !== '0') params.set('month', importMonth)
      const res = await fetch(`/api/admin/productions/import-by-period?${params}`)
      const data: PreviewResult = await res.json()
      if (!res.ok) { setImportMsg(`❌ Erro: ${(data as { error?: string }).error ?? 'falha'}`); return }
      setImportPreview(data)
      setImportSelected(new Set(data.results.filter((r) => !r.exists).map((r) => r.tmdbId)))
    } catch { setImportMsg('❌ Erro de rede') } finally { setImportSearching(false) }
  }

  const toggleSelect = (id: number) => {
    setImportSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const handleImport = async () => {
    if (importing || importSelected.size === 0 || !importPreview) return
    setImporting(true); setImportMsg('Importando produções...')
    try {
      const items = importPreview.results.filter(r => importSelected.has(r.tmdbId)).map(r => ({ tmdbId: r.tmdbId, type: r.tmdbType }))
      const res = await fetch('/api/admin/productions/import-by-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportMsg(`✅ ${data.created} importadas · ${data.skipped} já existiam · ${data.errors} erros`)
        refetchTable(); fetchStats()
        await handleImportSearch(importPage)
      } else {
        setImportMsg(`❌ Erro: ${data.error ?? 'falha na importação'}`)
      }
    } catch { setImportMsg('❌ Erro de rede') } finally { setImporting(false) }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  const handleCreate = () => { setEditingProduction(null); setFormOpen(true) }
  const handleDelete = (ids: string[]) => { setSelectedIds(ids); setDeleteOpen(true) }

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    if (data.year && typeof data.year === 'string') data.year = parseInt(data.year)
    const url = editingProduction ? `/api/admin/productions?id=${editingProduction.id}` : '/api/admin/productions'
    const res = await fetch(url, {
      method: editingProduction ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Erro ao salvar'); return }
    toast.saved()
    refetchTable(); fetchStats()
  }

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/admin/productions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) { const err = await res.json(); toast.error(err.error || 'Erro ao deletar'); return }
      toast.deleted(`${selectedIds.length} produção${selectedIds.length > 1 ? 'ões' : ''}`)
      setDeleteOpen(false)
      refetchTable(); fetchStats()
    } finally {
      setDeleteLoading(false)
    }
  }

  // ─── Table columns ─────────────────────────────────────────────────────────

  const columns: Column<Production>[] = [
    {
      key: 'imageUrl',
      label: 'Poster',
      render: (p) => p.imageUrl ? (
        <img src={p.imageUrl} alt={p.titlePt} className="w-10 h-14 rounded object-cover" />
      ) : (
        <div className="w-10 h-14 rounded bg-zinc-800 flex items-center justify-center">
          <Film size={14} className="text-zinc-600" />
        </div>
      ),
    },
    {
      key: 'titlePt',
      label: 'Título',
      sortable: true,
      render: (p) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-white text-sm">{p.titlePt}</span>
            <Link
              href={`/productions/${p.id}`}
              target="_blank"
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={11} />
            </Link>
          </div>
          {p.titleKr && <p className="text-xs text-zinc-500 mt-0.5">{p.titleKr}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      render: (p) => (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/20">
          {p.type}
        </span>
      ),
    },
    {
      key: 'year',
      label: 'Ano',
      sortable: true,
      render: (p) => p.year ? <span className="text-sm">{p.year}</span> : <span className="text-zinc-600">—</span>,
    },
    {
      key: 'ageRating',
      label: 'Faixa',
      render: (p) => p.ageRating ? (
        <span className={`px-2 py-0.5 rounded text-xs font-black border ${AGE_RATING_STYLES[p.ageRating] ?? 'bg-zinc-700/50 text-zinc-400'}`}>
          {p.ageRating === 'L' ? 'Livre' : `${p.ageRating}+`}
        </span>
      ) : <span className="text-zinc-600 text-xs">—</span>,
    },
    {
      key: 'artistsCount',
      label: 'Elenco',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-1">
          <Users size={12} className={p.artistsCount === 0 ? 'text-red-500/60' : 'text-zinc-600'} />
          <span className={`text-sm font-bold ${p.artistsCount === 0 ? 'text-red-400' : 'text-zinc-300'}`}>
            {p.artistsCount}
          </span>
        </div>
      ),
    },
  ]

  const newCount = importSelected.size

  return (
    <AdminLayout title="Produções" subtitle="Gerencie dramas, filmes e outras produções da plataforma">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-zinc-400 text-sm">Gerencie dramas, filmes e outras produções da plataforma</p>
              <Link href="/admin/translations?tab=production"
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 hover:border-purple-400/50 bg-purple-500/5 hover:bg-purple-500/10 px-2 py-0.5 rounded-full transition-colors flex-shrink-0">
                <Languages size={11} />
                Traduções
              </Link>
            </div>
            <StatsBar stats={stats} filter={filter} onFilter={setFilter} />
          </div>
          {/* Desktop: all buttons in a row */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <button
              onClick={handleSyncAgeRating}
              disabled={ageSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 text-xs"
            >
              <ShieldCheck size={13} className={ageSyncing ? 'animate-pulse' : ''} />
              {ageSyncing ? 'Classificando...' : 'Classificar Pendentes'}
            </button>
            <button
              onClick={handleSyncPending}
              disabled={batchSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 text-xs"
            >
              <RefreshCw size={13} className={batchSyncing ? 'animate-spin' : ''} />
              {batchSyncing ? 'Importando...' : 'Elenco Pendente'}
            </button>
            <button
              onClick={handleResetResync}
              disabled={resetSyncing}
              title="Reseta e reprocessa o elenco de TODAS as produções"
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/40 text-amber-400 font-bold rounded-lg transition-all disabled:opacity-50 text-xs"
            >
              <RotateCcw size={13} className={resetSyncing ? 'animate-spin' : ''} />
              {resetSyncing ? 'Resincronizando...' : 'Resync Completo'}
            </button>
            <button
              onClick={handleFixNoTmdbType}
              disabled={fixNoTypeSyncing}
              title="Recupera produções com TMDB ID mas sem tipo (movie/tv) — foram ignoradas pelo sync anterior"
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-700/40 text-orange-400 font-bold rounded-lg transition-all disabled:opacity-50 text-xs"
            >
              <RotateCcw size={13} className={fixNoTypeSyncing ? 'animate-spin' : ''} />
              {fixNoTypeSyncing ? 'Corrigindo...' : 'Corrigir sem Tipo'}
            </button>
            <button
              onClick={() => { setBackfillPanelOpen(v => !v); setImportPanelOpen(false) }}
              className={`flex items-center gap-1.5 px-3 py-2 border font-bold rounded-lg transition-all text-xs ${
                backfillPanelOpen ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <RefreshCw size={13} className={backfillRunning ? 'animate-spin' : ''} />
              Atualizar PT-BR
            </button>
            <Link
              href="/admin/productions/sync"
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all text-xs"
              title="Sincronizar dados do TMDB em lote para todas as produções"
            >
              <Star size={13} />
              Sync TMDB
            </Link>
            <button
              onClick={() => { setImportPanelOpen(v => !v); setImportMsg(''); setBackfillPanelOpen(false) }}
              className={`flex items-center gap-1.5 px-3 py-2 border font-bold rounded-lg transition-all text-xs ${
                importPanelOpen ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <CalendarSearch size={13} />
              Importar
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-xs"
            >
              <Plus size={13} />
              Nova
            </button>
          </div>

          {/* Mobile: primary actions + "Mais" dropdown */}
          <div className="sm:hidden flex items-center gap-1.5 w-full">
            <button
              onClick={handleSyncPending}
              disabled={batchSyncing}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 text-xs flex-1 justify-center"
            >
              <RefreshCw size={12} className={batchSyncing ? 'animate-spin' : ''} />
              Elenco
            </button>
            <button
              onClick={handleSyncAgeRating}
              disabled={ageSyncing}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all disabled:opacity-50 text-xs flex-1 justify-center"
            >
              <ShieldCheck size={12} className={ageSyncing ? 'animate-pulse' : ''} />
              Classificar
            </button>
            <button
              onClick={() => { setImportPanelOpen(v => !v); setImportMsg(''); setBackfillPanelOpen(false) }}
              className={`flex items-center gap-1.5 px-2.5 py-2 border font-bold rounded-lg transition-all text-xs flex-1 justify-center ${
                importPanelOpen ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <CalendarSearch size={12} />
              Importar
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-2.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all text-xs flex-1 justify-center"
            >
              <Plus size={12} />
              Nova
            </button>
            {/* More actions dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMoreActionsOpen(v => !v)}
                className="flex items-center gap-1 px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-bold rounded-lg transition-all text-xs"
              >
                <ChevronDown size={14} className={`transition-transform ${moreActionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreActionsOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden w-48">
                  <button
                    onClick={() => { setBackfillPanelOpen(v => !v); setImportPanelOpen(false); setMoreActionsOpen(false) }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-xs font-bold transition-colors border-b border-zinc-800 ${
                      backfillPanelOpen ? 'text-green-300 bg-green-500/10' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <RefreshCw size={12} className={backfillRunning ? 'animate-spin' : ''} />
                    Atualizar PT-BR
                  </button>
                  <Link
                    href="/admin/productions/sync"
                    onClick={() => setMoreActionsOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors border-b border-zinc-800"
                  >
                    <Star size={12} />
                    Sync TMDB
                  </Link>
                  <button
                    onClick={() => { handleResetResync(); setMoreActionsOpen(false) }}
                    disabled={resetSyncing}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-amber-400 hover:bg-amber-900/20 transition-colors border-b border-zinc-800 disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={resetSyncing ? 'animate-spin' : ''} />
                    Resync Completo
                  </button>
                  <button
                    onClick={() => { handleFixNoTmdbType(); setMoreActionsOpen(false) }}
                    disabled={fixNoTypeSyncing}
                    className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-orange-400 hover:bg-orange-900/20 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={fixNoTypeSyncing ? 'animate-spin' : ''} />
                    Corrigir sem Tipo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status message */}
        {syncMsg && (
          <div className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
            syncMsg.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : syncMsg.startsWith('🔄') ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {syncMsg.startsWith('🔄') && <RefreshCw size={14} className="animate-spin flex-shrink-0" />}
            {syncMsg.startsWith('❌') && <AlertCircle size={14} className="flex-shrink-0" />}
            {syncMsg}
          </div>
        )}

        {/* Backfill PT-BR Panel */}
        {backfillPanelOpen && (
          <div className="rounded-xl border border-green-500/20 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-green-400 uppercase tracking-widest">Atualizar Traduções PT-BR</h3>
              <button onClick={() => setBackfillPanelOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Busca título, sinopse e outras informações em português do TMDB para productions existentes.
              Edições manuais <strong className="text-zinc-300">não</strong> são sobrescritas.
              Filtre por ano para processar ano a ano.
            </p>

            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Ano (opcional)</label>
                <input
                  type="number"
                  value={backfillYear}
                  onChange={e => setBackfillYear(e.target.value)}
                  placeholder="Todos os anos"
                  className="w-36 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                  min={2000} max={2030}
                />
              </div>
              <button
                onClick={handleBackfillPt}
                disabled={backfillRunning}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-700/30 hover:bg-green-700/50 border border-green-600/40 text-green-300 font-bold rounded-lg transition-all disabled:opacity-50 text-sm"
              >
                <RefreshCw size={14} className={backfillRunning ? 'animate-spin' : ''} />
                {backfillRunning ? 'Atualizando...' : backfillYear ? `Atualizar ${backfillYear}` : 'Atualizar Tudo'}
              </button>
            </div>

            {/* Progress */}
            {backfillProgress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Progresso</span>
                  <span>{backfillProgress.current} / {backfillProgress.totalGlobal}</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (backfillProgress.current / backfillProgress.totalGlobal) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stats */}
            {backfillStats && (
              <div className="flex gap-4 text-xs">
                <span className="text-green-400 font-bold">✓ {backfillStats.updated} atualizados</span>
                <span className="text-zinc-500">{backfillStats.noChange} sem mudança</span>
                {backfillStats.errors > 0 && <span className="text-red-400">✗ {backfillStats.errors} erros</span>}
              </div>
            )}

            {/* Log */}
            {backfillLog.length > 0 && (
              <div className="bg-zinc-950 rounded-lg p-3 max-h-48 overflow-y-auto text-xs font-mono space-y-0.5">
                {backfillLog.map((line, i) => (
                  <div key={i} className={
                    line.startsWith('UPDATED') ? 'text-green-400' :
                    line.startsWith('ERROR') ? 'text-red-400' :
                    'text-zinc-500'
                  }>
                    {line.replace(/^UPDATED:/, '✓ ').replace(/^ERROR:/, '✗ ')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Import by Period Panel */}
        {importPanelOpen && (
          <div className="rounded-xl border border-cyan-500/20 bg-zinc-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest">Importar por Período</h3>
              <button onClick={() => setImportPanelOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Tipo</label>
                <select value={importType} onChange={e => setImportType(e.target.value as 'tv' | 'movie')} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm">
                  <option value="tv">K-Drama / Série</option>
                  <option value="movie">Filme</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Ano</label>
                <input type="number" value={importYear} onChange={e => setImportYear(e.target.value)} min="1990" max="2030" className="w-24 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Mês</label>
                <select value={importMonth} onChange={e => setImportMonth(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm">
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500 font-bold uppercase">Ordenar</label>
                <select value={importSortBy} onChange={e => setImportSortBy(e.target.value)} className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm">
                  <option value="popularity.desc">Popularidade</option>
                  <option value="vote_average.desc">Melhor avaliados</option>
                  <option value="first_air_date.desc">Mais recentes</option>
                  <option value="first_air_date.asc">Mais antigos</option>
                </select>
              </div>
              <button onClick={() => handleImportSearch(1)} disabled={importSearching} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg disabled:opacity-50 text-sm">
                {importSearching ? 'Buscando...' : 'Buscar no TMDB'}
              </button>
            </div>

            {importMsg && (
              <div className={`px-3 py-2 rounded-lg text-sm font-medium ${importMsg.startsWith('✅') ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
                {importMsg}
              </div>
            )}

            {importPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>{importPreview.total} resultados · página {importPreview.page}/{importPreview.totalPages}</span>
                  <button
                    onClick={() => setImportSelected(new Set(importPreview.results.filter(r => !r.exists).map(r => r.tmdbId)))}
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Selecionar todos novos
                  </button>
                </div>
                <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden max-h-[460px] overflow-y-auto">
                  {importPreview.results.map(item => (
                    <label key={item.tmdbId} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${item.exists ? 'bg-zinc-900/40 opacity-60' : importSelected.has(item.tmdbId) ? 'bg-cyan-500/5 hover:bg-cyan-500/10' : 'bg-zinc-900/20 hover:bg-zinc-800/40'}`}>
                      <input type="checkbox" checked={importSelected.has(item.tmdbId)} onChange={() => !item.exists && toggleSelect(item.tmdbId)} disabled={item.exists} className="accent-cyan-500 w-4 h-4 flex-shrink-0" />
                      {item.posterUrl ? (
                        <Image src={item.posterUrl} alt={item.name} width={32} height={48} className="rounded object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-12 rounded bg-zinc-800 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-200 truncate">{item.name}</p>
                        {item.originalName && <p className="text-xs text-zinc-500 truncate">{item.originalName}</p>}
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {item.date ? item.date.slice(0, 7) : '—'}
                          {item.voteAverage > 0 && (
                            <span className="ml-2 inline-flex items-center gap-0.5 text-yellow-600">
                              <Star size={10} /> {item.voteAverage.toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-black px-2 py-0.5 rounded-full border ${item.exists ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'}`}>
                        {item.exists ? '✓ Existe' : '+ Novo'}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleImportSearch(importPage - 1)} disabled={importPage <= 1 || importSearching} className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-400">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs text-zinc-500">{importPage} / {importPreview.totalPages}</span>
                    <button onClick={() => handleImportSearch(importPage + 1)} disabled={importPage >= importPreview.totalPages || importSearching} className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-400">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500">{newCount} selecionada{newCount !== 1 ? 's' : ''}</span>
                    <button onClick={handleImport} disabled={importing || newCount === 0} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg disabled:opacity-50 text-sm">
                      {importing ? 'Importando...' : `Importar ${newCount > 0 ? newCount : ''} Produção${newCount !== 1 ? 'ões' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Table */}
        <DataTable<Production>
          columns={columns}
          apiUrl="/api/admin/productions"
          extraParams={filter ? { filter } : undefined}
          editHref={(p) => `/admin/productions/${p.id}`}
          onDelete={handleDelete}
          searchPlaceholder="Buscar por título..."
          renderMobileCard={(production) => (
            <div className="flex items-start gap-3 p-3 hover:bg-zinc-900/30 transition-colors">
              {/* Poster */}
              <div className="flex-shrink-0">
                {production.imageUrl ? (
                  <img src={production.imageUrl} alt={production.titlePt} className="w-10 h-14 rounded object-cover" />
                ) : (
                  <div className="w-10 h-14 rounded bg-zinc-800 flex items-center justify-center">
                    <Film size={14} className="text-zinc-600" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-white text-sm truncate">{production.titlePt}</p>
                      <Link href={`/productions/${production.id}`} target="_blank" className="text-zinc-600 hover:text-zinc-400 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                    {production.titleKr && <p className="text-xs text-zinc-500 truncate">{production.titleKr}</p>}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setCastModalProduction(production)}
                      title="Gerenciar elenco"
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        production.artistsCount === 0
                          ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                          : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      <Users size={11} />
                      <span>{production.artistsCount}</span>
                    </button>
                    <button
                      onClick={() => handleSyncAgeRatingOne(production)}
                      disabled={ageSyncingId === production.id || !production.tmdbId}
                      title={production.tmdbId ? (production.ageRating ? `Reclassificar (atual: ${production.ageRating})` : 'Classificar no TMDB') : 'Sem TMDB ID'}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-40 ${
                        production.ageRating
                          ? AGE_RATING_STYLES[production.ageRating] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'
                          : 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      <ShieldCheck size={11} className={ageSyncingId === production.id ? 'animate-pulse' : ''} />
                      <span>{ageSyncingId === production.id ? '...' : production.ageRating ? (production.ageRating === 'L' ? 'L' : `${production.ageRating}+`) : '—'}</span>
                    </button>
                    <Link
                      href={`/admin/productions/${production.id}`}
                      className="text-xs px-2 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors font-bold"
                    >
                      Editar
                    </Link>
                  </div>
                </div>
                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/20">{production.type}</span>
                  {production.year && <span className="text-xs text-zinc-500">{production.year}</span>}
                  {production.ageRating && (
                    <span className={`px-1.5 py-0.5 rounded text-xs font-black border ${AGE_RATING_STYLES[production.ageRating] ?? 'bg-zinc-700/50 text-zinc-400'}`}>
                      {production.ageRating === 'L' ? 'Livre' : `${production.ageRating}+`}
                    </span>
                  )}
                  {!production.tmdbId && (
                    <span className="text-[10px] text-zinc-600 font-bold">sem TMDB</span>
                  )}
                </div>
              </div>
            </div>
          )}
          actions={(production) => (
            <div className="flex items-center gap-1">
              {/* Cast button → opens modal */}
              <button
                onClick={() => setCastModalProduction(production)}
                title="Gerenciar elenco"
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  production.artistsCount === 0
                    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400'
                    : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-400'
                }`}
              >
                <Users size={12} />
                <span>{production.artistsCount}</span>
              </button>

              {/* Age rating button → sync from TMDB */}
              <button
                onClick={() => handleSyncAgeRatingOne(production)}
                disabled={ageSyncingId === production.id || !production.tmdbId}
                title={production.tmdbId ? (production.ageRating ? `Reclassificar (atual: ${production.ageRating})` : 'Classificar no TMDB') : 'Sem TMDB ID'}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition-all disabled:opacity-40 ${
                  production.ageRating
                    ? AGE_RATING_STYLES[production.ageRating] ?? 'bg-zinc-700 text-zinc-400 border-zinc-600'
                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/20 text-yellow-400'
                }`}
              >
                <ShieldCheck size={12} className={ageSyncingId === production.id ? 'animate-pulse' : ''} />
                <span>
                  {ageSyncingId === production.id ? '...'
                    : production.ageRating
                    ? (production.ageRating === 'L' ? 'L' : `${production.ageRating}+`)
                    : '—'}
                </span>
              </button>
            </div>
          )}
        />
      </div>

      {/* Cast Modal */}
      {castModalProduction && (
        <CastModal
          production={castModalProduction}
          onClose={() => setCastModalProduction(null)}
          onSyncCast={handleSyncCast}
        />
      )}

      <FormModal
        title={editingProduction ? 'Editar Produção' : 'Nova Produção'}
        fields={formFields}
        initialData={editingProduction ? (editingProduction as unknown as Record<string, unknown>) : undefined}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Excluir ${selectedIds.length} produção${selectedIds.length > 1 ? 'ões' : ''}?`}
        description="Esta ação não pode ser desfeita. Os dados serão removidos permanentemente."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
      />
    </AdminLayout>
  )
}
