'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { GitMerge, RefreshCw, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

interface ArtistCard {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    agency: { name: string } | null
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

type ConfirmState = { keepId: string; deleteId: string; keepName: string; deleteName: string } | null

export default function DuplicatesPage() {
    const [pairs, setPairs] = useState<DuplicatePair[]>([])
    const [loading, setLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all')
    const [confirm, setConfirm] = useState<ConfirmState>(null)
    const [merging, setMerging] = useState(false)
    const [merged, setMerged] = useState<Set<string>>(new Set())
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

    const handleKeep = (keepArtist: ArtistCard, deleteArtist: ArtistCard) => {
        setConfirm({
            keepId: keepArtist.id,
            deleteId: deleteArtist.id,
            keepName: keepArtist.nameRomanized,
            deleteName: deleteArtist.nameRomanized,
        })
    }

    const executeMerge = async () => {
        if (!confirm) return
        setMerging(true)
        try {
            const res = await fetch('/api/admin/artists/merge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keepId: confirm.keepId, deleteId: confirm.deleteId }),
            })
            if (!res.ok) {
                const err = await res.json()
                alert(err.error || 'Erro ao mesclar')
                return
            }
            // Mark all pairs involving either artist as done
            const affected = pairs.filter(p =>
                p.a.id === confirm.deleteId || p.b.id === confirm.deleteId ||
                p.a.id === confirm.keepId || p.b.id === confirm.keepId
            )
            setMerged(prev => {
                const next = new Set(prev)
                affected.forEach(p => next.add(p.id))
                return next
            })
            setConfirm(null)
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
                            <div key={i} className="h-32 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
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
                        {visible.map(pair => (
                            <div key={pair.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                {/* Reason badge */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${confidenceBadge(pair.confidence)}`}>
                                        {pair.reason}
                                    </span>
                                </div>
                                {/* Side-by-side */}
                                <div className="grid grid-cols-2 gap-3">
                                    {[pair.a, pair.b].map((artist, idx) => (
                                        <div key={artist.id} className="flex flex-col gap-3 bg-black/20 rounded-lg p-3 border border-white/5">
                                            <div className="flex items-start gap-3">
                                                {artist.primaryImageUrl ? (
                                                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                                        <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="56px" className="object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center text-lg font-black text-zinc-500 flex-shrink-0">
                                                        {artist.nameRomanized[0]}
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-black text-white text-sm leading-tight">{artist.nameRomanized}</p>
                                                    {artist.nameHangul && <p className="text-xs text-purple-400 mt-0.5">{artist.nameHangul}</p>}
                                                    {artist.agency && <p className="text-xs text-zinc-500 mt-1">{artist.agency.name}</p>}
                                                    {artist.musicalGroupName && <p className="text-xs text-zinc-400 mt-0.5">{artist.musicalGroupName}</p>}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 text-xs text-zinc-500">
                                                <span>{artist._count.productions} produções</span>
                                                <span>{artist._count.albums} álbuns</span>
                                            </div>
                                            <button
                                                onClick={() => handleKeep(artist, idx === 0 ? pair.b : pair.a)}
                                                className="w-full py-2 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-all"
                                            >
                                                Manter este
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm modal */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                            <h2 className="text-lg font-black text-white">Confirmar Mesclagem</h2>
                        </div>
                        <p className="text-zinc-400 text-sm mb-2">
                            O artista <span className="font-bold text-red-400">{confirm.deleteName}</span> será mesclado em{' '}
                            <span className="font-bold text-green-400">{confirm.keepName}</span> e depois deletado.
                        </p>
                        <p className="text-zinc-600 text-xs mb-6">
                            Todas as produções, grupos, favoritos e álbuns serão transferidos. Esta ação é irreversível.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirm(null)}
                                disabled={merging}
                                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm font-bold hover:border-zinc-500 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={executeMerge}
                                disabled={merging}
                                className="flex-1 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {merging ? <><RefreshCw className="w-4 h-4 animate-spin" /> Mesclando...</> : <><GitMerge className="w-4 h-4" /> Mesclar</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    )
}
