'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { CheckCircle, XCircle, RotateCcw, Search, Users, Music, Link2, RefreshCw, ChevronLeft, ChevronRight, Star, ChevronDown, ChevronUp } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'

// ─── Types ────────────────────────────────────────────────────────────────────

interface IdolItem {
  kpoppingIdolId: string
  idolName: string
  idolNameHangul?: string
  idolBirthday?: string
  idolImageUrl?: string
  idolHeight?: number
  idolBloodType?: string
  idolProfileUrl?: string
  artistId?: string
  artistMatchScore?: number
  artistMatchReason?: string
  artist?: {
    id: string
    nameRomanized: string
    nameHangul?: string
    primaryImageUrl?: string
    birthDate?: string
  }
  groupCount: number
}

interface GroupItem {
  kpoppingGroupId: string
  groupName: string
  groupNameHangul?: string
  groupImageUrl?: string
  groupDebutDate?: string
  groupAgency?: string
  groupStatus?: string
  musicalGroupId?: string
  groupMatchScore?: number
  groupMatchReason?: string
  musicalGroup?: {
    id: string
    name: string
    nameHangul?: string
    profileImageUrl?: string
    debutDate?: string
    agency?: { name: string }
  }
  memberCount: number
}

interface GroupMemberItem {
  kpoppingIdolId: string
  idolName: string
  idolNameHangul?: string
  idolBirthday?: string
  idolImageUrl?: string
  idolPosition?: string
  idolIsActive: boolean
  artistId?: string
  artistMatchScore?: number
  artistMatchReason?: string
  artist?: { id: string; nameRomanized: string; nameHangul?: string; primaryImageUrl?: string }
}

interface MembershipItem {
  id: string
  kpoppingIdolId: string
  kpoppingGroupId: string
  idolName: string
  idolNameHangul?: string
  groupName: string
  idolPosition?: string
  idolIsActive: boolean
  artistId: string
  musicalGroupId: string
  artist: { nameRomanized: string; nameHangul?: string; primaryImageUrl?: string }
  musicalGroup: { name: string; nameHangul?: string; profileImageUrl?: string }
}

interface TMDBResult {
  tmdbId: number
  name: string
  profilePath?: string
  knownForDepartment: string
  popularity: number
  knownFor: string[]
  alreadyExists: boolean
}

interface SearchHit {
  id: string
  nameRomanized?: string
  name?: string
  nameHangul?: string
  primaryImageUrl?: string
  profileImageUrl?: string
  birthDate?: string
  debutDate?: string
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  totalPages: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score?: number | null) {
  if (!score) return 'text-gray-400'
  if (score >= 0.95) return 'text-green-400'
  if (score >= 0.85) return 'text-yellow-400'
  return 'text-orange-400'
}

function reasonLabel(reason?: string | null) {
  if (!reason) return null
  const map: Record<string, string> = {
    exact_hangul: '한자 정확',
    exact_romanized: 'Exato',
    icase_romanized: 'Case-insensitive',
    normalized_romanized: 'Normalizado',
    user_confirmed: 'Confirmado',
    user_rejected: 'Rejeitado',
  }
  return map[reason] ?? reason
}

