'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GitMerge, RefreshCw, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react'
import Image from 'next/image'

interface ArtistCard {
    id: string
    nameRomanized: string
    nameHangul: string | null
    birthName: string | null
    birthDate: string | null // ISO string from JSON
    height: string | null
    bloodType: string | null
    bio: string | null
    primaryImageUrl: string | null
    stageNames: string[]
    agency: { id: string; name: string } | null
    agencyId: string | null
    musicalGroupName: string | null
    _count: { productions: number; albums: number }
}

interface DuplicatePair {
    id: string
    a: ArtistCard
    b: ArtistCard
    reason: string
    confidence: 'high' | 'medium'
}

// Fields that can be curated (scalar fields where user can pick A or B)
type CuratableField = 'nameRomanized' | 'nameHangul' | 'birthName' | 'birthDate' | 'height' | 'bloodType' | 'bio' | 'primaryImageUrl' | 'agencyId'
type FieldSelection = 'a' | 'b'
type PairSelections = Partial<Record<CuratableField, FieldSelection>>

function getFieldValue(artist: ArtistCard, field: CuratableField): string | null {
    if (field === 'agencyId') return artist.agency?.name ?? null
    if (field === 'birthDate') return artist.birthDate ? new Date(artist.birthDate).toLocaleDateString('pt-BR') : null
    return (artist as unknown as Record<string, string | null>)[field]
}

function buildFieldOverrides(a: ArtistCard, b: ArtistCard, selections: PairSelections): Record<string, unknown> {
    const overrides: Record<string, unknown> = {}
    const fields: CuratableField[] = ['nameRomanized', 'nameHangul', 'birthName', 'birthDate', 'height', 'bloodType', 'bio', 'primaryImageUrl', 'agencyId']

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
}

