'use client'

import { useState } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ArrowLeft, RefreshCw, Search, Plus, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { AdminButton, AdminLinkButton } from '@/components/admin'
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
                        className="flex items-center gap-2 text-muted hover:text-foreground transition-colors text-sm"
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
                        className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-purple-500/50 text-sm"
                    />
                    <AdminButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={loading || !search.trim()}
                    >
                        {loading
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Search className="w-4 h-4" />}
                        Buscar
                    </AdminButton>
                </form>

                {/* Loading */}
                {loading && (
                    <p className="text-sm text-muted text-center py-6">Consultando MusicBrainz...</p>
                )}

                {/* Empty state */}
                {!loading && searched && results.length === 0 && (
                    <div className="text-center py-12 text-muted">
                        <p className="font-bold">Nenhum artista encontrado</p>
                        <p className="text-sm mt-1">Tente outro nome ou grafia diferente.</p>
                    </div>
                )}

                {/* Results */}
                {results.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted uppercase tracking-widest font-bold">
                            {results.length} resultado{results.length !== 1 ? 's' : ''}
                        </p>

                        {results.map(c => {
                            const imported = importedArtists[c.mbid]
                            const existingId = existingArtists[c.mbid]
                            const isImporting = importingMbid === c.mbid
                            const scoreCls =
                                c.score >= 90 ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                                c.score >= 70 ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' :
                                'bg-surface text-muted border-border'

                            return (
                                <div key={c.mbid} className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-foreground text-sm">{c.name}</span>
                                            {c.disambiguation && (
                                                <span className="text-xs text-muted truncate">"{c.disambiguation}"</span>
                                            )}
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${scoreCls}`}>
                                                {c.score}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
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
                                        <AdminLinkButton
                                            href={`/admin/artists/${imported.id}`}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Ver artista
                                        </AdminLinkButton>
                                    ) : existingId ? (
                                        <AdminLinkButton
                                            href={`/admin/artists/${existingId}`}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Já cadastrado
                                        </AdminLinkButton>
                                    ) : (
                                        <AdminButton
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleImport(c)}
                                            disabled={isImporting || !!importingMbid}
                                        >
                                            {isImporting
                                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                : <Plus className="w-3.5 h-3.5" />}
                                            Importar
                                        </AdminButton>
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
