'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, RefreshCw, Search, Plus, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import type { MBArtistCandidate } from '@/lib/services/musicbrainz-service'

export default function MBImportPage() {
    const [search, setSearch] = useState('')
    const [results, setResults] = useState<MBArtistCandidate[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [importingMbid, setImportingMbid] = useState<string | null>(null)
    // mbid → imported artist { id, nameRomanized }
    const [importedArtists, setImportedArtists] = useState<Record<string, { id: string; nameRomanized: string }>>({})
    // mbid → existing artistId (409)
    const [existingArtists, setExistingArtists] = useState<Record<string, string>>({})

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        const name = search.trim()
        if (!name) return
        setLoading(true)
        setResults([])
        setSearched(false)
        try {
            const res = await fetch(`/api/admin/artists/mb-search?name=${encodeURIComponent(name)}`)
            const data = await res.json()
            setResults(data.artists ?? [])
        } finally {
            setLoading(false)
            setSearched(true)
        }
    }

    const handleImport = async (candidate: MBArtistCandidate) => {
        setImportingMbid(candidate.mbid)
        try {
            const res = await fetch('/api/admin/artists/mb-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mbid: candidate.mbid }),
            })
            const data = await res.json()
            if (res.status === 409) {
                setExistingArtists(prev => ({ ...prev, [candidate.mbid]: data.artistId }))
            } else if (res.ok) {
                setImportedArtists(prev => ({ ...prev, [candidate.mbid]: data.artist }))
            } else {
                alert(data.error || 'Erro ao importar artista')
            }
        } finally {
            setImportingMbid(null)
        }
    }

    return (
        <AdminLayout title="Importar Artista via MusicBrainz">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/artists/duplicates"
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Enriquecimento MB
                    </Link>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Nome do artista no MusicBrainz..."
                        autoFocus
                        className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={loading || !search.trim()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:opacity-60 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                        {loading
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Search className="w-4 h-4" />}
                        Buscar
                    </button>
                </form>

                {/* Loading */}
                {loading && (
                    <p className="text-sm text-zinc-500 text-center py-6">Consultando MusicBrainz...</p>
                )}

                {/* Empty state */}
                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-12 text-zinc-600">
                        <p className="font-bold">Nenhum artista encontrado</p>
                        <p className="text-sm mt-1">Tente outro nome ou grafia diferente.</p>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                            {results.length} resultado{results.length !== 1 ? 's' : ''}
                        </p>

                        {results.map(c => {
                            const imported = importedArtists[c.mbid]
                            const existingId = existingArtists[c.mbid]
                            const isImporting = importingMbid === c.mbid
                            const scoreCls =
                                c.score >= 90 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                                c.score >= 70 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                'bg-zinc-800 text-zinc-400 border-zinc-700'

                            return (
                                <div key={c.mbid} className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-white text-sm">{c.name}</span>
                                            {c.disambiguation && (
                                                <span className="text-xs text-zinc-500 truncate">"{c.disambiguation}"</span>
                                            )}
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${scoreCls}`}>
                                                {c.score}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                                            {c.country && <span>{c.country}</span>}
                                            {c.type && <span>{c.type}</span>}
                                            {c.lifeSpanBegin && <span>Nasc: {c.lifeSpanBegin}</span>}
                                            <a
                                                href={`https://musicbrainz.org/artist/${c.mbid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-orange-400/70 hover:text-orange-400 flex items-center gap-0.5"
                                            >
                                                MB <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        </div>
                                    </div>

                                    {imported ? (
                                        <Link
                                            href={`/admin/artists/${imported.id}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/40 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-green-900/60 transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Ver artista
                                        </Link>
                                    ) : existingId ? (
                                        <Link
                                            href={`/admin/artists/${existingId}`}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-yellow-900/50 transition-colors"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Já cadastrado
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => handleImport(c)}
                                            disabled={isImporting || !!importingMbid}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:opacity-60 text-white rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
                                        >
                                            {isImporting
                                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                : <Plus className="w-3.5 h-3.5" />}
                                            Importar
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