function formatDate(d?: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function avatarPlaceholder(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=80&background=1f2937&color=9ca3af`
}

// ─── Inline Typeahead Search ───────────────────────────────────────────────────

function InlineSearch({
  type,
  placeholder,
  onSelect,
}: {
  type: 'artist' | 'group'
  placeholder: string
  onSelect: (item: SearchHit) => void
}) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const endpoint = type === 'artist'
    ? '/api/admin/kpopping/artists/search'
    : '/api/admin/kpopping/groups/search'

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.items || [])
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  const handleChange = (val: string) => {
    setQ(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 300)
  }

  return (
    <div className="relative mt-2">
      <input
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
        placeholder={placeholder}
        value={q}
        onChange={e => handleChange(e.target.value)}
      />
      {loading && <span className="absolute right-2 top-2 text-xs text-gray-500">...</span>}
      {results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg max-h-48 overflow-y-auto">
          {results.map(item => (
            <li
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => { onSelect(item); setQ(''); setResults([]) }}
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                <Image
                  src={(item.primaryImageUrl || item.profileImageUrl) ?? avatarPlaceholder(item.nameRomanized ?? item.name ?? '')}
                  alt=""
                  width={28}
                  height={28}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <div>
                <span className="text-sm text-gray-200">{item.nameRomanized ?? item.name}</span>
                {item.nameHangul && <span className="text-xs text-gray-500 ml-1">{item.nameHangul}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── TMDB Search Panel ─────────────────────────────────────────────────────────

function TMDBPanel({
  idolName,
  kpoppingIdolId,
  onConfirmed,
}: {
  idolName: string
  kpoppingIdolId: string
  onConfirmed: (artist: { id: string; nameRomanized: string; nameHangul?: string; primaryImageUrl?: string }) => void
}) {
  const [results, setResults] = useState<TMDBResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/admin/kpopping/tmdb/search?q=${encodeURIComponent(idolName)}`)
      const data = await res.json()
      setResults(data.items || [])
    } finally {
      setLoading(false)
    }
  }, [idolName])

  useEffect(() => { doSearch() }, [doSearch])

  const addArtist = async (tmdbId: number) => {
    setAdding(tmdbId)
    try {
      const res = await fetch('/api/admin/kpopping/tmdb/add-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId, kpoppingIdolId }),
      })
      const data = await res.json()
      if (data.ok) onConfirmed(data.artist)
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="mt-3 bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Resultados TMDB</span>
        <button onClick={doSearch} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <RefreshCw size={10} /> Refazer
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500 py-2">Buscando...</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-xs text-gray-500 py-2">Nenhum resultado encontrado no TMDB.</p>
      )}

      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.tmdbId} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              {r.profilePath ? (
                <Image src={r.profilePath} alt={r.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{r.name}</p>
              <p className="text-xs text-gray-500">
                {r.knownForDepartment} · ★ {r.popularity.toFixed(1)}
                {r.knownFor.length > 0 && ` · ${r.knownFor.join(', ')}`}
              </p>
            </div>
            {r.alreadyExists ? (
              <span className="text-xs text-yellow-500 flex-shrink-0">Já existe</span>
            ) : (
              <button
                onClick={() => addArtist(r.tmdbId)}
                disabled={adding === r.tmdbId}
                className="flex-shrink-0 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-2 py-1 rounded"
              >
                {adding === r.tmdbId ? '...' : '+ Criar'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── TMDB Group Search Panel ──────────────────────────────────────────────────

interface TMDBGroupResult {
  tmdbId: number
  mediaType: string
  name: string
  imagePath?: string
  firstAirDate?: string
  popularity: number
  existingGroupId?: string
  existingGroupName?: string
}

function TMDBGroupPanel({
  groupName,
  kpoppingGroupId,
  onConfirmed,
}: {
  groupName: string
  kpoppingGroupId: string
  onConfirmed: (group: { id: string; name: string; nameHangul?: string; profileImageUrl?: string }) => void
}) {
  const [results, setResults] = useState<TMDBGroupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState<number | null>(null)
  const [searched, setSearched] = useState(false)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/admin/kpopping/tmdb/search-group?q=${encodeURIComponent(groupName)}`)
      const data = await res.json()
      setResults(data.items || [])
    } finally {
      setLoading(false)
    }
  }, [groupName])

  useEffect(() => { doSearch() }, [doSearch])

  const addGroup = async (r: TMDBGroupResult) => {
    setAdding(r.tmdbId)
    try {
      const res = await fetch('/api/admin/kpopping/tmdb/add-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: r.name,
          imagePath: r.imagePath,
          firstAirDate: r.firstAirDate,
          kpoppingGroupId,
        }),
      })
      const data = await res.json()
      if (data.ok) onConfirmed(data.group)
    } finally {
      setAdding(null)
    }
  }

  const mediaLabel: Record<string, string> = { tv: 'TV Show', movie: 'Filme', person: 'Pessoa' }

  return (
    <div className="mt-3 bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Resultados TMDB</span>
        <button onClick={doSearch} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <RefreshCw size={10} /> Refazer
        </button>
      </div>

      {loading && <p className="text-xs text-gray-500 py-2">Buscando...</p>}

      {!loading && searched && results.length === 0 && (
        <p className="text-xs text-gray-500 py-2">Nenhum resultado encontrado no TMDB.</p>
      )}

      <ul className="space-y-2">
        {results.map(r => (
          <li key={r.tmdbId} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
              {r.imagePath ? (
                <Image src={r.imagePath} alt={r.name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 truncate">{r.name}</p>
              <p className="text-xs text-gray-500">
                {mediaLabel[r.mediaType] ?? r.mediaType} · ★ {r.popularity.toFixed(1)}
                {r.firstAirDate && ` · ${r.firstAirDate.slice(0, 4)}`}
              </p>
            </div>
            {r.existingGroupId ? (
              <span className="text-xs text-yellow-500 flex-shrink-0">Já existe</span>
            ) : (
              <button
                onClick={() => addGroup(r)}
                disabled={adding === r.tmdbId}
                className="flex-shrink-0 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-2 py-1 rounded"
              >
                {adding === r.tmdbId ? '...' : '+ Criar'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Idol Card ─────────────────────────────────────────────────────────────────

function IdolCard({
  idol,
}: {
  idol: IdolItem
}) {
  const [pending, setPending] = useState(false)
  const [showTMDB, setShowTMDB] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [localArtist, setLocalArtist] = useState(idol.artist)
  const [localArtistId, setLocalArtistId] = useState(idol.artistId)
  const [localReason, setLocalReason] = useState(idol.artistMatchReason)

  const isConfirmed = localReason === 'user_confirmed'
  const isRejected = localReason === 'user_rejected'

  const doAction = async (action: string, artistId?: string) => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/kpopping/idols/${encodeURIComponent(idol.kpoppingIdolId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, artistId }),
      })
      const data = await res.json()
      if (data.ok) {
        if (action === 'confirm' && data.artist) {
          setLocalArtist(data.artist)
          setLocalArtistId(data.artist.id)
          setLocalReason('user_confirmed')
        } else if (action === 'reject') {
          setLocalArtist(undefined)
          setLocalArtistId(undefined)
          setLocalReason('user_rejected')
        } else if (action === 'reset') {
          setLocalArtist(undefined)
          setLocalArtistId(undefined)
          setLocalReason(undefined)
        }
        setShowSearch(false)
        setShowTMDB(false)
      }
    } finally {
      setPending(false)
    }
  }

  const handleManualSelect = (item: SearchHit) => {
    setLocalArtist({
      id: item.id,
      nameRomanized: item.nameRomanized ?? item.name ?? '',
      nameHangul: item.nameHangul,
      primaryImageUrl: item.primaryImageUrl,
      birthDate: item.birthDate,
    })
    setLocalArtistId(item.id)
    setShowSearch(false)
  }

  const handleTMDBConfirmed = (artist: { id: string; nameRomanized: string; nameHangul?: string; primaryImageUrl?: string }) => {
    setLocalArtist({ ...artist })
    setLocalArtistId(artist.id)
    setLocalReason('user_confirmed')
    setShowTMDB(false)
  }

  const idolImg = idol.idolImageUrl ?? avatarPlaceholder(idol.idolName)
  const artistImg = localArtist?.primaryImageUrl ?? avatarPlaceholder(localArtist?.nameRomanized ?? '?')

  return (
    <div className={`bg-gray-800 border rounded-xl p-4 space-y-3 ${
      isConfirmed ? 'border-green-700/50' : isRejected ? 'border-red-700/50' : 'border-gray-700'
    }`}>
      {/* Status badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConfirmed && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle size={10} /> Confirmado
            </span>
          )}
          {isRejected && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <XCircle size={10} /> Rejeitado
            </span>
          )}
          {!isConfirmed && !isRejected && localArtistId && (
            <span className={`text-xs font-mono ${scoreColor(idol.artistMatchScore)}`}>
              {Math.round((idol.artistMatchScore ?? 0) * 100)}% · {reasonLabel(idol.artistMatchReason)}
            </span>
          )}
          {!localArtistId && !isRejected && (
            <span className="text-xs text-gray-500">Sem correspondência</span>
          )}
        </div>
        <span className="text-xs text-gray-600">{idol.groupCount} grupo{idol.groupCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-lg p-3 flex gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            <Image src={idolImg} alt={idol.idolName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{idol.idolName}</p>
            {idol.idolNameHangul && <p className="text-xs text-gray-500">{idol.idolNameHangul}</p>}
            {idol.idolBirthday && <p className="text-xs text-gray-600">{formatDate(idol.idolBirthday)}</p>}
            {(idol.idolHeight || idol.idolBloodType) && (
              <p className="text-xs text-gray-600">
                {idol.idolHeight ? `${idol.idolHeight}cm` : ''}
                {idol.idolHeight && idol.idolBloodType ? ' · ' : ''}
                {idol.idolBloodType ? `Tipo ${idol.idolBloodType}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-3 flex gap-3">
          {localArtist ? (
            <>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                <Image src={artistImg} alt={localArtist.nameRomanized} width={48} height={48} className="object-cover w-full h-full" unoptimized />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{localArtist.nameRomanized}</p>
                {localArtist.nameHangul && <p className="text-xs text-gray-500">{localArtist.nameHangul}</p>}
                {localArtist.birthDate && <p className="text-xs text-gray-600">{formatDate(localArtist.birthDate)}</p>}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-600 text-xs">
              {isRejected ? 'Sem correspondência' : 'Não encontrado'}
            </div>
          )}
        </div>
      </div>

      {/* Manual search */}
      {showSearch && (
        <InlineSearch
          type="artist"
          placeholder="Buscar artista no HallyuHub..."
          onSelect={handleManualSelect}
        />
      )}

      {/* TMDB panel */}
      {showTMDB && (
        <TMDBPanel
          idolName={idol.idolName}
          kpoppingIdolId={idol.kpoppingIdolId}
          onConfirmed={handleTMDBConfirmed}
        />
      )}

      {/* Confirm pending manual selection */}
      {localArtistId && localArtistId !== idol.artistId && localReason !== 'user_confirmed' && (
        <button
          onClick={() => doAction('confirm', localArtistId)}
          disabled={pending}
          className="w-full text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-1.5 rounded flex items-center justify-center gap-1"
        >
          <CheckCircle size={12} /> Confirmar seleção manual
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {!isConfirmed && !isRejected && localArtistId && localArtistId === idol.artistId && (
          <button
            onClick={() => doAction('confirm', localArtistId)}
            disabled={pending}
            className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
          >
            <CheckCircle size={12} /> Confirmar
          </button>
        )}

        {!isRejected && (
          <button
            onClick={() => doAction('reject')}
            disabled={pending}
            className="text-xs bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 px-3 py-1.5 rounded flex items-center gap-1"
          >
            <XCircle size={12} /> Rejeitar
          </button>
        )}

        <button
          onClick={() => { setShowSearch(!showSearch); setShowTMDB(false) }}
          disabled={pending}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Search size={12} /> HallyuHub
        </button>

        <button
          onClick={() => { setShowTMDB(!showTMDB); setShowSearch(false) }}
          disabled={pending}
          className="text-xs bg-purple-900 hover:bg-purple-800 text-purple-300 px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Star size={12} /> TMDB
        </button>

        {isRejected && (
          <button
            onClick={() => doAction('reset')}
            disabled={pending}
            className="text-xs text-red-400 hover:text-red-300 border border-red-700/50 hover:border-red-500/70 bg-red-900/20 hover:bg-red-900/30 px-2 py-1.5 flex items-center gap-1 rounded transition-colors"
          >
            <RotateCcw size={10} /> Cancelar Rejeição
          </button>
        )}
        {isConfirmed && (
          <button
            onClick={() => doAction('reset')}
            disabled={pending}
            className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1.5 flex items-center gap-1"
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Group Card ────────────────────────────────────────────────────────────────

function GroupCard({ group }: { group: GroupItem }) {
  const [pending, setPending] = useState(false)
  const [localGroup, setLocalGroup] = useState(group.musicalGroup)
  const [localGroupId, setLocalGroupId] = useState(group.musicalGroupId)
  const [localReason, setLocalReason] = useState(group.groupMatchReason)
  const [showSearch, setShowSearch] = useState(false)
  const [showTMDB, setShowTMDB] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [members, setMembers] = useState<GroupMemberItem[] | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)

  const isConfirmed = localReason === 'user_confirmed'
  const isRejected = localReason === 'user_rejected'

  const doAction = async (action: string, musicalGroupId?: string) => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/kpopping/groups-overview/${encodeURIComponent(group.kpoppingGroupId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, musicalGroupId }),
      })
      const data = await res.json()
      if (data.ok) {
        if (action === 'confirm' && data.group) {
          setLocalGroup(data.group)
          setLocalGroupId(data.group.id)
          setLocalReason('user_confirmed')
        } else if (action === 'reject') {
          setLocalGroup(undefined)
          setLocalGroupId(undefined)
          setLocalReason('user_rejected')
        } else if (action === 'reset') {
          setLocalGroup(undefined)
          setLocalGroupId(undefined)
          setLocalReason(undefined)
        }
        setShowSearch(false)
        setShowTMDB(false)
      }
    } finally {
      setPending(false)
    }
  }

  const loadMembers = async () => {
    if (members !== null) return // já carregado
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/admin/kpopping/groups-overview/${encodeURIComponent(group.kpoppingGroupId)}`)
      const data = await res.json()
      setMembers(data.members ?? [])
    } catch {
      setMembers([])
    } finally {
      setMembersLoading(false)
    }
  }

  const toggleMembers = () => {
    if (!showMembers) loadMembers()
    setShowMembers(v => !v)
  }

  const handleManualSelect = (item: SearchHit) => {
    setLocalGroup({
      id: item.id,
      name: item.name ?? '',
      nameHangul: item.nameHangul,
      profileImageUrl: item.profileImageUrl,
      debutDate: item.debutDate,
    })
    setLocalGroupId(item.id)
    setShowSearch(false)
  }

  const handleTMDBConfirmed = (g: { id: string; name: string; nameHangul?: string; profileImageUrl?: string }) => {
    setLocalGroup({ ...g })
    setLocalGroupId(g.id)
    setLocalReason('user_confirmed')
    setShowTMDB(false)
  }

  const groupImg = group.groupImageUrl ?? avatarPlaceholder(group.groupName)
  const khubImg = localGroup?.profileImageUrl ?? avatarPlaceholder(localGroup?.name ?? '?')

  return (
    <div className={`bg-gray-800 border rounded-xl p-4 space-y-3 ${
      isConfirmed ? 'border-green-700/50' : isRejected ? 'border-red-700/50' : 'border-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConfirmed && (
            <span className="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle size={10} /> Confirmado
            </span>
          )}
          {isRejected && (
            <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <XCircle size={10} /> Rejeitado
            </span>
          )}
          {!isConfirmed && !isRejected && localGroupId && (
            <span className={`text-xs font-mono ${scoreColor(group.groupMatchScore)}`}>
              {Math.round((group.groupMatchScore ?? 0) * 100)}% · {reasonLabel(group.groupMatchReason)}
            </span>
          )}
          {!localGroupId && !isRejected && (
            <span className="text-xs text-gray-500">Sem correspondência</span>
          )}
        </div>
        <span className="text-xs text-gray-600">{group.memberCount} membro{group.memberCount !== 1 ? 's' : ''}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 rounded-lg p-3 flex gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
            <Image src={groupImg} alt={group.groupName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{group.groupName}</p>
            {group.groupNameHangul && <p className="text-xs text-gray-500">{group.groupNameHangul}</p>}
            {group.groupDebutDate && <p className="text-xs text-gray-600">Debut: {formatDate(group.groupDebutDate)}</p>}
            {group.groupAgency && <p className="text-xs text-gray-600 truncate">{group.groupAgency}</p>}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-3 flex gap-3">
          {localGroup ? (
            <>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                <Image src={khubImg} alt={localGroup.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{localGroup.name}</p>
                {localGroup.nameHangul && <p className="text-xs text-gray-500">{localGroup.nameHangul}</p>}
                {localGroup.agency?.name && <p className="text-xs text-gray-600 truncate">{localGroup.agency.name}</p>}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full text-gray-600 text-xs">
              {isRejected ? 'Sem correspondência' : 'Não encontrado'}
            </div>
          )}
        </div>
      </div>

      {showSearch && (
        <InlineSearch
          type="group"
          placeholder="Buscar grupo no HallyuHub..."
          onSelect={handleManualSelect}
        />
      )}

      {showTMDB && (
        <TMDBGroupPanel
          groupName={group.groupName}
          kpoppingGroupId={group.kpoppingGroupId}
          onConfirmed={handleTMDBConfirmed}
        />
      )}

      {localGroupId && localGroupId !== group.musicalGroupId && localReason !== 'user_confirmed' && (
        <button
          onClick={() => doAction('confirm', localGroupId)}
          disabled={pending}
          className="w-full text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-1.5 rounded flex items-center justify-center gap-1"
        >
          <CheckCircle size={12} /> Confirmar seleção manual
        </button>
      )}

      <div className="flex gap-2 flex-wrap">
        {!isConfirmed && !isRejected && localGroupId && localGroupId === group.musicalGroupId && (
          <button
            onClick={() => doAction('confirm', localGroupId)}
            disabled={pending}
            className="text-xs bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
          >
            <CheckCircle size={12} /> Confirmar
          </button>
        )}

        {!isRejected && (
          <button
            onClick={() => doAction('reject')}
            disabled={pending}
            className="text-xs bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 px-3 py-1.5 rounded flex items-center gap-1"
          >
            <XCircle size={12} /> Rejeitar
          </button>
        )}

        <button
          onClick={() => { setShowSearch(!showSearch); setShowTMDB(false) }}
          disabled={pending}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Search size={12} /> HallyuHub
        </button>

        <button
          onClick={() => { setShowTMDB(!showTMDB); setShowSearch(false) }}
          disabled={pending}
          className="text-xs bg-purple-900 hover:bg-purple-800 text-purple-300 px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Star size={12} /> TMDB
        </button>

        {isRejected && (
          <button
            onClick={() => doAction('reset')}
            disabled={pending}
            className="text-xs text-red-400 hover:text-red-300 border border-red-700/50 hover:border-red-500/70 bg-red-900/20 hover:bg-red-900/30 px-2 py-1.5 flex items-center gap-1 rounded transition-colors"
          >
            <RotateCcw size={10} /> Cancelar Rejeição
          </button>
        )}
        {isConfirmed && (
          <button
            onClick={() => doAction('reset')}
            disabled={pending}
            className="text-xs text-gray-600 hover:text-gray-400 px-2 py-1.5 flex items-center gap-1"
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}

        {/* Toggle membros Kpopping */}
        {group.memberCount > 0 && (
          <button
            onClick={toggleMembers}
            className="ml-auto text-xs text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 bg-gray-800 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
          >
            <Users size={12} />
            Membros Kpopping ({group.memberCount})
            {showMembers ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        )}
      </div>

      {/* Lista de membros do grupo no Kpopping */}
      {showMembers && (
        <div className="border-t border-gray-700 pt-3 space-y-1.5">
          {membersLoading ? (
            <div className="text-center py-4 text-gray-500 text-xs flex items-center justify-center gap-2">
              <RefreshCw size={12} className="animate-spin" /> Carregando membros...
            </div>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-4 text-gray-600 text-xs">Nenhum membro encontrado</div>
          ) : (
            members.map(member => {
              const matchReason = member.artistMatchReason
              const isConfirmedMember = matchReason === 'user_confirmed'
              const isAutoMember = matchReason && !isConfirmedMember && matchReason !== 'user_rejected'
              const img = member.idolImageUrl ?? avatarPlaceholder(member.idolName)
              return (
                <div key={member.kpoppingIdolId} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-900/70 border border-gray-800/50">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                    <Image src={img} alt={member.idolName} width={32} height={32} className="object-cover w-full h-full" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-gray-200 truncate">{member.idolName}</span>
                      {member.idolNameHangul && (
                        <span className="text-[10px] text-gray-500">{member.idolNameHangul}</span>
                      )}
                      {member.idolPosition && (
                        <span className="text-[10px] text-gray-600 italic">{member.idolPosition}</span>
                      )}
                      {!member.idolIsActive && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-800/40">ex</span>
                      )}
                    </div>
                    {member.artist && (
                      <p className="text-[10px] text-gray-500 truncate">
                        → {member.artist.nameRomanized}
                        {member.artist.nameHangul ? ` (${member.artist.nameHangul})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {isConfirmedMember ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-700/40 font-bold">✓ confirmado</span>
                    ) : isAutoMember ? (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${scoreColor(member.artistMatchScore)} border-current/20`}>
                        {Math.round((member.artistMatchScore ?? 0) * 100)}%
                      </span>
                    ) : member.artistMatchReason === 'user_rejected' ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-900/30 text-red-500 border border-red-800/30">rejeitado</span>
                    ) : (
                      <span className="text-[9px] text-gray-700">sem match</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Membership Card ───────────────────────────────────────────────────────────

function MembershipCard({
  item,
  onApplied,
}: {
  item: MembershipItem
  onApplied: () => void
}) {
  const [pending, setPending] = useState(false)
  const [role, setRole] = useState(item.idolPosition ?? '')
  const [isActive, setIsActive] = useState(item.idolIsActive)
  const [done, setDone] = useState(false)

  const apply = async () => {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/kpopping/suggestions/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          artistId: item.artistId,
          musicalGroupId: item.musicalGroupId,
          role: role || undefined,
          isActive,
        }),
      })
      if (res.ok) {
        setDone(true)
        onApplied()
      }
    } finally {
      setPending(false)
    }
  }

  if (done) return null

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            <Image
              src={item.artist.primaryImageUrl ?? avatarPlaceholder(item.artist.nameRomanized)}
              alt={item.artist.nameRomanized}
              width={40} height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{item.artist.nameRomanized}</p>
            {item.artist.nameHangul && <p className="text-xs text-gray-500">{item.artist.nameHangul}</p>}
          </div>
        </div>

        <Link2 size={16} className="text-gray-600 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <div className="text-right min-w-0">
            <p className="text-sm font-semibold text-gray-200 truncate">{item.musicalGroup.name}</p>
            {item.musicalGroup.nameHangul && <p className="text-xs text-gray-500">{item.musicalGroup.nameHangul}</p>}
          </div>
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
            <Image
              src={item.musicalGroup.profileImageUrl ?? avatarPlaceholder(item.musicalGroup.name)}
              alt={item.musicalGroup.name}
              width={40} height={40}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 w-36 focus:outline-none focus:border-purple-500"
          placeholder="Role (vocalist...)"
          value={role}
          onChange={e => setRole(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="accent-purple-500"
          />
          Ativo
        </label>
        <button
          onClick={apply}
          disabled={pending}
          className="ml-auto text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-1.5 rounded flex items-center gap-1"
        >
          <Link2 size={12} /> {pending ? 'Aplicando...' : 'Aplicar Vínculo'}
        </button>
      </div>
    </div>
  )
}

// ─── Pagination ────────────────────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 mt-6">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-gray-400">{page} / {totalPages}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="p-1.5 rounded bg-gray-800 text-gray-400 hover:text-gray-200 disabled:opacity-30"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─── Tab: Idols ────────────────────────────────────────────────────────────────

function IdolsTab() {
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [data, setData] = useState<PaginatedResponse<IdolItem> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: '20' })
      if (debouncedQ) params.set('q', debouncedQ)
      const res = await fetch(`/api/admin/kpopping/idols?${params}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [filter, page, debouncedQ])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter, debouncedQ])

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'auto', label: 'Auto-match' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'rejected', label: 'Rejeitados' },
    { key: 'unmatched', label: 'Sem match' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar idol..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <RefreshCw size={12} /> Recarregar
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Carregando...</p>}

      {!loading && data && (
        <>
          <p className="text-xs text-gray-600 mb-3">{data.total} idols</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.items.map(idol => (
              <IdolCard key={idol.kpoppingIdolId} idol={idol} />
            ))}
          </div>
          {data.items.length === 0 && (
            <p className="text-center text-gray-600 py-8">Nenhum idol encontrado com este filtro.</p>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}

// ─── Tab: Groups ───────────────────────────────────────────────────────────────

function GroupsTab() {
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [data, setData] = useState<PaginatedResponse<GroupItem> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: '20' })
      if (debouncedQ) params.set('q', debouncedQ)
      const res = await fetch(`/api/admin/kpopping/groups-overview?${params}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [filter, page, debouncedQ])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [filter, debouncedQ])

  const filters = [
    { key: 'all', label: 'Todos' },
    { key: 'auto', label: 'Auto-match' },
    { key: 'confirmed', label: 'Confirmados' },
    { key: 'rejected', label: 'Rejeitados' },
    { key: 'unmatched', label: 'Sem match' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar grupo..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'border-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <RefreshCw size={12} /> Recarregar
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Carregando...</p>}

      {!loading && data && (
        <>
          <p className="text-xs text-gray-600 mb-3">{data.total} grupos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.items.map(group => (
              <GroupCard key={group.kpoppingGroupId} group={group} />
            ))}
          </div>
          {data.items.length === 0 && (
            <p className="text-center text-gray-600 py-8">Nenhum grupo encontrado com este filtro.</p>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}

// ─── Tab: Memberships ──────────────────────────────────────────────────────────

function MembershipsTab() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [data, setData] = useState<PaginatedResponse<MembershipItem> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ confirmed: 'true', status: 'PENDING', page: String(page), limit: '20' })
      if (debouncedQ) params.set('q', debouncedQ)
      const res = await fetch(`/api/admin/kpopping/suggestions?${params}`)
      const json = await res.json()
      setData(json)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [debouncedQ])

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-gray-400 flex-1">
          Vínculos prontos — idol e grupo ambos confirmados.
        </p>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar idol ou grupo..."
            className="pl-8 pr-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 w-52"
          />
        </div>
        <button onClick={load} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
          <RefreshCw size={12} /> Recarregar
        </button>
      </div>

      {loading && <p className="text-center text-gray-500 py-8">Carregando...</p>}

      {!loading && data && (
        <>
          <p className="text-xs text-gray-600 mb-3">{data.total} vínculos pendentes</p>
          <div className="space-y-3">
            {data.items.map(item => (
              <MembershipCard key={item.id} item={item} onApplied={load} />
            ))}
          </div>
          {data.items.length === 0 && (
            <div className="text-center py-12">
              <Link2 size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-600 text-sm">Nenhum vínculo pronto.</p>
              <p className="text-gray-700 text-xs mt-1">Confirme idols na aba Idols e grupos na aba Grupos primeiro.</p>
            </div>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
        </>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function KpoppingCurationPage() {
  const [tab, setTab] = useState<'idols' | 'groups' | 'memberships'>('idols')
  const [generating, setGenerating] = useState(false)
  const [generateStats, setGenerateStats] = useState<{
    processed: number; created: number; updated: number; skipped: number; errors: number
  } | null>(null)
  const [backfilling, setBackfilling] = useState(false)
  const [backfillResult, setBackfillResult] = useState<{
    total: number; membershipsCreated: number; membershipsExisted: number; suggestionsApproved: number; artistsEnriched: number; groupsEnriched: number; errors: number
  } | null>(null)
  const [backfillError, setBackfillError] = useState<string | null>(null)

  const generate = async () => {
    setGenerating(true)
    setGenerateStats(null)
    try {
      const res = await fetch('/api/admin/kpopping/suggestions/generate', { method: 'POST' })
      const data = await res.json()
      if (data.stats) setGenerateStats(data.stats)
    } finally {
      setGenerating(false)
    }
  }

  const backfill = async () => {
    setBackfilling(true)
    setBackfillResult(null)
    setBackfillError(null)
    try {
      const res = await fetch('/api/admin/kpopping/backfill-memberships', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setBackfillResult(data)
      } else {
        setBackfillError(data.error ?? `Erro ${res.status}`)
      }
    } catch (e) {
      setBackfillError(e instanceof Error ? e.message : 'Erro de rede')
    } finally {
      setBackfilling(false)
    }
  }

  const tabs = [
    { key: 'idols' as const, label: 'Idols', icon: Users },
    { key: 'groups' as const, label: 'Grupos', icon: Music },
    { key: 'memberships' as const, label: 'Memberships', icon: Link2 },
  ]

  return (
    <AdminLayout title="Curadoria Kpopping">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex items-start justify-between -mt-6">
          <p className="text-sm text-zinc-400">Confirme idols → artistas e grupos → musicais, depois aplique os vínculos.</p>
          <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
            <div className="flex gap-2">
              <button
                onClick={backfill}
                disabled={backfilling}
                title="Garante que todas as sugestões APPROVED tenham ArtistGroupMembership no DB"
                className="text-sm bg-purple-900/50 hover:bg-purple-800/50 disabled:opacity-50 text-purple-300 px-4 py-2 rounded-lg flex items-center gap-2 border border-purple-700/30"
              >
                <Star size={14} className={backfilling ? 'animate-pulse' : ''} />
                {backfilling ? 'Corrigindo...' : 'Backfill Vínculos'}
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="text-sm bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Gerando...' : 'Gerar Sugestões'}
              </button>
            </div>
            {backfillResult && (
              <p className="text-xs text-purple-400">
                {backfillResult.total} candidatos · Vínculos: {backfillResult.membershipsCreated} criados · {backfillResult.membershipsExisted} já existiam · Aprovadas: {backfillResult.suggestionsApproved} · Artistas enriquecidos: {backfillResult.artistsEnriched} · Grupos enriquecidos: {backfillResult.groupsEnriched} · {backfillResult.errors} erros
              </p>
            )}
            {backfillError && (
              <p className="text-xs text-red-400">Backfill erro: {backfillError}</p>
            )}
            {generateStats && (
              <p className="text-xs text-zinc-500">
                {generateStats.created} criadas · {generateStats.updated} atualizadas · {generateStats.skipped} ignoradas · {generateStats.errors} erros
              </p>
            )}
          </div>
        </div>

          {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'idols' && <IdolsTab />}
        {tab === 'groups' && <GroupsTab />}
        {tab === 'memberships' && <MembershipsTab />}
      </div>
    </AdminLayout>
  )
}
