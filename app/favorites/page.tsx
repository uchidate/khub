'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Users, Film, Newspaper, Music2, X, LogIn } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

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
    news: 'bg-cyan-600',
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
    nameRomanized?: string
    title?: string
    imageUrl?: string | null
    primaryImageUrl?: string | null
}

type TabKey = 'all' | FavoriteType

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'Todos', icon: Heart },
    { key: 'artist', label: 'Artistas', icon: Users },
    { key: 'production', label: 'Produções', icon: Film },
    { key: 'news', label: 'Notícias', icon: Newspaper },
    { key: 'group', label: 'Grupos', icon: Music2 },
]

export default function FavoritesPage() {
    const { status } = useSession()
    const { favorites: localIds, toggle, isLoaded: localLoaded } = useFavorites()
    const [items, setItems] = useState<FavoriteItem[]>([])
    const [fetchLoaded, setFetchLoaded] = useState(false)
    const [activeTab, setActiveTab] = useState<TabKey>('all')

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/users/favorites?full=true')
                .then(r => r.json())
                .then(data => {
                    setItems(data.items || [])
                    setFetchLoaded(true)
                })
                .catch(() => setFetchLoaded(true))
        } else if (status !== 'loading') {
            setFetchLoaded(true)
        }
    }, [status])

    const handleRemove = (item: FavoriteItem) => {
        const itemType = TYPE_ITEM_LABEL[item.type] as Parameters<typeof toggle>[1]
        toggle(item.id, itemType)
        setItems(prev => prev.filter(i => i.id !== item.id))
    }

    const isLoading = !localLoaded || (status === 'authenticated' && !fetchLoaded)

    const displayItems = status === 'authenticated' ? items : []

    const counts: Record<TabKey, number> = {
        all: displayItems.length,
        artist: displayItems.filter(i => i.type === 'artist').length,
        production: displayItems.filter(i => i.type === 'production').length,
        news: displayItems.filter(i => i.type === 'news').length,
        group: displayItems.filter(i => i.type === 'group').length,
    }

    const filtered = activeTab === 'all' ? displayItems : displayItems.filter(i => i.type === activeTab)

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
                <div className="flex items-center gap-3 mb-3">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" />
                    <h1 className="text-4xl md:text-6xl font-black hallyu-gradient-text uppercase tracking-tighter italic">
                        Meus Favoritos
                    </h1>
                </div>
                <p className="dark:text-zinc-500 text-zinc-600 text-lg font-medium">
                    {status === 'authenticated'
                        ? `${counts.all} ${counts.all === 1 ? 'item favoritado' : 'itens favoritados'}`
                        : 'Faça login para sincronizar seus favoritos entre dispositivos'}
                </p>
            </header>

            {/* Unauthenticated state */}
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
                            <Link
                                href="/auth/login"
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                Fazer Login
                            </Link>
                            <Link
                                href="/artists"
                                className="px-6 py-3 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl font-bold text-sm transition-colors"
                            >
                                Explorar Artistas
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Authenticated state */}
            {status === 'authenticated' && (
                <>
                    {/* Empty state */}
                    {counts.all === 0 && (
                        <div className="dark:bg-zinc-900/50 bg-zinc-50 rounded-2xl dark:border-white/5 border border-zinc-200 p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full dark:bg-zinc-800 bg-zinc-200 flex items-center justify-center">
                                    <Heart className="w-8 h-8 dark:text-zinc-600 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="dark:text-zinc-300 text-zinc-700 font-bold mb-1">Nenhum favorito ainda</p>
                                    <p className="dark:text-zinc-600 text-zinc-500 text-sm font-medium mb-6">
                                        Explore o HallyuHub e adicione seus favoritos clicando no ícone de coração
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Link href="/artists" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors">
                                        Ver Artistas
                                    </Link>
                                    <Link href="/productions" className="px-5 py-2.5 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-lg font-bold text-sm transition-colors">
                                        Ver Produções
                                    </Link>
                                    <Link href="/news" className="px-5 py-2.5 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700 bg-zinc-200 text-zinc-800 hover:bg-zinc-300 rounded-lg font-bold text-sm transition-colors">
                                        Ver Notícias
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs + Grid */}
                    {counts.all > 0 && (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
                                {TABS.map(tab => {
                                    const count = counts[tab.key]
                                    if (tab.key !== 'all' && count === 0) return null
                                    const Icon = tab.icon
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
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'dark:bg-zinc-700 dark:text-zinc-400 bg-zinc-200 text-zinc-500'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Items grid */}
                            {filtered.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                                    {filtered.map(item => {
                                        const href = `${TYPE_HREF_PREFIX[item.type]}/${item.id}`
                                        const name = item.nameRomanized || item.title || '—'
                                        const image = item.imageUrl || item.primaryImageUrl

                                        return (
                                            <div key={item.id} className="group relative">
                                                <Link href={href} className="block">
                                                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden dark:bg-zinc-900 bg-zinc-100 mb-2">
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

                                                        {/* Type badge */}
                                                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black text-white ${TYPE_BADGE_COLOR[item.type]}`}>
                                                            {TYPE_BADGE_LABEL[item.type]}
                                                        </div>

                                                        {/* Gradient overlay */}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                                    </div>
                                                    <p className="dark:text-white text-zinc-900 text-xs font-semibold line-clamp-2 group-hover:text-purple-400 transition-colors leading-snug">
                                                        {name}
                                                    </p>
                                                </Link>

                                                {/* Remove button */}
                                                <button
                                                    onClick={() => handleRemove(item)}
                                                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    title="Remover dos favoritos"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        )
                                    })}
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
