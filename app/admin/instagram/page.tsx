'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Instagram, Check, Search, RefreshCw, ExternalLink, Clock, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    instagramFeedUrl: string | null
    instagramLastSync: string | null
    socialLinks: { instagram?: string } | null
}

function timeAgo(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
    return `${Math.floor(diff / 86400)}d atrás`
}

export default function InstagramAdminPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [filtered, setFiltered] = useState<Artist[]>([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'configured' | 'missing'>('all')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string | null>(null)
    const [feedValues, setFeedValues] = useState<Record<string, string>>({})
    const [syncing, setSyncing] = useState(false)
    const [syncMsg, setSyncMsg] = useState('')
    const [syncDetails, setSyncDetails] = useState<{ name: string; posts: number; error?: string }[]>([])

    const fetchArtists = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/artists/social-links')
            const data = await res.json()
            const list: Artist[] = data.artists || []
            setArtists(list)
            // Inicializar feedValues com os valores atuais
            const vals: Record<string, string> = {}
            for (const a of list) {
                vals[a.id] = a.instagramFeedUrl ?? ''
            }
            setFeedValues(vals)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchArtists() }, [fetchArtists])

    useEffect(() => {
        let list = artists
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(a =>
                a.nameRomanized.toLowerCase().includes(q) ||
                (a.nameHangul ?? '').toLowerCase().includes(q)
            )
        }
        if (filter === 'configured') list = list.filter(a => !!a.instagramFeedUrl)
        if (filter === 'missing') list = list.filter(a => !a.instagramFeedUrl)
        setFiltered(list)
    }, [artists, search, filter])

    const handleSave = async (artistId: string) => {
        setSaving(artistId)
        try {
            const res = await fetch(`/api/admin/artists/${artistId}/instagram-feed`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedUrl: feedValues[artistId] }),
            })
            if (!res.ok) throw new Error('Erro ao salvar')
            setArtists(prev => prev.map(a =>
                a.id === artistId
                    ? { ...a, instagramFeedUrl: feedValues[artistId] || null }
                    : a
            ))
            setSaved(artistId)
            setTimeout(() => setSaved(null), 2000)
        } catch {
            alert('Erro ao salvar feed URL')
        } finally {
            setSaving(null)
        }
    }

    const handleSyncAll = async () => {
        setSyncing(true)
        setSyncMsg('Sincronizando posts...')
        try {
            const res = await fetch('/api/admin/instagram/sync', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                setSyncMsg(`✅ ${data.totalPosts} posts sincronizados${data.totalErrors > 0 ? ` · ${data.totalErrors} erros` : ''}`)
                setSyncDetails(data.results ?? [])
                await fetchArtists()
            } else {
                setSyncMsg('❌ Erro ao sincronizar')
            }
        } catch {
            setSyncMsg('❌ Erro de rede')
        } finally {
            setSyncing(false)
            setTimeout(() => setSyncMsg(''), 6000)
        }
    }

    const configured = artists.filter(a => !!a.instagramFeedUrl).length

    return (
        <AdminLayout title="Instagram Feeds">
            <div className="space-y-6">

                {/* Stats + Sync */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{artists.length}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Total artistas</p>
                    </div>
                    <div className="bg-zinc-900 border border-pink-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-pink-400">{configured}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Com feed RSS.app</p>
                    </div>
                    <div className="sm:col-span-1 col-span-2 bg-zinc-900 border border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing || configured === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando...' : 'Sync Manual'}
                        </button>
                        {syncMsg && (
                            <p className="text-xs text-center text-zinc-400">{syncMsg}</p>
                        )}
                    </div>
                </div>

                {/* Sync result details */}
                {syncDetails.length > 0 && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Resultado do sync</p>
                        <div className="space-y-1.5">
                            {syncDetails.map((r, i) => (
                                <div key={i} className="flex items-start justify-between gap-4 text-xs">
                                    <span className="text-zinc-300 font-medium">{r.name}</span>
                                    {r.error ? (
                                        <span className="text-red-400 font-mono text-[10px] text-right max-w-xs truncate" title={r.error}>
                                            ❌ {r.error.replace('Error: ', '').slice(0, 80)}
                                        </span>
                                    ) : (
                                        <span className="text-green-400 font-bold flex-shrink-0">✅ {r.posts} posts</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Como configurar */}
                <div className="bg-zinc-900 border border-pink-500/10 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Instagram className="w-4 h-4 text-pink-400" />
                        <span className="text-sm font-black text-white">Como configurar</span>
                    </div>
                    <ol className="text-xs text-zinc-400 space-y-1.5 list-none">
                        <li><span className="text-pink-400 font-bold mr-2">1.</span>Acesse <a href="https://rss.app" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:underline font-bold">rss.app</a> e crie uma conta</li>
                        <li><span className="text-pink-400 font-bold mr-2">2.</span>Crie um novo feed apontando para o perfil do Instagram: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-[11px]">https://www.instagram.com/@handle</code></li>
                        <li><span className="text-pink-400 font-bold mr-2">3.</span>Copie a URL do feed no formato JSON: <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-[11px]">https://rss.app/feeds/XXXXXXXX.json</code></li>
                        <li><span className="text-pink-400 font-bold mr-2">4.</span>Cole na coluna "Feed URL" do artista abaixo e clique em Salvar</li>
                    </ol>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar artista..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        {([['all', 'Todos'], ['configured', 'Com feed'], ['missing', 'Sem feed']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${filter === val ? 'bg-pink-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Artist list */}
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-16 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.length === 0 && (
                            <div className="text-center py-16 text-zinc-500">Nenhum artista encontrado</div>
                        )}
                        {filtered.map((artist) => {
                            const isSaved = saved === artist.id
                            const isSaving = saving === artist.id
                            const currentFeed = feedValues[artist.id] ?? ''
                            const hasChanged = currentFeed !== (artist.instagramFeedUrl ?? '')

                            return (
                                <div
                                    key={artist.id}
                                    className={`flex items-center gap-3 p-4 bg-zinc-900 border rounded-xl transition-colors ${artist.instagramFeedUrl ? 'border-pink-500/20' : 'border-zinc-800'}`}
                                >
                                    {/* Avatar */}
                                    {artist.primaryImageUrl ? (
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="40px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-400 flex-shrink-0">
                                            {artist.nameRomanized[0]}
                                        </div>
                                    )}

                                    {/* Name */}
                                    <div className="w-32 flex-shrink-0 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{artist.nameRomanized}</p>
                                        {artist.nameHangul && <p className="text-xs text-zinc-500 truncate">{artist.nameHangul}</p>}
                                        {artist.instagramLastSync && (
                                            <p className="text-[10px] text-zinc-700 flex items-center gap-1 mt-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                {timeAgo(artist.instagramLastSync)}
                                            </p>
                                        )}
                                    </div>

                                    {/* Instagram link */}
                                    {artist.socialLinks?.instagram ? (
                                        <a
                                            href={artist.socialLinks.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hidden sm:flex items-center gap-1 text-[10px] text-pink-400 hover:underline flex-shrink-0 w-24 truncate"
                                        >
                                            <Instagram className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">
                                                {artist.socialLinks.instagram.replace('https://www.instagram.com/', '@').replace(/\/$/, '')}
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-700 flex-shrink-0 w-24">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>sem @</span>
                                        </div>
                                    )}

                                    {/* Feed URL input */}
                                    <input
                                        type="url"
                                        value={currentFeed}
                                        onChange={(e) => setFeedValues(prev => ({ ...prev, [artist.id]: e.target.value }))}
                                        placeholder="https://rss.app/feeds/XXXXXXXX.json"
                                        className="flex-1 px-3 py-2 bg-black/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 text-xs min-w-0"
                                    />

                                    {/* Link to Instagram profile */}
                                    {artist.instagramFeedUrl && (
                                        <a
                                            href={artist.instagramFeedUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0 text-zinc-600 hover:text-pink-400 transition-colors"
                                            title="Abrir feed"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                    )}

                                    {/* Save button */}
                                    <button
                                        onClick={() => handleSave(artist.id)}
                                        disabled={isSaving || (!hasChanged && !isSaved)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            isSaved ? 'bg-green-600 text-white' :
                                            hasChanged ? 'bg-pink-600 hover:bg-pink-500 text-white' :
                                            'bg-zinc-800 text-zinc-600 cursor-default'
                                        }`}
                                    >
                                        {isSaved ? <><Check className="w-3 h-3" /> Salvo</> :
                                         isSaving ? '...' :
                                         hasChanged ? 'Salvar' : <Check className="w-3 h-3 text-zinc-700" />}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    )
}
