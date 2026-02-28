'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GitMerge, RefreshCw, CheckCircle, ChevronDown, ChevronUp, X, ExternalLink, Search, Ban } from 'lucide-react'
import Image from 'next/image'

interface ArtistCard {
    id: string
    nameRomanized: string
    nameHangul: string | null
    birthName: string | null
    birthDate: string | null
    height: string | null
    bloodType: string | null
    bio: string | null
    primaryImageUrl: string | null
    stageNames: string[]
    agency: { id: string; name: string } | null
    agencyId: string | null
    musicalGroupName: string | null
    tmdbId: string | null
    mbid: string | null
    _count: { productions: number; albums: number }
}

interface DuplicatePair {
    id: string
    a: ArtistCard
    b: ArtistCard
    reason: string
    confidence: 'high' | 'medium'
    score: number
}

type CuratableField = 'nameRomanized' | 'nameHangul' | 'birthName' | 'birthDate' | 'height' | 'bloodType' | 'bio' | 'primaryImageUrl' | 'agencyId' | 'tmdbId' | 'mbid'
type FieldSelection = 'a' | 'b'
type PairSelections = Partial<Record<CuratableField, FieldSelection>>

function getFieldValue(artist: ArtistCard, field: CuratableField): string | null {
    if (field === 'agencyId') return artist.agency?.name ?? null
    if (field === 'birthDate') return artist.birthDate ? new Date(artist.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null
    return (artist as unknown as Record<string, string | null>)[field]
}

function buildFieldOverrides(a: ArtistCard, b: ArtistCard, selections: PairSelections): Record<string, unknown> {
    const overrides: Record<string, unknown> = {}
    const fields: CuratableField[] = ['nameRomanized', 'nameHangul', 'birthName', 'birthDate', 'height', 'bloodType', 'bio', 'primaryImageUrl', 'agencyId', 'tmdbId', 'mbid']

    for (const field of fields) {
        const choice = selections[field] ?? 'a'
        const src = choice === 'a' ? a : b
        if (field === 'agencyId') {
            overrides.agencyId = src.agencyId
        } else if (field === 'birthDate') {
            overrides.birthDate = src.birthDate
        } else {
            overrides[field] = (src as unknown as Record<string, string | null>)[field]
        }
    }
    return overrides
}

const FIELD_LABELS: Record<CuratableField, string> = {
    nameRomanized: 'Nome Romanizado',
    nameHangul: 'Nome Hangul',
    birthName: 'Nome de Nascimento',
    birthDate: 'Data de Nascimento',
    height: 'Altura',
    bloodType: 'Tipo Sanguíneo',
    bio: 'Biografia',
    primaryImageUrl: 'Imagem',
    agencyId: 'Agência',
    tmdbId: 'TMDB ID',
    mbid: 'MusicBrainz ID',
}

// External ID helpers
function tmdbUrl(tmdbId: string) { return `https://www.themoviedb.org/person/${tmdbId}` }
function mbUrl(mbid: string) { return `https://musicbrainz.org/artist/${mbid}` }
function tmdbSearch(name: string) { return `https://www.themoviedb.org/search/person?query=${encodeURIComponent(name)}` }
function mbSearch(name: string) { return `https://musicbrainz.org/search?query=${encodeURIComponent(name)}&type=artist` }

// ─── ID badges ────────────────────────────────────────────────────────────────

function IdBadges({ artist }: { artist: ArtistCard }) {
    return (
        <div className="flex items-center gap-1">
            {artist.tmdbId ? (
                <a href={tmdbUrl(artist.tmdbId)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    title={`TMDB: ${artist.tmdbId}`}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-colors">
                    TMDB
                </a>
            ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-700 border border-zinc-800">TMDB</span>
            )}
            {artist.mbid ? (
                <a href={mbUrl(artist.mbid)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    title={`MusicBrainz: ${artist.mbid}`}
                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25 transition-colors">
                    MB
                </a>
            ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-700 border border-zinc-800">MB</span>
            )}
        </div>
    )
}

// ─── Inline field comparison ──────────────────────────────────────────────────

function fieldDate(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function PairComparison({ a, b }: { a: ArtistCard; b: ArtistCard }) {
    const compareFields = [
        { icon: '🎂', va: fieldDate(a.birthDate), vb: fieldDate(b.birthDate) },
        { icon: '🏢', va: a.agency?.name ?? null, vb: b.agency?.name ?? null },
        { icon: '🎵', va: a.musicalGroupName, vb: b.musicalGroupName },
        { icon: '📏', va: a.height, vb: b.height },
        { icon: '🩸', va: a.bloodType, vb: b.bloodType },
    ].filter(f => f.va || f.vb)

    if (compareFields.length === 0) return null

    return (
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {compareFields.map((f, i) => {
                const match = f.va && f.vb && f.va === f.vb
                const onlyA = f.va && !f.vb
                const onlyB = !f.va && f.vb
                return (
                    <span key={i} className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                        match    ? 'bg-green-500/10 border-green-500/25 text-green-400'
                        : onlyA  ? 'bg-blue-500/8 border-blue-500/20 text-zinc-400'
                        : onlyB  ? 'bg-orange-500/8 border-orange-500/20 text-zinc-400'
                        : 'bg-amber-500/8 border-amber-500/20 text-amber-400'
                    }`}>
                        <span>{f.icon}</span>
                        {match   ? <span className="font-medium">{f.va} ✓</span>
                        : onlyA  ? <span>{f.va} / <span className="text-zinc-700">—</span></span>
                        : onlyB  ? <span className="text-zinc-700">—</span>
                        : <span>{f.va} <span className="opacity-50">↔</span> {f.vb}</span>}
                    </span>
                )
            })}
        </div>
    )
}

// ─── Enrichment badge ─────────────────────────────────────────────────────────

function EnrichmentBadge({ a, b }: { a: ArtistCard; b: ArtistCard }) {
    // Fields that A lacks but B has — would be filled by merging
    const gains: string[] = []
    if (!a.nameHangul && b.nameHangul) gains.push('Hangul')
    if (!a.primaryImageUrl && b.primaryImageUrl) gains.push('foto')
    if (!a.bio && b.bio) gains.push('bio')
    if (!a.birthDate && b.birthDate) gains.push('nasc.')
    if (!a.agencyId && b.agencyId) gains.push('agência')
    if (!a.tmdbId && b.tmdbId) gains.push('TMDB')
    if (!a.mbid && b.mbid) gains.push('MB')
    if (!a.height && b.height) gains.push('altura')

    if (gains.length === 0) return null

    return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 flex-shrink-0">
            +{gains.length} {gains.slice(0, 2).join(', ')}{gains.length > 2 ? '…' : ''}
        </span>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DuplicatesPage() {
    const [pairs, setPairs] = useState<DuplicatePair[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all')
    const [merged, setMerged] = useState<Set<string>>(new Set())
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [expanded, setExpanded] = useState<string | null>(null)
    const [selections, setSelections] = useState<Record<string, PairSelections>>({})
    const [merging, setMerging] = useState(false)
    const [showDone, setShowDone] = useState(false)

    const fetchPairs = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/artists/duplicates')
            const data = await res.json()
            setPairs(data.pairs || [])
            setTotal(data.total || 0)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchPairs() }, [fetchPairs])

    const handled = new Set([...Array.from(merged), ...Array.from(dismissed)])

    const visible = pairs.filter(p => {
        if (handled.has(p.id)) return false
        if (filter === 'high') return p.confidence === 'high'
        if (filter === 'medium') return p.confidence === 'medium'
        return true
    })

    const donePairs = pairs.filter(p => handled.has(p.id))

    const getSelections = (pairId: string): PairSelections => selections[pairId] ?? {}

    const setField = (pairId: string, field: CuratableField, value: FieldSelection) => {
        setSelections(prev => ({
            ...prev,
            [pairId]: { ...(prev[pairId] ?? {}), [field]: value },
        }))
    }

    const executeMerge = async (pair: DuplicatePair) => {
        const pairSels = getSelections(pair.id)
        const fieldOverrides = buildFieldOverrides(pair.a, pair.b, pairSels)

        setMerging(true)
        try {
            const res = await fetch('/api/admin/artists/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keepId: pair.a.id, deleteId: pair.b.id, fieldOverrides }),
            })
            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Erro ao mesclar')
                return
            }
            const affected = pairs.filter(p =>
                p.a.id === pair.a.id || p.b.id === pair.a.id ||
                p.a.id === pair.b.id || p.b.id === pair.b.id
            )
            setMerged(prev => {
                const next = new Set(prev)
                affected.forEach(p => next.add(p.id))
                return next
            })
            setExpanded(null)
            await fetchPairs()
        } finally {
            setMerging(false)
        }
    }

    const dismiss = (pairId: string) => {
        setDismissed(prev => new Set([...Array.from(prev), pairId]))
        if (expanded === pairId) setExpanded(null)
    }

    const confidenceBadge = (score: number) => {
        if (score >= 5) return 'bg-red-500/10 border border-red-500/30 text-red-400'
        if (score === 4) return 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        if (score === 3) return 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
        if (score === 2) return 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
        return 'bg-zinc-800 border border-zinc-700 text-zinc-400'
    }

    const highCount = pairs.filter(p => p.confidence === 'high').length

    return (
        <AdminLayout title="Enriquecimento MusicBrainz">
            <div className="space-y-5">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{total}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Detectados</p>
                    </div>
                    <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-red-400">{highCount}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Alta confiança</p>
                    </div>
                    <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-green-400">{merged.size}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Mesclados</p>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-zinc-400">{dismissed.size}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Descartados</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {([['all', 'Todos'], ['high', 'Alta confiança'], ['medium', 'Média confiança']] as const).map(([val, label]) => (
                            <button key={val} onClick={() => setFilter(val)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === val ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchPairs} disabled={loading}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Reanalisar
                    </button>
                </div>

                {/* Pair list */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
                        <p className="font-bold">Nenhum par pendente</p>
                        <p className="text-sm mt-1">para o filtro selecionado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map(pair => {
                            const isExpanded = expanded === pair.id
                            const pairSels = getSelections(pair.id)

                            return (
                                <div key={pair.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                    {/* Pair header — NOT a button; children handle their own clicks */}
                                    <div className="flex items-start gap-3 p-4">
                                        {/* Expand area */}
                                        <button
                                            className="flex-1 min-w-0 text-left hover:bg-zinc-800/30 rounded-lg p-2 -m-2 transition-colors"
                                            onClick={() => setExpanded(isExpanded ? null : pair.id)}
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0 ${confidenceBadge(pair.score)}`}>
                                                    {pair.reason}
                                                </span>

                                                {/* Artist A */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {pair.a.primaryImageUrl && (
                                                        <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                                            <Image src={pair.a.primaryImageUrl} alt={pair.a.nameRomanized} fill sizes="28px" className="object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-white text-sm truncate">{pair.a.nameRomanized}</span>
                                                    <IdBadges artist={pair.a} />
                                                </div>

                                                <span className="text-zinc-600 text-xs flex-shrink-0">↔</span>

                                                {/* Artist B */}
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {pair.b.primaryImageUrl && (
                                                        <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                                            <Image src={pair.b.primaryImageUrl} alt={pair.b.nameRomanized} fill sizes="28px" className="object-cover" />
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-zinc-400 text-sm truncate">{pair.b.nameRomanized}</span>
                                                    <IdBadges artist={pair.b} />
                                                </div>

                                                <EnrichmentBadge a={pair.a} b={pair.b} />
                                            </div>

                                            {/* Inline field comparison */}
                                            <PairComparison a={pair.a} b={pair.b} />
                                        </button>

                                        {/* Action buttons (outside expand area) */}
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => dismiss(pair.id)}
                                                title="Não é duplicata — descartar"
                                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400 transition-colors text-xs font-bold"
                                            >
                                                <Ban size={12} />
                                                Ignorar
                                            </button>
                                            <button
                                                onClick={() => setExpanded(isExpanded ? null : pair.id)}
                                                className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded curation panel */}
                                    {isExpanded && (
                                        <div className="border-t border-zinc-800 p-4 space-y-4">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                                Curadoria de Campos — selecione o valor a manter no perfil final
                                            </p>

                                            <div className="space-y-3">
                                                {(Object.keys(FIELD_LABELS) as CuratableField[]).map(field => {
                                                    const valA = field === 'primaryImageUrl' ? pair.a.primaryImageUrl : getFieldValue(pair.a, field)
                                                    const valB = field === 'primaryImageUrl' ? pair.b.primaryImageUrl : getFieldValue(pair.b, field)

                                                    if (!valA && !valB) return null
                                                    const onlyOne = (!valA && !!valB) || (!!valA && !valB)
                                                    const selected = pairSels[field] ?? 'a'

                                                    return (
                                                        <div key={field} className="flex flex-col gap-2">
                                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{FIELD_LABELS[field]}</p>
                                                            {(field === 'tmdbId' || field === 'mbid') ? (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[pair.a, pair.b].map((artist, idx) => {
                                                                        const side = idx === 0 ? 'a' : 'b'
                                                                        const rawId = field === 'tmdbId' ? artist.tmdbId : artist.mbid
                                                                        const isSelected = onlyOne ? !!rawId : selected === side
                                                                        const href = rawId
                                                                            ? (field === 'tmdbId' ? tmdbUrl(rawId) : mbUrl(rawId))
                                                                            : (field === 'tmdbId' ? tmdbSearch(artist.nameRomanized) : mbSearch(artist.nameRomanized))
                                                                        return (
                                                                            <button key={artist.id}
                                                                                onClick={() => rawId && !onlyOne && setField(pair.id, field, side)}
                                                                                disabled={onlyOne || !rawId}
                                                                                className={`flex flex-col gap-1.5 p-3 rounded-lg border text-left transition-all ${
                                                                                    isSelected && rawId ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-900/50'
                                                                                } ${rawId && !onlyOne ? 'cursor-pointer hover:border-zinc-600' : 'cursor-default'}`}
                                                                            >
                                                                                {rawId ? (
                                                                                    <span className="text-xs font-mono text-zinc-300 truncate">{rawId}</span>
                                                                                ) : (
                                                                                    <span className="text-xs text-zinc-700 italic">Sem ID</span>
                                                                                )}
                                                                                <a href={href} target="_blank" rel="noopener noreferrer"
                                                                                    onClick={e => e.stopPropagation()}
                                                                                    className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                                                                        rawId
                                                                                            ? field === 'tmdbId' ? 'text-blue-400 hover:text-blue-300' : 'text-orange-400 hover:text-orange-300'
                                                                                            : 'text-zinc-600 hover:text-zinc-400'
                                                                                    }`}
                                                                                >
                                                                                    {rawId ? <ExternalLink size={10} /> : <Search size={10} />}
                                                                                    {rawId ? 'Ver perfil' : 'Buscar'} {field === 'tmdbId' ? 'TMDB' : 'MusicBrainz'} ↗
                                                                                </a>
                                                                                {isSelected && rawId && onlyOne && (
                                                                                    <span className="text-[10px] text-green-400 font-black">✓ único</span>
                                                                                )}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : field === 'primaryImageUrl' ? (
                                                                <div className="flex gap-3">
                                                                    {[pair.a, pair.b].map((artist, idx) => {
                                                                        const side = idx === 0 ? 'a' : 'b'
                                                                        const isSelected = onlyOne ? !!artist.primaryImageUrl : selected === side
                                                                        return (
                                                                            <button key={artist.id}
                                                                                onClick={() => !onlyOne && setField(pair.id, field, side)}
                                                                                disabled={onlyOne}
                                                                                className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${isSelected ? 'border-purple-500' : 'border-zinc-700 opacity-40'} ${!onlyOne ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                                                                            >
                                                                                {artist.primaryImageUrl ? (
                                                                                    <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="64px" className="object-cover" />
                                                                                ) : (
                                                                                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">—</div>
                                                                                )}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : field === 'bio' ? (
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[pair.a, pair.b].map((artist, idx) => {
                                                                        const side = idx === 0 ? 'a' : 'b'
                                                                        const val = getFieldValue(artist, field)
                                                                        const isSelected = onlyOne ? !!val : selected === side
                                                                        return (
                                                                            <button key={artist.id}
                                                                                onClick={() => !onlyOne && val && setField(pair.id, field, side)}
                                                                                disabled={onlyOne || !val}
                                                                                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${isSelected && val ? 'border-purple-500 bg-purple-500/10 text-zinc-300' : 'border-zinc-700 text-zinc-600'} ${!onlyOne && val ? 'cursor-pointer hover:border-zinc-500' : 'cursor-default'}`}
                                                                            >
                                                                                {val ? <span className="line-clamp-3">{val}</span> : <span className="text-zinc-700 italic">Sem bio</span>}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2">
                                                                    {[pair.a, pair.b].map((artist, idx) => {
                                                                        const side = idx === 0 ? 'a' : 'b'
                                                                        const val = getFieldValue(artist, field)
                                                                        const isSelected = onlyOne ? !!val : selected === side
                                                                        if (!val) return (
                                                                            <span key={artist.id} className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-700 text-xs italic">
                                                                                ({side === 'a' ? pair.a.nameRomanized : pair.b.nameRomanized}: sem valor)
                                                                            </span>
                                                                        )
                                                                        return (
                                                                            <button key={artist.id}
                                                                                onClick={() => !onlyOne && setField(pair.id, field, side)}
                                                                                disabled={onlyOne}
                                                                                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isSelected ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'} ${!onlyOne ? 'cursor-pointer' : 'cursor-default'}`}
                                                                            >
                                                                                {val}
                                                                                {onlyOne && <span className="ml-1 text-green-500 text-[10px]">✓ único</span>}
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Combined info */}
                                            <div className="bg-black/30 rounded-lg p-3 text-xs text-zinc-500 space-y-1 border border-white/5">
                                                <p className="font-bold text-zinc-400 mb-2">Combinados automaticamente:</p>
                                                <p>• Produções: <span className="text-zinc-300">{pair.a._count.productions} (A) + {pair.b._count.productions} (B)</span></p>
                                                <p>• Álbuns: <span className="text-zinc-300">{pair.a._count.albums} (A) + {pair.b._count.albums} (B)</span></p>
                                                <p>• Grupos musicais, favoritos de usuários e notícias serão todos transferidos</p>
                                                <p>• Nome de B (<span className="text-zinc-300">{pair.b.nameRomanized}</span>) será salvo como nome alternativo de A</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between gap-3 pt-2">
                                                <p className="text-xs text-zinc-600">
                                                    A={pair.a.nameRomanized} será mantido · B={pair.b.nameRomanized} será deletado
                                                </p>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button onClick={() => dismiss(pair.id)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-500 text-xs font-bold hover:border-zinc-500 hover:text-zinc-300 transition-colors">
                                                        <Ban className="w-3 h-3" />
                                                        Ignorar
                                                    </button>
                                                    <button onClick={() => setExpanded(null)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-bold hover:border-zinc-500 transition-colors">
                                                        <X className="w-3 h-3" />
                                                        Cancelar
                                                    </button>
                                                    <button onClick={() => executeMerge(pair)} disabled={merging}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors">
                                                        {merging ? <><RefreshCw className="w-3 h-3 animate-spin" /> Mesclando...</> : <><GitMerge className="w-3 h-3" /> Mesclar Perfis</>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Already handled pairs */}
                {donePairs.length > 0 && (
                    <div className="pt-2">
                        <button onClick={() => setShowDone(v => !v)}
                            className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {donePairs.length} par{donePairs.length !== 1 ? 'es' : ''} processado{donePairs.length !== 1 ? 's' : ''}
                            {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {showDone && (
                            <div className="space-y-2">
                                {donePairs.map(pair => {
                                    const wasMerged = merged.has(pair.id)
                                    return (
                                        <div key={pair.id} className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl opacity-60">
                                            {wasMerged
                                                ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                : <Ban className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                                            }
                                            <span className="text-sm text-zinc-400">
                                                {pair.a.nameRomanized} {wasMerged ? '←' : '≠'} {pair.b.nameRomanized}
                                            </span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-auto flex-shrink-0 ${
                                                wasMerged ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-600'
                                            }`}>
                                                {wasMerged ? 'mesclado' : 'ignorado'}
                                            </span>
                                            {/* Undo dismiss */}
                                            {!wasMerged && (
                                                <button onClick={() => setDismissed(prev => { const n = new Set(Array.from(prev)); n.delete(pair.id); return n })}
                                                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0">
                                                    desfazer
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
