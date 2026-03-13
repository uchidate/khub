'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    BookmarkPlus, LogIn, Film, Bookmark, Play, CheckCircle, XCircle,
    LayoutList, Star,
} from 'lucide-react'
import { WatchStatus, WATCH_STATUS_LABELS } from '@/hooks/useWatchlist'
import { WatchButton } from '@/components/ui/WatchButton'
import { ScrollToTop } from '@/components/ui/ScrollToTop'

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

const STATUS_ICON: Record<WatchStatus, React.ReactNode> = {
    WANT_TO_WATCH: <Bookmark size={15} />,
    WATCHING:      <Play size={15} />,
    WATCHED:       <CheckCircle size={15} />,
    DROPPED:       <XCircle size={15} />,
}

const STATUS_COLOR: Record<WatchStatus, string> = {
    WANT_TO_WATCH: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    WATCHING:      'text-green-400 bg-green-400/10 border-green-400/20',
    WATCHED:       'text-purple-400 bg-purple-400/10 border-purple-400/20',
    DROPPED:       'text-red-400 bg-red-400/10 border-red-400/20',
}

const STATUS_ACTIVE: Record<WatchStatus, string> = {
    WANT_TO_WATCH: 'bg-teal-500 text-white border-teal-500',
    WATCHING:      'bg-green-500 text-white border-green-500',
    WATCHED:       'bg-purple-600 text-white border-purple-600',
    DROPPED:       'bg-red-600 text-white border-red-600',
}

const TYPE_LABEL: Record<string, string> = {
    DRAMA: 'Drama', MOVIE: 'Filme', VARIETY: 'Variety', WEBTOON: 'Webtoon',
    SERIES: 'Série', MOVIE_DRAMA: 'Filme',
}

const STATUS_TABS: Array<{ key: WatchStatus | 'ALL'; label: string }> = [
    { key: 'ALL',           label: 'Todos' },
    { key: 'WANT_TO_WATCH', label: WATCH_STATUS_LABELS.WANT_TO_WATCH },
    { key: 'WATCHING',      label: WATCH_STATUS_LABELS.WATCHING },
    { key: 'WATCHED',       label: WATCH_STATUS_LABELS.WATCHED },
    { key: 'DROPPED',       label: WATCH_STATUS_LABELS.DROPPED },
]

export default function WatchlistPage() {
    const { status } = useSession()
    const [entries, setEntries] = useState<WatchEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<WatchStatus | 'ALL'>('ALL')

    useEffect(() => {
        if (status === 'loading') return
        if (status === 'unauthenticated') { setLoading(false); return }

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
    for (const e of entries) counts[e.status] = (counts[e.status] ?? 0) + 1

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-16">

            {/* Header */}
            <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1.5">
                    <LayoutList size={10} />
                    Minha Lista
                </p>
                <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight leading-none">
                    {loading ? 'Carregando...' : entries.length === 0
                        ? 'Nenhuma produção ainda'
                        : `${entries.length} produção${entries.length !== 1 ? 'ões' : ''}`}
                </h1>
            </div>

            {/* Stats bar */}
            {entries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {(Object.keys(WATCH_STATUS_LABELS) as WatchStatus[]).map(s => (
                        <button
                            key={s}
                            onClick={() => setActiveTab(s)}
                            className={`glass-card p-4 text-left transition-all border ${activeTab === s ? STATUS_ACTIVE[s] : 'border-white/5 hover:border-white/15'}`}
                        >
                            <div className={`mb-2 ${activeTab === s ? 'text-white' : STATUS_COLOR[s].split(' ')[0]}`}>
                                {STATUS_ICON[s]}
                            </div>
                            <div className={`text-2xl font-black leading-none ${activeTab === s ? 'text-white' : 'text-white'}`}>
                                {counts[s] ?? 0}
                            </div>
                            <div className={`text-xs mt-1 font-bold uppercase tracking-wider ${activeTab === s ? 'text-white/70' : 'text-zinc-500'}`}>
                                {WATCH_STATUS_LABELS[s]}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap mb-6">
                {STATUS_TABS.map(tab => {
                    const count = tab.key === 'ALL' ? entries.length : (counts[tab.key] ?? 0)
                    const isActive = activeTab === tab.key
                    const activeStyle = tab.key !== 'ALL' ? STATUS_ACTIVE[tab.key as WatchStatus] : 'bg-white text-black border-white'
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors border ${
                                isActive
                                    ? activeStyle
                                    : 'bg-zinc-800/50 text-zinc-300 border-white/5 hover:border-white/20 hover:text-white'
                            }`}
                        >
                            {tab.key !== 'ALL' && (
                                <span className={isActive ? 'text-white' : STATUS_COLOR[tab.key as WatchStatus].split(' ')[0]}>
                                    {STATUS_ICON[tab.key as WatchStatus]}
                                </span>
                            )}
                            <span>{tab.label}</span>
                            <span className={`text-xs ${isActive ? 'opacity-70' : 'text-zinc-500'}`}>{count}</span>
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

            <ScrollToTop />
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
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${STATUS_COLOR[entry.status]}`}>
                            {STATUS_ICON[entry.status]}
                        </span>
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
                    <div className="flex items-center gap-1">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-yellow-400 font-bold">{entry.rating}/10</span>
                    </div>
                )}
            </div>
            <div className="mt-2">
                <WatchButton productionId={p.id} productionName={p.titlePt} className="w-full" />
            </div>
        </div>
    )
}
