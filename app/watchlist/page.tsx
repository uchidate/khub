'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookmarkPlus, LogIn, Film } from 'lucide-react'
import { WatchStatus, WATCH_STATUS_LABELS, WATCH_STATUS_ICONS } from '@/hooks/useWatchlist'
import { StarRating } from '@/components/ui/StarRating'
import { WatchButton } from '@/components/ui/WatchButton'

interface WatchEntry {
    id: string
    productionId: string
    status: WatchStatus
    rating: number | null
    notes: string | null
    watchedAt: string | null
    updatedAt: string
    production: {
        id: string
        titlePt: string
        titleKr: string | null
        imageUrl: string | null
        type: string
        year: number | null
        episodeCount: number | null
        productionStatus: string | null
    }
}

const STATUS_TABS: Array<{ key: WatchStatus | 'ALL'; label: string; icon: string }> = [
    { key: 'ALL', label: 'Todos', icon: '📋' },
    { key: 'WANT_TO_WATCH', label: WATCH_STATUS_LABELS.WANT_TO_WATCH, icon: WATCH_STATUS_ICONS.WANT_TO_WATCH },
    { key: 'WATCHING', label: WATCH_STATUS_LABELS.WATCHING, icon: WATCH_STATUS_ICONS.WATCHING },
    { key: 'WATCHED', label: WATCH_STATUS_LABELS.WATCHED, icon: WATCH_STATUS_ICONS.WATCHED },
    { key: 'DROPPED', label: WATCH_STATUS_LABELS.DROPPED, icon: WATCH_STATUS_ICONS.DROPPED },
]

const TYPE_LABEL: Record<string, string> = {
    DRAMA: 'Drama',
    MOVIE: 'Filme',
    VARIETY: 'Variety',
    WEBTOON: 'Webtoon',
}

export default function WatchlistPage() {
    const { status } = useSession()
    const [entries, setEntries] = useState<WatchEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<WatchStatus | 'ALL'>('ALL')

    useEffect(() => {
        if (status === 'loading') return
        if (status === 'unauthenticated') {
            setLoading(false)
            return
        }

        fetch('/api/users/watchlist')
            .then(r => r.json())
            .then(data => setEntries(data.entries ?? []))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [status])

    if (status === 'unauthenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center pt-24">
                <div className="text-center space-y-4">
                    <BookmarkPlus size={48} className="mx-auto text-zinc-500" />
                    <p className="text-zinc-400">Faça login para ver sua lista</p>
                    <Link
                        href="/auth/login?callbackUrl=/watchlist"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-neon-pink text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <LogIn size={16} />
                        Entrar
                    </Link>
                </div>
            </div>
        )
    }

    const filtered = activeTab === 'ALL' ? entries : entries.filter(e => e.status === activeTab)

    const counts: Record<string, number> = {}
    for (const e of entries) {
        counts[e.status] = (counts[e.status] ?? 0) + 1
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <BookmarkPlus size={32} className="text-neon-pink" />
                    Minha Lista
                </h1>
                <p className="text-zinc-400 mt-1">
                    {entries.length === 0 && !loading
                        ? 'Nenhuma produção na sua lista ainda'
                        : `${entries.length} produç${entries.length === 1 ? 'ão' : 'ões'} na sua lista`}
                </p>
            </div>

            {/* Stats bar */}
            {entries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {(Object.keys(WATCH_STATUS_LABELS) as WatchStatus[]).map(s => (
                        <div key={s} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-1">{WATCH_STATUS_ICONS[s]}</div>
                            <div className="text-2xl font-bold text-white">{counts[s] ?? 0}</div>
                            <div className="text-xs text-zinc-400 mt-0.5">{WATCH_STATUS_LABELS[s]}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
                {STATUS_TABS.map(tab => {
                    const count = tab.key === 'ALL' ? entries.length : (counts[tab.key] ?? 0)
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-neon-pink text-black'
                                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            <span className={`text-xs ${activeTab === tab.key ? 'text-black/70' : 'text-zinc-500'}`}>
                                {count}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-zinc-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                    <Film size={40} className="mx-auto mb-3 opacity-40" />
                    <p>Nenhuma produção nesta categoria</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filtered.map(entry => (
                        <WatchCard key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    )
}

function WatchCard({ entry }: { entry: WatchEntry }) {
    const { production: p } = entry
    return (
        <div className="group relative flex flex-col">
            <Link href={`/productions/${p.id}`} className="block">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 mb-2">
                    {p.imageUrl ? (
                        <Image
                            src={p.imageUrl}
                            alt={p.titlePt}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                            <Film size={32} />
                        </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-2 left-2">
                        <span className="text-lg">{WATCH_STATUS_ICONS[entry.status]}</span>
                    </div>
                    {/* Type badge */}
                    <div className="absolute bottom-2 right-2">
                        <span className="text-xs bg-black/70 text-zinc-300 px-2 py-0.5 rounded-full">
                            {TYPE_LABEL[p.type] ?? p.type}
                        </span>
                    </div>
                </div>
            </Link>
            <div className="flex-1 space-y-1">
                <Link href={`/productions/${p.id}`}>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 hover:text-neon-pink transition-colors leading-tight">
                        {p.titlePt}
                    </h3>
                </Link>
                {p.year && <p className="text-xs text-zinc-500">{p.year}</p>}
                {entry.rating && (
                    <StarRating value={entry.rating} onChange={() => {}} readonly size={14} />
                )}
            </div>
            {/* Inline WatchButton for quick update */}
            <div className="mt-2">
                <WatchButton productionId={p.id} productionName={p.titlePt} className="w-full" />
            </div>
        </div>
    )
}
