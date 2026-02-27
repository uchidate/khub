'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Users, Film, Newspaper, Music2, X, LogIn, Clapperboard, Star } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { getRoleLabel } from '@/lib/utils/role-labels'

type FavoriteType = 'artist' | 'production' | 'news' | 'group'

const TYPE_ITEM_LABEL: Record<FavoriteType, string> = {
    artist: 'artista',
    production: 'produção',
    news: 'notícia',
    group: 'grupo',
}

const TYPE_HREF_PREFIX: Record<FavoriteType, string> = {
    artist: '/artists',
    production: '/productions',
    news: '/news',
    group: '/groups',
}

const TYPE_BADGE_COLOR: Record<FavoriteType, string> = {
    artist: 'bg-purple-600',
    production: 'bg-pink-600',
    news: 'bg-cyan-700',
    group: 'bg-blue-600',
}

const TYPE_BADGE_LABEL: Record<FavoriteType, string> = {
    artist: 'Artista',
    production: 'Produção',
    news: 'Notícia',
    group: 'Grupo',
}

interface FavoriteItem {
    id: string
    type: FavoriteType
    // artist / group
    nameRomanized?: string
    nameHangul?: string | null
    primaryImageUrl?: string | null
    roles?: string[]
    gender?: number | null
    // production
    title?: string
    titleKr?: string | null
    imageUrl?: string | null
    year?: number | null
    productionType?: string | null
    // news
    publishedAt?: string | null
    source?: string | null
    // metadata
    favoritedAt?: string | Date
}

type TabKey = 'all' | FavoriteType

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'all',        label: 'Todos',     icon: Heart },
    { key: 'artist',     label: 'Artistas',  icon: Users },
    { key: 'production', label: 'Produções', icon: Film },
    { key: 'news',       label: 'Notícias',  icon: Newspaper },
    { key: 'group',      label: 'Grupos',    icon: Music2 },
]

