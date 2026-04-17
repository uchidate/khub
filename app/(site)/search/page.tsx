'use client'

import { useState, useEffect, useCallback, useDeferredValue, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { Search, User, Film, Users, ArrowLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'


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
    productions: Production[]
}

type FilterType = 'all' | 'artists' | 'groups' | 'productions'

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
    const productions = deferredData?.productions ?? []
    const total = artists.length + groups.length + productions.length

    const tabs: { key: FilterType; label: string; count: number; icon: React.ReactNode; color: string }[] = [
        { key: 'all', label: 'Todos', count: total, icon: <Search className="w-4 h-4" />, color: 'purple' },
        { key: 'artists', label: 'Artistas', count: artists.length, icon: <User className="w-4 h-4" />, color: 'purple' },
        { key: 'groups', label: 'Grupos', count: groups.length, icon: <Users className="w-4 h-4" />, color: 'pink' },
        { key: 'productions', label: 'Produções', count: productions.length, icon: <Film className="w-4 h-4" />, color: 'cyan' },
    ]

    const showArtists = activeFilter === 'all' || activeFilter === 'artists'
    const showGroups = activeFilter === 'all' || activeFilter === 'groups'
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
                                    ? 'bg-[#ff2d78] text-white'
                                    : 'bg-surface text-muted hover:text-foreground hover:bg-[#e8e8e8] border border-border'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-surface text-muted'
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
                    <Search className="w-16 h-16 text-[#e8e8e8] mx-auto mb-4" />
                    <p className="text-[#999] text-lg">Digite pelo menos 2 caracteres para buscar</p>
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
                    <Search className="w-16 h-16 text-[#e8e8e8] mx-auto mb-4" />
                    <p className="text-[#999] text-lg mb-2">
                        Nenhum resultado encontrado para &quot;{query}&quot;
                    </p>
                    <p className="text-muted">Tente buscar por artistas, grupos, notícias ou produções</p>
                </div>
            ) : deferredData ? (
                <div className={`space-y-12 transition-opacity duration-200 ${isStale ? 'opacity-50' : 'opacity-100'}`}>
                    {/* Summary */}
                    <div>
                        <p className="text-[#999]">
                            <span className="text-2xl font-bold text-foreground">{total}</span> resultado{total > 1 ? 's' : ''} para &quot;<span className="text-[#ff2d78]">{query}</span>&quot;
                        </p>
                    </div>

                    {/* Artists */}
                    {showArtists && artists.length > 0 && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-[#fff0f5] rounded-lg">
                                    <User className="w-5 h-5 text-[#ff2d78]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">Artistas</h2>
                                    <p className="text-sm text-muted">{artists.length} encontrado{artists.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {artists.map((artist) => (
                                    <Link key={artist.id} href={`/artists/${artist.id}`} className="group">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface mb-2">
                                            {artist.primaryImageUrl ? (
                                                <Image
                                                    src={artist.primaryImageUrl}
                                                    alt={artist.nameRomanized}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff2d78] to-pink-600 text-white text-2xl font-bold">
                                                    {artist.nameRomanized[0]}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                                            {artist.nameRomanized}
                                        </h3>
                                        {artist.roles.length > 0 && (
                                            <p className="text-xs text-muted truncate">{getRoleLabel(artist.roles[0], artist.gender)}</p>
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
                                <div className="p-2 bg-[#fff0f5] rounded-lg">
                                    <Users className="w-5 h-5 text-[#ff2d78]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">Grupos</h2>
                                    <p className="text-sm text-muted">{groups.length} encontrado{groups.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {groups.map((group) => (
                                    <Link key={group.id} href={`/groups/${group.id}`} className="group">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface mb-2">
                                            {group.profileImageUrl ? (
                                                <Image
                                                    src={group.profileImageUrl}
                                                    alt={group.name}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-600 to-[#ff6fa3] text-white text-2xl font-bold">
                                                    {group.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-[#ff2d78] transition-colors truncate">
                                            {group.name}
                                        </h3>
                                        {group.nameHangul && (
                                            <p className="text-xs text-muted truncate">{group.nameHangul}</p>
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
                                <div className="p-2 bg-[#e0f2fe] rounded-lg">
                                    <Film className="w-5 h-5 text-[#0ea5e9]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">Produções</h2>
                                    <p className="text-sm text-muted">{productions.length} encontrada{productions.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {productions.map((production) => (
                                    <Link key={production.id} href={`/productions/${production.id}`} className="group">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface mb-2">
                                            {production.imageUrl ? (
                                                <Image
                                                    src={production.imageUrl}
                                                    alt={production.titlePt}
                                                    fill
                                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-surface p-4">
                                                    <p className="text-muted text-center text-xs font-bold line-clamp-3">{production.titlePt}</p>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="font-semibold text-foreground group-hover:text-[#0ea5e9] transition-colors line-clamp-2 text-sm">
                                            {production.titlePt}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            {production.type}{production.year && ` • ${production.year}`}
                                        </p>
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
        <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-12 md:px-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#ff2d78] to-pink-600 rounded-xl">
                            <Search className="w-6 h-6 text-foreground" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-foreground">Resultados da Busca</h1>
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
