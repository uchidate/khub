'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Link2,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Users,
  Calendar,
  Ruler,
  Droplets,
  Briefcase,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Suggestion = {
  id: string
  kpoppingIdolId: string
  kpoppingGroupId: string
  // Dados kpopping – idol
  idolName: string
  idolNameHangul: string | null
  idolBirthday: string | null
  idolImageUrl: string | null
  idolHeight: number | null
  idolBloodType: string | null
  idolPosition: string | null
  idolIsActive: boolean
  idolProfileUrl: string | null
  // Dados kpopping – grupo
  groupName: string
  groupNameHangul: string | null
  groupImageUrl: string | null
  groupDebutDate: string | null
  groupAgency: string | null
  groupStatus: string | null
  // Match
  artistMatchScore: number | null
  artistMatchReason: string | null
  groupMatchScore: number | null
  groupMatchReason: string | null
  // Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedAt: string | null
  reviewNotes: string | null
  // Relações HallyuHub
  artist: HallyuArtist | null
  musicalGroup: HallyuGroup | null
}

type HallyuArtist = {
  id: string
  nameRomanized: string
  nameHangul: string | null
  birthDate: string | null
  primaryImageUrl: string | null
  height: string | null
  bloodType: string | null
  memberships: { group: { id: string; name: string } }[]
}

type HallyuGroup = {
  id: string
  name: string
  nameHangul: string | null
  profileImageUrl: string | null
  debutDate: string | null
  agency: { name: string } | null
}

type SearchResult = {
  id: string
  nameRomanized?: string
  name?: string
  nameHangul: string | null
  primaryImageUrl?: string
  profileImageUrl?: string
  birthDate?: string | null
  debutDate?: string | null
  height?: string | null
  bloodType?: string | null
  agency?: { name: string } | null
}

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED'
type MatchFilter = 'all' | 'has_artist' | 'no_artist' | 'has_group' | 'no_group'

type GenerateStats = {
  processed: number
  created: number
  updated: number
  skipped: number
  errors: number
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-zinc-500'
  if (score >= 0.95) return 'text-green-400'
  if (score >= 0.85) return 'text-yellow-400'
  return 'text-orange-400'
}

function scoreLabel(score: number | null, reason: string | null): string {
  if (score === null) return 'sem match'
  return `${Math.round(score * 100)}% — ${reason ?? ''}`
}

// ─── Componente de busca inline ───────────────────────────────────────────────

