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
    artist: 'bg-[#ff2d78]',
    production: 'bg-[#ff2d78]',
    news: 'bg-muted',
    group: 'bg-foreground',
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
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface">
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
                        <div className="w-full h-full bg-gradient-to-br from-[#ff2d78]/20 to-[#f5f5f7] flex items-center justify-center">
                            <span className="text-foreground text-3xl font-black">{name[0]}</span>
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
                            <p className="text-white/70 text-[9px] mt-0.5 line-clamp-1">{secondaryLine}</p>
                        )}
                        {tertiaryLine && (
                            <p className="text-white/50 text-[9px] mt-0.5 line-clamp-1 italic">{tertiaryLine}</p>
                        )}
                        {item.favoritedAt && (
                            <p className="text-white/40 text-[8px] mt-1">{formatRelativeDate(item.favoritedAt)}</p>
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
        { key: 'artist',     label: 'Artistas',  icon: Users,       color: 'text-[#ff2d78]' },
        { key: 'production', label: 'Produções',  icon: Clapperboard, color: 'text-[#ff2d78]' },
        { key: 'group',      label: 'Grupos',     icon: Music2,      color: 'text-foreground' },
        { key: 'news',       label: 'Notícias',   icon: Newspaper,   color: 'text-muted' },
    ] as const

    return (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="rounded-2xl border border-border bg-surface p-3 text-center shadow-sm">
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                    <p className="text-xl font-black text-foreground">{counts[key]}</p>
                    <p className="text-[10px] text-muted font-medium">{label}</p>
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
            <div className="py-8 md:py-12 pb-20 px-4 sm:px-12 md:px-20 min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted font-medium">Carregando seus favoritos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto min-h-screen max-w-7xl bg-background px-4 py-5 pb-12 sm:px-6 lg:px-8">

            {/* Header */}
            <header className="mb-5 rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                    <Heart className="h-3 w-3 fill-current" />
                    Biblioteca pessoal
                </p>
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                        Meus Favoritos
                    </h1>
                    <p className="text-sm leading-5 text-muted">
                        {status === 'authenticated'
                            ? `${counts.all} ${counts.all === 1 ? 'item favoritado' : 'itens favoritados'}`
                            : 'Faça login para sincronizar seus favoritos entre dispositivos'}
                    </p>
                </div>
            </header>

            {/* Unauthenticated */}
            {status === 'unauthenticated' && (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center">
                            <LogIn className="w-10 h-10 text-muted" />
                        </div>
                        <div>
                            <p className="text-foreground font-black text-xl mb-2">
                                {localIds.length > 0
                                    ? `Você tem ${localIds.length} ${localIds.length === 1 ? 'favorito' : 'favoritos'} salvos localmente`
                                    : 'Nenhum favorito ainda'}
                            </p>
                            <p className="text-muted text-sm font-medium mb-6 max-w-md mx-auto">
                                Faça login para ver seus favoritos com imagens e sincronizar entre dispositivos.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/auth/login" className="px-8 py-3 bg-[#ff2d78] hover:opacity-90 text-white rounded-xl font-bold text-sm transition-opacity flex items-center gap-2">
                                <LogIn className="w-4 h-4" /> Fazer Login
                            </Link>
                            <Link href="/artists" className="px-6 py-3 bg-surface hover:bg-surface-hover border border-border text-foreground rounded-xl font-bold text-sm transition-colors">
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
                        <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
                                    <Star className="w-8 h-8 text-muted" />
                                </div>
                                <div>
                                    <p className="text-foreground font-bold mb-1">Nenhum favorito ainda</p>
                                    <p className="text-muted text-sm font-medium mb-6">
                                        Explore o HallyuHub e adicione seus favoritos clicando no ícone de coração
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    <Link href="/artists" className="px-5 py-2.5 bg-[#ff2d78] text-white rounded-lg font-bold text-sm hover:opacity-90 transition-opacity">Ver Artistas</Link>
                                    <Link href="/productions" className="px-5 py-2.5 bg-surface hover:bg-surface-hover border border-border text-foreground rounded-lg font-bold text-sm transition-colors">Ver Produções</Link>
                                    <Link href="/news" className="px-5 py-2.5 bg-surface hover:bg-surface-hover border border-border text-foreground rounded-lg font-bold text-sm transition-colors">Ver Notícias</Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {counts.all > 0 && (
                        <>
                            {/* Stats bar */}
                            <StatsBar counts={counts} />

                            {/* Tabs */}
                            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
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
                                                    ? 'bg-[#ff2d78] text-white'
                                                    : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground border border-border'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-surface-hover text-muted'
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
                                    <p className="text-muted font-medium">Nenhum favorito nessa categoria</p>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    )
}
