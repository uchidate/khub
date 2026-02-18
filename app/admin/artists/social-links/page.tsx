'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Instagram, Twitter, Youtube, X, Check, Search, ExternalLink } from 'lucide-react'
import Image from 'next/image'

interface SocialLinks {
    instagram?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    weverse?: string
    fancafe?: string
    naverBlog?: string
}

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    socialLinks: SocialLinks | null
}

const PLATFORMS: { key: keyof SocialLinks; label: string; placeholder: string; icon?: React.ReactNode; color: string }[] = [
    { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/username', color: 'text-pink-400', icon: <Instagram className="w-4 h-4" /> },
    { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/username', color: 'text-sky-400', icon: <Twitter className="w-4 h-4" /> },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@channel', color: 'text-red-400', icon: <Youtube className="w-4 h-4" /> },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@username', color: 'text-zinc-300', icon: <span className="text-sm font-black">TK</span> },
    { key: 'weverse', label: 'Weverse', placeholder: 'https://weverse.io/artist-name', color: 'text-green-400', icon: <span className="text-sm font-black">W</span> },
    { key: 'fancafe', label: 'Fancafe (Daum)', placeholder: 'https://cafe.daum.net/cafename', color: 'text-yellow-400', icon: <span className="text-sm font-black">FC</span> },
    { key: 'naverBlog', label: 'Naver Blog', placeholder: 'https://blog.naver.com/username', color: 'text-emerald-400', icon: <span className="text-sm font-black">N</span> },
]

function countLinks(links: SocialLinks | null): number {
    if (!links) return 0
    return Object.values(links).filter(Boolean).length
}

function SocialLinksModal({ artist, onClose, onSave }: {
    artist: Artist
    onClose: () => void
    onSave: (links: SocialLinks) => Promise<void>
}) {
    const [links, setLinks] = useState<SocialLinks>(artist.socialLinks || {})
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        setSaving(true)
        setError('')
        try {
            // Remove empty strings
            const cleaned: SocialLinks = Object.fromEntries(
                Object.entries(links).filter(([, v]) => v && v.trim())
            ) as SocialLinks
            await onSave(cleaned)
            onClose()
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-4 rounded-t-2xl">
                    {artist.primaryImageUrl ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                            <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill sizes="40px" className="object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-black text-zinc-400 flex-shrink-0">
                            {artist.nameRomanized[0]}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-white truncate">{artist.nameRomanized}</h2>
                        {artist.nameHangul && <p className="text-xs text-zinc-500">{artist.nameHangul}</p>}
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Fields */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
                    )}
                    {PLATFORMS.map(({ key, label, placeholder, icon, color }) => (
                        <div key={key}>
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
                                <span className={color}>{icon}</span>
                                <span className="text-zinc-400">{label}</span>
                            </label>
                            <input
                                type="url"
                                value={links[key] || ''}
                                onChange={(e) => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={placeholder}
                                className="w-full px-4 py-2.5 bg-black/50 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 text-sm"
                            />
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4 flex gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-colors font-medium text-sm">
                        Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500 disabled:opacity-50 transition-colors font-bold text-sm">
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default function SocialLinksAdminPage() {
    const [artists, setArtists] = useState<Artist[]>([])
    const [filtered, setFiltered] = useState<Artist[]>([])
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'missing' | 'complete'>('all')
    const [editing, setEditing] = useState<Artist | null>(null)
    const [loading, setLoading] = useState(true)
    const [savedId, setSavedId] = useState<string | null>(null)

    const fetchArtists = useCallback(async () => {
        setLoading(true)
        try {
            // Fetch all artists (no pagination limit needed here — we need all for the social links view)
            const res = await fetch('/api/admin/artists?limit=500')
            const data = await res.json()
            setArtists(data.data || [])
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
                (a.nameHangul || '').toLowerCase().includes(q)
            )
        }
        if (filter === 'missing') list = list.filter(a => !countLinks(a.socialLinks))
        if (filter === 'complete') list = list.filter(a => countLinks(a.socialLinks) > 0)
        setFiltered(list)
    }, [artists, search, filter])

    const handleSave = async (artistId: string, links: SocialLinks) => {
        const res = await fetch(`/api/admin/artists?id=${artistId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ socialLinks: links }),
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || 'Erro ao salvar')
        }
        // Update local state
        setArtists(prev => prev.map(a =>
            a.id === artistId ? { ...a, socialLinks: links } : a
        ))
        setSavedId(artistId)
        setTimeout(() => setSavedId(null), 2000)
    }

    const missing = artists.filter(a => !countLinks(a.socialLinks)).length
    const complete = artists.filter(a => countLinks(a.socialLinks) > 0).length

    return (
        <AdminLayout title="Redes Sociais dos Artistas">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-white">{artists.length}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Total</p>
                    </div>
                    <div className="bg-zinc-900 border border-green-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-green-400">{complete}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Com links</p>
                    </div>
                    <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-center">
                        <p className="text-2xl font-black text-red-400">{missing}</p>
                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-bold">Sem links</p>
                    </div>
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
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/50"
                        />
                    </div>
                    <div className="flex gap-2">
                        {([['all', 'Todos'], ['missing', 'Sem links'], ['complete', 'Com links']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setFilter(val)}
                                className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${filter === val ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Artists list */}
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
                            const linkCount = countLinks(artist.socialLinks)
                            const isSaved = savedId === artist.id
                            return (
                                <div
                                    key={artist.id}
                                    className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{artist.nameRomanized}</p>
                                        {artist.nameHangul && <p className="text-xs text-zinc-500 truncate">{artist.nameHangul}</p>}
                                    </div>

                                    {/* Platform icons */}
                                    <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                                        {PLATFORMS.map(({ key, color, icon }) => {
                                            const hasLink = !!(artist.socialLinks?.[key])
                                            return (
                                                <span key={key} className={`transition-opacity ${hasLink ? color : 'text-zinc-700'}`} title={key}>
                                                    {artist.socialLinks?.[key] ? (
                                                        <a
                                                            href={artist.socialLinks[key]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="hover:opacity-80"
                                                        >
                                                            {icon}
                                                        </a>
                                                    ) : icon}
                                                </span>
                                            )
                                        })}
                                    </div>

                                    {/* Link count badge */}
                                    <span className={`text-xs font-black px-2 py-1 rounded-full flex-shrink-0 ${linkCount > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {linkCount}/{PLATFORMS.length}
                                    </span>

                                    {/* Edit button */}
                                    <button
                                        onClick={() => setEditing(artist)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isSaved ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}`}
                                    >
                                        {isSaved ? <><Check className="w-3 h-3" /> Salvo</> : <><ExternalLink className="w-3 h-3" /> Editar</>}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editing && (
                <SocialLinksModal
                    artist={editing}
                    onClose={() => setEditing(null)}
                    onSave={(links) => handleSave(editing.id, links)}
                />
            )}
        </AdminLayout>
    )
}