export default function DuplicatesPage() {
    const [pairs, setPairs] = useState<DuplicatePair[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all')
    const [merged, setMerged] = useState<Set<string>>(new Set())
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

    const visible = pairs.filter(p => {
        if (merged.has(p.id)) return false
        if (filter === 'high') return p.confidence === 'high'
        if (filter === 'medium') return p.confidence === 'medium'
        return true
    })

    const doneCount = merged.size

    const getSelections = (pairId: string): PairSelections => selections[pairId] ?? {}

    const setField = (pairId: string, field: CuratableField, value: FieldSelection) => {
        setSelections(prev => ({
            ...prev,
            [pairId]: { ...(prev[pairId] ?? {}), [field]: value },
        }))
    }

    const executeMerge = async (pair: DuplicatePair) => {
        // keepId = a (artist A is kept by default; nameRomanized field selection determines final name)
        // deleteId = b
        // The fieldOverrides will carry all curator selections
        const pairSels = getSelections(pair.id)
        const fieldOverrides = buildFieldOverrides(pair.a, pair.b, pairSels)

        setMerging(true)
        try {
            const res = await fetch('/api/admin/artists/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keepId: pair.a.id,
                    deleteId: pair.b.id,
                    fieldOverrides,
                }),
            })
            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Erro ao mesclar')
                return
            }
            // Mark all pairs involving either artist as done
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
            // Refetch to get updated server state
            await fetchPairs()
        } finally {
            setMerging(false)
        }
    }

    const confidenceBadge = (confidence: 'high' | 'medium') =>
        confidence === 'high'
            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
            : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'

    return (
        <AdminLayout title="Artistas Duplicados">
            <div className="space-y-6">
                {/* Header stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{total}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Pares detectados</p>
                    </div>
                    <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-red-400">{pairs.filter(p => p.confidence === 'high').length}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Alta confiança</p>
                    </div>
                    <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-green-400">{doneCount}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Mesclados</p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex gap-2 flex-wrap">
                        {([['all', 'Todos'], ['high', 'Alta confiança'], ['medium', 'Nome similar']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === val ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchPairs}
                        disabled={loading}
                        className="ml-auto flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Reanalisar
                    </button>
                </div>

                {/* Merged pairs toggle */}
                {doneCount > 0 && (
                    <button
                        onClick={() => setShowDone(v => !v)}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {doneCount} par{doneCount !== 1 ? 'es' : ''} mesclado{doneCount !== 1 ? 's' : ''}
                        {showDone ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                )}

                {/* Pair list */}
                {loading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-20 text-zinc-500">
                        <CheckCircle className="w-10 h-10 text-green-500/50 mx-auto mb-3" />
                        <p className="font-bold">Nenhum duplicado encontrado</p>
                        <p className="text-sm mt-1">para o filtro selecionado</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {visible.map(pair => {
                            const isExpanded = expanded === pair.id
                            const pairSels = getSelections(pair.id)

                            return (
                                <div key={pair.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                    {/* Pair header */}
                                    <button
                                        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800/50 transition-colors text-left"
                                        onClick={() => setExpanded(isExpanded ? null : pair.id)}
                                    >
                                        <span className={`text-xs font-black px-2.5 py-1 rounded-full flex-shrink-0 ${confidenceBadge(pair.confidence)}`}>
                                            {pair.reason}
                                        </span>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {pair.a.primaryImageUrl && (
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                                    <Image src={pair.a.primaryImageUrl} alt={pair.a.nameRomanized} fill sizes="32px" className="object-cover" />
                                                </div>
                                            )}
                                            <span className="font-bold text-white text-sm truncate">{pair.a.nameRomanized}</span>
                                            <span className="text-zinc-600 text-xs flex-shrink-0">↔</span>
                                            {pair.b.primaryImageUrl && (
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                                    <Image src={pair.b.primaryImageUrl} alt={pair.b.nameRomanized} fill sizes="32px" className="object-cover" />
                                                </div>
                                            )}
                                            <span className="font-bold text-zinc-400 text-sm truncate">{pair.b.nameRomanized}</span>
                                        </div>
                                        <div className="flex-shrink-0 text-zinc-500">
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </button>

                                    {/* Expanded curation panel */}
                                    {isExpanded && (
                                        <div className="border-t border-zinc-800 p-4 space-y-4">
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                                Curadoria de Campos — selecione o valor a manter no perfil final
                                            </p>

                                            {/* Field-by-field selection */}
                                            <div className="space-y-3">
                                                {(Object.keys(FIELD_LABELS) as CuratableField[]).map(field => {
                                                    const valA = field === 'primaryImageUrl' ? pair.a.primaryImageUrl : getFieldValue(pair.a, field)
                                                    const valB = field === 'primaryImageUrl' ? pair.b.primaryImageUrl : getFieldValue(pair.b, field)

                                                    // Skip if both are empty
                                                    if (!valA && !valB) return null
                                                    // If only one has value, show as auto-selected (no radio needed)
                                                    const onlyOne = (!valA && !!valB) || (!!valA && !valB)

                                                    const selected = pairSels[field] ?? 'a'

                                                    return (
                                                        <div key={field} className="flex flex-col gap-2">
                                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">{FIELD_LABELS[field]}</p>
                                                            {field === 'primaryImageUrl' ? (
                                                                <div className="flex gap-3">
                                                                    {[pair.a, pair.b].map((artist, idx) => {
                                                                        const side = idx === 0 ? 'a' : 'b'
                                                                        const isSelected = onlyOne ? !!artist.primaryImageUrl : selected === side
                                                                        return (
                                                                            <button
                                                                                key={artist.id}
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
                                                                            <button
                                                                                key={artist.id}
                                                                                onClick={() => !onlyOne && val && setField(pair.id, field, side)}
                                                                                disabled={onlyOne || !val}
                                                                                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${isSelected && val ? 'border-purple-500 bg-purple-500/10 text-zinc-300' : 'border-zinc-700 text-zinc-600'} ${!onlyOne && val ? 'cursor-pointer hover:border-zinc-500' : 'cursor-default'}`}
                                                                            >
                                                                                {val ? (
                                                                                    <span className="line-clamp-3">{val}</span>
                                                                                ) : (
                                                                                    <span className="text-zinc-700 italic">Sem bio</span>
                                                                                )}
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
                                                                            <button
                                                                                key={artist.id}
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
                                                <p>• Nome de B (<span className="text-zinc-300">{pair.b.nameRomanized}</span>) será salvo como nome alternativo (stage name) de A</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between gap-3 pt-2">
                                                <p className="text-xs text-zinc-600">
                                                    A={pair.a.nameRomanized} será mantido · B={pair.b.nameRomanized} será deletado
                                                </p>
                                                <div className="flex gap-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => setExpanded(null)}
                                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-xs font-bold hover:border-zinc-500 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => executeMerge(pair)}
                                                        disabled={merging}
                                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                                                    >
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

                {/* Done pairs (if showDone) */}
                {showDone && doneCount > 0 && (
                    <div className="space-y-2 opacity-50">
                        {pairs.filter(p => merged.has(p.id)).map(pair => (
                            <div key={pair.id} className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-zinc-400">{pair.a.nameRomanized} ← {pair.b.nameRomanized}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