function formatRelativeDate(date: string | Date): string {
    const d = new Date(date)
    const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
    if (diffDays === 0) return 'hoje'
    if (diffDays === 1) return 'ontem'
    if (diffDays < 7)  return `há ${diffDays} dias`
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem.`
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} meses`
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function isRecent(date?: string | Date): boolean {
    if (!date) return false
    return Date.now() - new Date(date).getTime() < 7 * 86400000
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function FavoriteCard({ item, onRemove }: { item: FavoriteItem; onRemove: () => void }) {
    const href  = `${TYPE_HREF_PREFIX[item.type]}/${item.id}`
    const name  = item.nameRomanized ?? item.title ?? '—'
    const image = item.primaryImageUrl ?? item.imageUrl

    const secondaryLine = (() => {
        switch (item.type) {
            case 'artist': {
                const role = item.roles?.[0] ? getRoleLabel(item.roles[0], item.gender) : null
                return item.nameHangul ?? role ?? null
            }
            case 'production': {
                const parts = [item.year, item.productionType].filter(Boolean)
                return parts.length ? parts.join(' · ') : (item.titleKr ?? null)
            }
            case 'group':
                return item.nameHangul ?? null
            case 'news':
                return item.source ?? (item.publishedAt ? formatRelativeDate(item.publishedAt) : null)
        }
    })()

    const tertiaryLine = (() => {
        if (item.type === 'production' && item.titleKr) return item.titleKr
        if (item.type === 'artist' && item.nameHangul && item.roles?.[0]) {
            return getRoleLabel(item.roles[0], item.gender)
        }
        if (item.type === 'news' && item.publishedAt && item.source) {
            return formatRelativeDate(item.publishedAt)
        }
        return null
    })()

    const recent = isRecent(item.favoritedAt)

    return (
        <div className="group relative">
            <Link href={href} className="block">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900">
                    {/* Image */}
                    {image ? (
                        <Image
                            src={image}
                            alt={name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60 flex items-center justify-center">
                            <span className="text-white text-3xl font-black">{name[0]}</span>
                        </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                    {/* Top badges row */}
                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
                        <div className="flex flex-col gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black text-white self-start ${TYPE_BADGE_COLOR[item.type]}`}>
                                {TYPE_BADGE_LABEL[item.type]}
                            </span>
                            {recent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black text-white bg-orange-500 self-start">
                                    Novo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white text-[11px] font-black line-clamp-2 leading-tight">
                            {name}
                        </p>
                        {secondaryLine && (
                            <p className="text-zinc-400 text-[9px] mt-0.5 line-clamp-1">{secondaryLine}</p>
                        )}
                        {tertiaryLine && (
                            <p className="text-zinc-500 text-[9px] mt-0.5 line-clamp-1 italic">{tertiaryLine}</p>
                        )}
                        {item.favoritedAt && (
                            <p className="text-zinc-600 text-[8px] mt-1">{formatRelativeDate(item.favoritedAt)}</p>
                        )}
                    </div>
                </div>
            </Link>

            {/* Remove button */}
            <button
                onClick={onRemove}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                title="Remover dos favoritos"
            >
                <X className="w-3 h-3 text-white" />
            </button>
        </div>
    )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ counts }: { counts: Record<TabKey, number> }) {
    const stats = [
        { key: 'artist',     label: 'Artistas',  icon: Users,       color: 'text-purple-400' },
        { key: 'production', label: 'Produções',  icon: Clapperboard, color: 'text-pink-400' },
        { key: 'group',      label: 'Grupos',     icon: Music2,      color: 'text-blue-400' },
        { key: 'news',       label: 'Notícias',   icon: Newspaper,   color: 'text-cyan-400' },
    ] as const

    return (
        <div className="grid grid-cols-4 gap-3 mb-8">
            {stats.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="dark:bg-zinc-900/60 bg-zinc-100 rounded-xl p-3 text-center border dark:border-white/5 border-zinc-200">
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                    <p className="text-xl font-black dark:text-white text-zinc-900">{counts[key]}</p>
                    <p className="text-[10px] dark:text-zinc-500 text-zinc-500 font-medium">{label}</p>
                </div>
            ))}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
    const { status } = useSession()
    const { favorites: localIds, toggle, isLoaded: localLoaded } = useFavorites()
    const [items, setItems]           = useState<FavoriteItem[]>([])
    const [fetchLoaded, setFetchLoaded] = useState(false)
    const [activeTab, setActiveTab]   = useState<TabKey>('all')

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/users/favorites?full=true')
                .then(r => r.json())
                .then(data => { setItems(data.items || []); setFetchLoaded(true) })
                .catch(() => setFetchLoaded(true))
        } else if (status !== 'loading') {
            setFetchLoaded(true)
        }
    }, [status])

    const handleRemove = (item: FavoriteItem) => {
        toggle(item.id, TYPE_ITEM_LABEL[item.type] as Parameters<typeof toggle>[1])
        setItems(prev => prev.filter(i => i.id !== item.id))
    }

    const isLoading    = !localLoaded || (status === 'authenticated' && !fetchLoaded)
    const displayItems = status === 'authenticated' ? items : []

    const counts: Record<TabKey, number> = {
        all:        displayItems.length,
        artist:     displayItems.filter(i => i.type === 'artist').length,
        production: displayItems.filter(i => i.type === 'production').length,
        news:       displayItems.filter(i => i.type === 'news').length,
        group:      displayItems.filter(i => i.type === 'group').length,
    }

    const filtered = activeTab === 'all'
        ? displayItems
        : displayItems.filter(i => i.type === activeTab)

    if (isLoading) {
        return (
            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="dark:text-zinc-500 text-zinc-600 font-medium">Carregando seus favoritos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20 min-h-screen">

            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic">
                        Meus Favoritos
                    </h1>
                </div>
                <p className="dark:text-zinc-500 text-zinc-600 text-sm font-medium">
                    {status === 'authenticated'
                        ? `${counts.all} ${counts.all === 1 ? 'item favoritado' : 'itens favoritados'}`
                        : 'Faça login para sincronizar seus favoritos entre dispositivos'}
                </p>
            </header>

            {/* Unauthenticated */}
            {status === 'unauthenticated' && (
                <div className="dark:bg-zinc-900/50 bg-zinc-50 rounded-2xl dark:border-white/5 border border-zinc-200 p-12 text-center">
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-20 h-20 rounded-full dark:bg-zinc-800 bg-zinc-200 flex items-center justify-center">
                            <LogIn className="w-10 h-10 dark:text-zinc-500 text-zinc-400" />
                        </div>
                        <div>
                            <p className="dark:text-white text-zinc-900 font-black text-xl mb-2">
                                {localIds.length > 0
                                    ? `Você tem ${localIds.length} ${localIds.length === 1 ? 'favorito' : 'favoritos'} salvos localmente`
                                    : 'Nenhum favorito ainda'}
                            </p>
                            <p className="dark:text-zinc-500 text-zinc-600 text-sm font-medium mb-6 max-w-md mx-auto">
                                Faça login para ver seus favoritos com imagens e sincronizar entre dispositivos.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/auth/login" className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
                                <LogIn className="w-4 h-4" /> Fazer Login
                            </Link>
                            <Link href="/artists" className="px-6 py-3 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl font-bold text-sm transition-colors">
                                Explorar Artistas
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Authenticated */}
            {status === 'authenticated' && (
                <>
                    {/* Empty */}
                    {counts.all === 0 && (
                        <div className="dark:bg-zinc-900/50 bg-zinc-50 rounded-2xl dark:border-white/5 border border-zinc-200 p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full dark:bg-zinc-800 bg-zinc-200 flex items-center justify-center">
                                    <Star className="w-8 h-8 dark:text-zinc-600 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="dark:text-zinc-300 text-zinc-700 font-bold mb-1">Nenhum favorito ainda</p>
                                    <p className="dark:text-zinc-600 text-zinc-500 text-sm font-medium mb-6">
                                        Explore o HallyuHub e adicione seus favoritos clicando no ícone de coração
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Link href="/artists" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">Ver Artistas</Link>
                                    <Link href="/productions" className="px-5 py-2.5 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-lg font-bold text-sm transition-colors">Ver Produções</Link>
                                    <Link href="/news" className="px-5 py-2.5 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-lg font-bold text-sm transition-colors">Ver Notícias</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {counts.all > 0 && (
                        <>
                            {/* Stats bar */}
                            <StatsBar counts={counts} />

                            {/* Tabs */}
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                                {TABS.map(tab => {
                                    const count   = counts[tab.key]
                                    if (tab.key !== 'all' && count === 0) return null
                                    const Icon    = tab.icon
                                    const isActive = activeTab === tab.key
                                    return (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                                                isActive
                                                    ? 'bg-purple-600 text-white'
                                                    : 'dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-white bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                                                isActive ? 'bg-white/20 text-white' : 'dark:bg-zinc-700 dark:text-zinc-400 bg-zinc-200 text-zinc-500'
                                            }`}>{count}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Grid */}
                            {filtered.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
                                    {filtered.map(item => (
                                        <FavoriteCard
                                            key={item.id}
                                            item={item}
                                            onRemove={() => handleRemove(item)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <p className="dark:text-zinc-500 text-zinc-500 font-medium">Nenhum favorito nessa categoria</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}
