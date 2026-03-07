'use client'

import { useState, useEffect, useCallback, useDeferredValue, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { Search, User, Newspaper, Film, Users, ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/^[-*+]\s+/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
}

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender: number | null
}

interface Group {
    id: string
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
}

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    contentMd: string
}

interface Production {
    id: string
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface SearchData {
    artists: Artist[]
    groups: Group[]
    news: NewsItem[]
    productions: Production[]
}

type FilterType = 'all' | 'artists' | 'groups' | 'news' | 'productions'

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q') || ''
    const activeFilter = (searchParams.get('type') || 'all') as FilterType

    const [data, setData] = useState<SearchData | null>(null)
    const [loading, setLoading] = useState(false)
    // useDeferredValue: mantém resultados anteriores visíveis enquanto nova busca carrega
    const deferredData = useDeferredValue(data)
    const isStale = loading && deferredData !== null

    const fetchResults = useCallback(async (q: string) => {
        if (!q || q.trim().length < 2) {
            setData(null)
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/search/full?q=${encodeURIComponent(q)}`)
            if (res.ok) {
                setData(await res.json())
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchResults(query)
    }, [query, fetchResults])

    const setFilter = (type: FilterType) => {
        const params = new URLSearchParams(searchParams.toString())
        if (type === 'all') params.delete('type')
        else params.set('type', type)
        router.replace(`/search?${params.toString()}`, { scroll: false })
    }

    const artists = deferredData?.artists ?? []
    const groups = deferredData?.groups ?? []
    const news = deferredData?.news ?? []
    const productions = deferredData?.productions ?? []
    const total = artists.length + groups.length + news.length + productions.length

    const tabs: { key: FilterType; label: string; count: number; icon: React.ReactNode; color: string }[] = [
        { key: 'all', label: 'Todos', count: total, icon: <Search className="w-4 h-4" />, color: 'purple' },
        { key: 'artists', label: 'Artistas', count: artists.length, icon: <User className="w-4 h-4" />, color: 'purple' },
        { key: 'groups', label: 'Grupos', count: groups.length, icon: <Users className="w-4 h-4" />, color: 'pink' },
        { key: 'productions', label: 'Produções', count: productions.length, icon: <Film className="w-4 h-4" />, color: 'cyan' },
        { key: 'news', label: 'Notícias', count: news.length, icon: <Newspaper className="w-4 h-4" />, color: 'pink' },
    ]

    const showArtists = activeFilter === 'all' || activeFilter === 'artists'
    const showGroups = activeFilter === 'all' || activeFilter === 'groups'
    const showNews = activeFilter === 'all' || activeFilter === 'news'
    const showProductions = activeFilter === 'all' || activeFilter === 'productions'

    return (
        <>
            {/* Filter tabs — only shown when there are results */}
            {deferredData && total > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === tab.key
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-zinc-700 text-zinc-400'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Empty query */}
            {!query || query.trim().length < 2 ? (
                <div className="text-center py-20">
                    <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 text-lg">Digite pelo menos 2 caracteres para buscar</p>
                </div>
            ) : loading && !deferredData ? (
                <div className="space-y-8">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-40" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="aspect-square rounded-xl" />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : deferredData && total === 0 ? (
                <div className="text-center py-20">
                    <Search className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 text-lg mb-2">
                        Nenhum resultado encontrado para &quot;{query}&quot;
                    </p>
                    <p className="text-zinc-600">Tente buscar por artistas, grupos, notícias ou produções</p>
                </div>
            ) : deferredData ? (
                <div className={`space-y-12 transition-opacity duration-200 ${isStale ? 'opacity-50' : 'opacity-100'}`}>
                    {/* Summary */}
                    <div>
                        <p className="text-zinc-400">
                            <span className="text-2xl font-bold text-white">{total}</span> resultado{total > 1 ? 's' : ''} para &quot;<span className="text-purple-400">{query}</span>&quot;
                        </p>
                    </div>

                    {/* Artists */}
                    {showArtists && artists.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <User className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Artistas</h2>
                                    <p className="text-sm text-zinc-500">{artists.length} encontrado{artists.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {artists.map((artist) => (
                                    <Link key={artist.id} href={`/artists/${artist.id}`} className="group">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                                            {artist.primaryImageUrl ? (
                                                <Image
                                                    src={artist.primaryImageUrl}
                                                    alt={artist.nameRomanized}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                                            {artist.nameRomanized}
                                        </h3>
                                        {artist.roles.length > 0 && (
                                            <p className="text-xs text-zinc-500 truncate">{getRoleLabel(artist.roles[0], artist.gender)}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Groups */}
                    {showGroups && groups.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-pink-600/20 rounded-lg">
                                    <Users className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Grupos</h2>
                                    <p className="text-sm text-zinc-500">{groups.length} encontrado{groups.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {groups.map((group) => (
                                    <Link key={group.id} href={`/groups/${group.id}`} className="group">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 mb-2">
                                            {group.profileImageUrl ? (
                                                <Image
                                                    src={group.profileImageUrl}
                                                    alt={group.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-600 to-purple-600 text-white text-2xl font-bold">
                                                    {group.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors truncate">
                                            {group.name}
                                        </h3>
                                        {group.nameHangul && (
                                            <p className="text-xs text-zinc-500 truncate">{group.nameHangul}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Productions */}
                    {showProductions && productions.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-cyan-600/20 rounded-lg">
                                    <Film className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Produções</h2>
                                    <p className="text-sm text-zinc-500">{productions.length} encontrada{productions.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {productions.map((production) => (
                                    <Link key={production.id} href={`/productions/${production.id}`} className="group">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 mb-2">
                                            {production.imageUrl ? (
                                                <Image
                                                    src={production.imageUrl}
                                                    alt={production.titlePt}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800 p-4">
                                                    <p className="text-white text-center text-xs font-bold line-clamp-3">{production.titlePt}</p>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2 text-sm">
                                            {production.titlePt}
                                        </h3>
                                        <p className="text-xs text-zinc-500">
                                            {production.type}{production.year && ` • ${production.year}`}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* News */}
                    {showNews && news.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-pink-600/20 rounded-lg">
                                    <Newspaper className="w-5 h-5 text-pink-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">Notícias</h2>
                                    <p className="text-sm text-zinc-500">{news.length} encontrada{news.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {news.map((newsItem) => (
                                    <Link
                                        key={newsItem.id}
                                        href={`/news/${newsItem.id}`}
                                        className="group bg-zinc-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-pink-500/30 transition-all"
                                    >
                                        {newsItem.imageUrl && (
                                            <div className="relative aspect-video overflow-hidden bg-zinc-900">
                                                <Image
                                                    src={newsItem.imageUrl}
                                                    alt={newsItem.title}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                />
                                            </div>
                                        )}
                                        <div className="p-5">
                                            {newsItem.tags.length > 0 && (
                                                <div className="flex gap-2 mb-2">
                                                    {newsItem.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-pink-600/20 text-pink-400 text-xs font-bold rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors line-clamp-2 mb-2">
                                                {newsItem.title}
                                            </h3>
                                            <p className="text-sm text-zinc-500 line-clamp-2">{stripMarkdown(newsItem.contentMd).slice(0, 180)}</p>
                                            <p className="text-xs text-zinc-600 mt-2">
                                                {new Date(newsItem.publishedAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            ) : null}
        </>
    )
}

export default function SearchPage() {
    return (
        <div className="min-h-screen bg-black pt-24 md:pt-32 pb-20 px-4 sm:px-12 md:px-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                            <Search className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-white">Resultados da Busca</h1>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="space-y-8">
                        {[1, 2].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-8 w-40" />
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {[1, 2, 3, 4, 5, 6].map(j => <Skeleton key={j} className="aspect-square rounded-xl" />)}
                                </div>
                            </div>
                        ))}
                    </div>
                }>
                    <SearchContent />
                </Suspense>
            </div>
        </div>
    )
}