function InlineSearch({
  type,
  onSelect,
  placeholder,
}: {
  type: 'artist' | 'group'
  onSelect: (result: SearchResult) => void
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const endpoint = type === 'artist'
          ? `/api/admin/kpopping/artists/search?q=${encodeURIComponent(q)}`
          : `/api/admin/kpopping/groups/search?q=${encodeURIComponent(q)}`
        const res = await fetch(endpoint)
        const data = await res.json()
        setResults(data.items ?? [])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [q, type])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2">
        <Search size={14} className="text-zinc-500 flex-shrink-0" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none w-full"
        />
        {loading && <RefreshCw size={12} className="animate-spin text-zinc-500" />}
      </div>
      {results.length > 0 && (
        <ul className="absolute z-20 top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
          {results.map(r => (
            <li key={r.id}>
              <button
                onClick={() => { onSelect(r); setQ(''); setResults([]) }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-zinc-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-700 flex-shrink-0">
                  {(r.primaryImageUrl || r.profileImageUrl) ? (
                    <img
                      src={r.primaryImageUrl || r.profileImageUrl!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      {type === 'artist' ? <User size={14} /> : <Users size={14} />}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {r.nameRomanized || r.name}
                  </p>
                  {r.nameHangul && (
                    <p className="text-xs text-zinc-400">{r.nameHangul}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Card de sugestão ─────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAction,
}: {
  suggestion: Suggestion
  onAction: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const [overrideArtist, setOverrideArtist] = useState<SearchResult | null>(null)
  const [overrideGroup, setOverrideGroup] = useState<SearchResult | null>(null)

  const effectiveArtist = overrideArtist ?? (suggestion.artist ? {
    id: suggestion.artist.id,
    nameRomanized: suggestion.artist.nameRomanized,
    nameHangul: suggestion.artist.nameHangul,
    primaryImageUrl: suggestion.artist.primaryImageUrl,
    birthDate: suggestion.artist.birthDate,
    height: suggestion.artist.height,
    bloodType: suggestion.artist.bloodType,
  } : null)

  const effectiveGroup = overrideGroup ?? (suggestion.musicalGroup ? {
    id: suggestion.musicalGroup.id,
    name: suggestion.musicalGroup.name,
    nameHangul: suggestion.musicalGroup.nameHangul,
    profileImageUrl: suggestion.musicalGroup.profileImageUrl,
    debutDate: suggestion.musicalGroup.debutDate,
    agency: suggestion.musicalGroup.agency,
  } : null)

  async function doAction(action: 'approve' | 'reject' | 'revoke') {
    if (action === 'approve' && (!effectiveArtist || !effectiveGroup)) {
      alert('Selecione um artista e um grupo antes de aprovar.')
      return
    }

    setProcessing(true)
    try {
      const body: Record<string, unknown> = { action, notes }
      if (action === 'approve') {
        body.artistId = effectiveArtist!.id
        body.musicalGroupId = effectiveGroup!.id
        body.isActive = suggestion.idolIsActive
        body.role = suggestion.idolPosition ?? undefined
      }

      const res = await fetch(`/api/admin/kpopping/suggestions/${suggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Erro ao processar')
      }
      onAction()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setProcessing(false)
    }
  }

  const statusBadge = {
    PENDING: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    APPROVED: 'bg-green-500/10 border-green-500/30 text-green-400',
    REJECTED: 'bg-red-500/10 border-red-500/30 text-red-400',
  }[suggestion.status]

  const statusLabel = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
  }[suggestion.status]

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">

      {/* Header do card */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge}`}>
            {statusLabel}
          </span>
          {suggestion.reviewedAt && (
            <span className="text-xs text-zinc-500">
              em {formatDate(suggestion.reviewedAt)}
            </span>
          )}
          {suggestion.reviewNotes && (
            <span className="text-xs text-zinc-500 italic">"{suggestion.reviewNotes}"</span>
          )}
        </div>
        {suggestion.idolIsActive ? (
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
            Ativo no grupo
          </span>
        ) : (
          <span className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full">
            Ex-membro
          </span>
        )}
      </div>

      {/* Comparação lado a lado — Idol */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Kpopping – Idol */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Link2 size={12} /> Kpopping
          </p>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
              {suggestion.idolImageUrl ? (
                <img src={suggestion.idolImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <User size={24} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm">{suggestion.idolName}</p>
              {suggestion.idolNameHangul && (
                <p className="text-xs text-zinc-400">{suggestion.idolNameHangul}</p>
              )}
              {suggestion.idolPosition && (
                <p className="text-xs text-purple-300 mt-0.5">{suggestion.idolPosition}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                {suggestion.idolBirthday && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(suggestion.idolBirthday)}
                  </span>
                )}
                {suggestion.idolHeight && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Ruler size={10} /> {suggestion.idolHeight}cm
                  </span>
                )}
                {suggestion.idolBloodType && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Droplets size={10} /> {suggestion.idolBloodType}
                  </span>
                )}
              </div>
            </div>
          </div>
          {suggestion.idolProfileUrl && (
            <a
              href={suggestion.idolProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-xs text-purple-400 hover:underline block"
            >
              Ver no kpopping.com →
            </a>
          )}
        </div>

        {/* HallyuHub – Artist */}
        <div className={`rounded-xl p-4 border transition-colors ${
          effectiveArtist
            ? 'bg-zinc-800/50 border-zinc-700'
            : 'bg-zinc-900 border-dashed border-zinc-700'
        }`}>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <User size={12} /> HallyuHub — Artista
            {suggestion.artistMatchScore !== null && !overrideArtist && (
              <span className={`ml-auto text-xs font-normal ${scoreColor(suggestion.artistMatchScore)}`}>
                {scoreLabel(suggestion.artistMatchScore, suggestion.artistMatchReason)}
              </span>
            )}
            {overrideArtist && (
              <span className="ml-auto text-xs font-normal text-blue-400">selecionado manualmente</span>
            )}
          </p>

          {effectiveArtist ? (
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                {effectiveArtist.primaryImageUrl ? (
                  <img src={effectiveArtist.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">{effectiveArtist.nameRomanized}</p>
                {effectiveArtist.nameHangul && (
                  <p className="text-xs text-zinc-400">{effectiveArtist.nameHangul}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
                  {effectiveArtist.birthDate && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(effectiveArtist.birthDate)}
                    </span>
                  )}
                  {effectiveArtist.height && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Ruler size={10} /> {effectiveArtist.height}
                    </span>
                  )}
                  {effectiveArtist.bloodType && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Droplets size={10} /> {effectiveArtist.bloodType}
                    </span>
                  )}
                </div>
                <Link
                  href={`/artists/${effectiveArtist.id}`}
                  target="_blank"
                  className="mt-2 text-xs text-blue-400 hover:underline block"
                >
                  Ver perfil →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 mb-3">
              <AlertTriangle size={16} />
              <p className="text-sm">Sem correspondência automática</p>
            </div>
          )}

          {/* Busca manual */}
          <div className="mt-3">
            <InlineSearch
              type="artist"
              placeholder="Buscar artista..."
              onSelect={r => setOverrideArtist(r)}
            />
          </div>
          {overrideArtist && (
            <button
              onClick={() => setOverrideArtist(null)}
              className="mt-1 text-xs text-zinc-500 hover:text-zinc-400"
            >
              ✕ Remover seleção manual
            </button>
          )}
        </div>
      </div>

      {/* Comparação — Grupo */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Kpopping – Group */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Users size={12} /> Kpopping — Grupo
          </p>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
              {suggestion.groupImageUrl ? (
                <img src={suggestion.groupImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <Users size={18} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm">{suggestion.groupName}</p>
              {suggestion.groupNameHangul && (
                <p className="text-xs text-zinc-400">{suggestion.groupNameHangul}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {suggestion.groupDebutDate && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Calendar size={10} /> Estreia: {formatDate(suggestion.groupDebutDate)}
                  </span>
                )}
                {suggestion.groupAgency && (
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Briefcase size={10} /> {suggestion.groupAgency}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* HallyuHub – Group */}
        <div className={`rounded-xl p-4 border transition-colors ${
          effectiveGroup
            ? 'bg-zinc-800/50 border-zinc-700'
            : 'bg-zinc-900 border-dashed border-zinc-700'
        }`}>
          <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1">
            <Users size={12} /> HallyuHub — Grupo
            {suggestion.groupMatchScore !== null && !overrideGroup && (
              <span className={`ml-auto text-xs font-normal ${scoreColor(suggestion.groupMatchScore)}`}>
                {scoreLabel(suggestion.groupMatchScore, suggestion.groupMatchReason)}
              </span>
            )}
            {overrideGroup && (
              <span className="ml-auto text-xs font-normal text-blue-400">selecionado manualmente</span>
            )}
          </p>

          {effectiveGroup ? (
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                {effectiveGroup.profileImageUrl ? (
                  <img src={effectiveGroup.profileImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <Users size={18} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm">{effectiveGroup.name}</p>
                {effectiveGroup.nameHangul && (
                  <p className="text-xs text-zinc-400">{effectiveGroup.nameHangul}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {effectiveGroup.debutDate && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Calendar size={10} /> Estreia: {formatDate(effectiveGroup.debutDate)}
                    </span>
                  )}
                  {effectiveGroup.agency?.name && (
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Briefcase size={10} /> {effectiveGroup.agency.name}
                    </span>
                  )}
                </div>
                <Link
                  href={`/groups/${effectiveGroup.id}`}
                  target="_blank"
                  className="mt-1 text-xs text-blue-400 hover:underline block"
                >
                  Ver grupo →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500 mb-3">
              <AlertTriangle size={16} />
              <p className="text-sm">Sem correspondência automática</p>
            </div>
          )}

          {/* Busca manual */}
          <div className="mt-3">
            <InlineSearch
              type="group"
              placeholder="Buscar grupo..."
              onSelect={r => setOverrideGroup(r)}
            />
          </div>
          {overrideGroup && (
            <button
              onClick={() => setOverrideGroup(null)}
              className="mt-1 text-xs text-zinc-500 hover:text-zinc-400"
            >
              ✕ Remover seleção manual
            </button>
          )}
        </div>
      </div>

      {/* Notas + Ações */}
      <div className="border-t border-zinc-800 pt-4">
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas (opcional)..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600 mb-3"
        />

        <div className="flex items-center gap-3 flex-wrap">
          {suggestion.status === 'PENDING' && (
            <>
              <button
                onClick={() => doAction('approve')}
                disabled={processing || !effectiveArtist || !effectiveGroup}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {processing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Aprovar vínculo
              </button>
              <button
                onClick={() => doAction('reject')}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
              >
                {processing ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                Rejeitar
              </button>
            </>
          )}

          {suggestion.status === 'APPROVED' && (
            <button
              onClick={() => {
                if (!confirm('Revogar este vínculo removerá a associação artista-grupo. Continuar?')) return
                doAction('revoke')
              }}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            >
              {processing ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
              Revogar vínculo
            </button>
          )}

          {suggestion.status === 'REJECTED' && (
            <button
              onClick={() => {
                setNotes('')
                doAction('approve')
              }}
              disabled={processing || !effectiveArtist || !effectiveGroup}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Aprovar mesmo assim
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function KpoppingCurationPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateStats, setGenerateStats] = useState<GenerateStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING')
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: String(page),
        limit: '15',
      })
      if (matchFilter === 'has_artist') params.set('hasArtist', 'true')
      if (matchFilter === 'no_artist') params.set('hasArtist', 'false')
      if (matchFilter === 'has_group') params.set('hasGroup', 'true')
      if (matchFilter === 'no_group') params.set('hasGroup', 'false')

      const res = await fetch(`/api/admin/kpopping/suggestions?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao buscar sugestões')

      setSuggestions(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, matchFilter, page])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  async function generateSuggestions() {
    setGenerating(true)
    setGenerateStats(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/kpopping/suggestions/generate', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao gerar sugestões')
      setGenerateStats(data.stats)
      setMessage({ type: 'success', text: 'Sugestões geradas com sucesso!' })
      await fetchSuggestions()
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Erro desconhecido' })
    } finally {
      setGenerating(false)
    }
  }

  function handleStatusChange(s: StatusFilter) {
    setStatusFilter(s)
    setMatchFilter('all')
    setPage(1)
  }

  function handleMatchChange(m: MatchFilter) {
    setMatchFilter(m)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-purple-500 hover:text-purple-400 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Voltar ao Admin
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link2 className="text-purple-500" size={40} />
              <div>
                <h1 className="text-4xl font-black text-white">Curadoria Kpopping</h1>
                <p className="text-zinc-400 mt-1">
                  Revise e aprove vínculos artista-grupo da base kpopping.com
                </p>
              </div>
            </div>

            {/* Botão Gerar */}
            <button
              onClick={generateSuggestions}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {generating
                ? <RefreshCw size={18} className="animate-spin" />
                : <Sparkles size={18} />}
              {generating ? 'Gerando...' : 'Gerar Sugestões'}
            </button>
          </div>
        </div>

        {/* Stats de geração */}
        {generateStats && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 grid grid-cols-5 gap-4 text-center">
            {[
              { label: 'Processados', value: generateStats.processed, color: 'text-white' },
              { label: 'Criados', value: generateStats.created, color: 'text-green-400' },
              { label: 'Atualizados', value: generateStats.updated, color: 'text-blue-400' },
              { label: 'Ignorados', value: generateStats.skipped, color: 'text-zinc-400' },
              { label: 'Erros', value: generateStats.errors, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`border rounded-xl p-4 flex items-start gap-3 mb-6 ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            {message.type === 'success'
              ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6 space-y-3">
          {/* Status */}
          <div className="flex flex-wrap gap-2">
            {([
              ['PENDING', 'Pendentes'],
              ['APPROVED', 'Aprovados'],
              ['REJECTED', 'Rejeitados'],
            ] as [StatusFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleStatusChange(val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === val
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-sm text-zinc-500 self-center">
              {total} sugestão{total !== 1 ? 'ões' : ''}
            </span>
          </div>

          {/* Match */}
          <div className="flex flex-wrap gap-2">
            {([
              ['all', 'Todos'],
              ['has_artist', 'Com artista'],
              ['no_artist', 'Sem artista'],
              ['has_group', 'Com grupo'],
              ['no_group', 'Sem grupo'],
            ] as [MatchFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleMatchChange(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  matchFilter === val
                    ? 'bg-zinc-700 text-white border border-zinc-600'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma sugestão encontrada</h3>
            <p className="text-zinc-400 mb-4">
              {statusFilter === 'PENDING'
                ? 'Não há sugestões pendentes. Clique em "Gerar Sugestões" para processar a base kpopping.'
                : `Nenhuma sugestão ${statusFilter === 'APPROVED' ? 'aprovada' : 'rejeitada'} com estes filtros.`}
            </p>
            {statusFilter === 'PENDING' && (
              <button
                onClick={generateSuggestions}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Sparkles size={16} />
                Gerar agora
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {suggestions.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAction={() => {
                  setMessage({ type: 'success', text: 'Ação realizada com sucesso!' })
                  fetchSuggestions()
                }}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-zinc-400 text-sm">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
