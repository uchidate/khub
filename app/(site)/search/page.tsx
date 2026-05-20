'use client'

import { useState, useEffect, useCallback, useDeferredValue, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { getRoleLabel } from '@/lib/utils/role-labels'
import { Search, User, Film, Users, ArrowLeft, ChevronRight, Star, BookOpen, Compass, ShoppingBag } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { nameToGradient } from '@/lib/utils'


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
    slug?: string | null
    name: string
    nameHangul: string | null
    profileImageUrl: string | null
}

interface Production {
    id: string
    slug?: string | null
    titlePt: string
    titleKr: string | null
    type: string
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
}

interface Article {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    publishedAt: string
}

interface SearchShortcut {
    id: string
    title: string
    description: string
    href: string
    kind: 'section' | 'feature'
}

interface StoreProduct {
    id: string
    name: string
    description: string | null
    price: string | null
    imageUrl: string
    store: string
    category: string
    badge: string | null
}

interface SearchData {
    shortcuts: SearchShortcut[]
    artists: Artist[]
    groups: Group[]
    productions: Production[]
    articles: Article[]
    storeProducts: StoreProduct[]
}

type FilterType = 'all' | 'shortcuts' | 'artists' | 'groups' | 'productions' | 'articles' | 'storeProducts'

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
                {icon}
            </div>
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-foreground">{title}</h2>
                <span className="text-xs text-muted font-medium">{count} resultado{count !== 1 ? 's' : ''}</span>
            </div>
        </div>
    )
}

function SearchContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q') || ''
    const activeFilter = (searchParams.get('type') || 'all') as FilterType

    const [data, setData] = useState<SearchData | null>(null)
    const [loading, setLoading] = useState(false)
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
            if (res.ok) setData(await res.json())
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchResults(query) }, [query, fetchResults])

    const setFilter = (type: FilterType) => {
        const params = new URLSearchParams(searchParams.toString())
        if (type === 'all') params.delete('type')
        else params.set('type', type)
        router.replace(`/search?${params.toString()}`, { scroll: false })
    }

    const shortcuts = deferredData?.shortcuts ?? []
    const artists = deferredData?.artists ?? []
    const groups = deferredData?.groups ?? []
    const productions = deferredData?.productions ?? []
    const articles = deferredData?.articles ?? []
    const storeProducts = deferredData?.storeProducts ?? []
    const total = shortcuts.length + artists.length + groups.length + productions.length + articles.length + storeProducts.length

    const tabs: { key: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
        { key: 'all', label: 'Todos', count: total, icon: <Search size={13} /> },
        { key: 'shortcuts', label: 'Áreas', count: shortcuts.length, icon: <Compass size={13} /> },
        { key: 'artists', label: 'Artistas', count: artists.length, icon: <User size={13} /> },
        { key: 'groups', label: 'Grupos', count: groups.length, icon: <Users size={13} /> },
        { key: 'productions', label: 'Produções', count: productions.length, icon: <Film size={13} /> },
        { key: 'articles', label: 'Artigos', count: articles.length, icon: <BookOpen size={13} /> },
        { key: 'storeProducts', label: 'Loja', count: storeProducts.length, icon: <ShoppingBag size={13} /> },
    ]

    const showShortcuts = activeFilter === 'all' || activeFilter === 'shortcuts'
    const showArtists = activeFilter === 'all' || activeFilter === 'artists'
    const showGroups = activeFilter === 'all' || activeFilter === 'groups'
    const showProductions = activeFilter === 'all' || activeFilter === 'productions'
    const showArticles = activeFilter === 'all' || activeFilter === 'articles'
    const showStoreProducts = activeFilter === 'all' || activeFilter === 'storeProducts'

    return (
        <>
            {/* Filter tabs */}
            {deferredData && total > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                activeFilter === tab.key
                                    ? 'bg-foreground text-background'
                                    : 'bg-surface text-muted hover:text-foreground hover:bg-surface-hover border border-border'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-surface-hover text-muted'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {!query || query.trim().length < 2 ? (
                <div className="text-center py-24">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-muted/40" />
                    </div>
                    <p className="text-muted text-base font-medium mb-1">Buscar no HallyuHub</p>
                    <p className="text-muted/60 text-sm">Artistas, grupos, dramas, filmes, artigos, loja e agenda</p>
                </div>
            ) : loading && !deferredData ? (
                <div className="space-y-10">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="aspect-square rounded-xl" />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : deferredData && total === 0 ? (
                <div className="text-center py-24">
                    <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                        <Search className="w-7 h-7 text-muted/40" />
                    </div>
                    <p className="text-foreground font-semibold mb-1">Nenhum resultado para &quot;{query}&quot;</p>
                    <p className="text-muted text-sm">Tente um nome diferente ou busque em português / romanizado</p>
                </div>
            ) : deferredData ? (
                <div className={`space-y-10 transition-opacity duration-150 ${isStale ? 'opacity-60' : 'opacity-100'}`}>
                    {/* Resumo */}
                    <p className="text-muted text-sm">
                        <span className="text-xl font-black text-foreground mr-1">{total}</span>
                        resultado{total !== 1 ? 's' : ''} para{' '}
                        <span className="text-accent font-semibold">&quot;{query}&quot;</span>
                    </p>

                    {/* Atalhos */}
                    {showShortcuts && shortcuts.length > 0 && (
                        <section>
                            <SectionHeader icon={<Compass size={14} />} title="Áreas do site" count={shortcuts.length} />
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {shortcuts.map(shortcut => (
                                    <Link key={shortcut.id} href={shortcut.href}
                                        className="group rounded-2xl border border-border bg-surface/70 p-4 transition-colors hover:border-accent/40 hover:bg-accent-soft/30">
                                        <p className="text-sm font-black text-foreground group-hover:text-accent transition-colors">{shortcut.title}</p>
                                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{shortcut.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Artistas */}
                    {showArtists && artists.length > 0 && (
                        <section>
                            <SectionHeader icon={<User size={14} />} title="Artistas" count={artists.length} />
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                                {artists.map(artist => (
                                    <Link key={artist.id} href={`/artists/${artist.id}`}
                                        className="group block rounded-xl p-1.5 -m-1.5 hover:bg-surface-hover transition-colors">
                                        <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border/60 mb-2.5 group-hover:border-accent/30 transition-all">
                                            {artist.primaryImageUrl ? (
                                                <Image src={artist.primaryImageUrl} alt={artist.nameRomanized} fill
                                                    sizes="(max-width: 640px) 33vw, 16vw"
                                                    className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"
                                                    style={{ background: nameToGradient(artist.nameRomanized) }}>
                                                    <span className="text-xl font-black text-white/80">{artist.nameRomanized[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">{artist.nameRomanized}</p>
                                        {artist.nameHangul && <p className="text-[10px] text-muted truncate">{artist.nameHangul}</p>}
                                        {artist.roles.length > 0 && (
                                            <p className="text-[10px] text-muted/70 truncate">{getRoleLabel(artist.roles[0], artist.gender)}</p>
                                        )}
                                    </Link>
                                ))}
                            </div>
                            {artists.length > 0 && (
                                <div className="mt-4">
                                    <Link href={`/artists?search=${encodeURIComponent(query)}`}
                                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold">
                                        Ver todos os artistas <ChevronRight size={12} />
                                    </Link>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Grupos */}
                    {showGroups && groups.length > 0 && (
                        <section>
                            <SectionHeader icon={<Users size={14} />} title="Grupos" count={groups.length} />
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                                {groups.map(group => (
                                    <Link key={group.id} href={`/groups/${group.slug ?? group.id}`}
                                        className="group block rounded-xl p-1.5 -m-1.5 hover:bg-surface-hover transition-colors">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border/60 mb-2.5 group-hover:border-accent/30 transition-all">
                                            {group.profileImageUrl ? (
                                                <Image src={group.profileImageUrl} alt={group.name} fill
                                                    sizes="(max-width: 640px) 33vw, 16vw"
                                                    className="object-cover object-top group-hover:scale-[1.04] transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"
                                                    style={{ background: nameToGradient(group.name) }}>
                                                    <span className="text-xl font-black text-white/80">{group.name[0]}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors truncate">{group.name}</p>
                                        {group.nameHangul && <p className="text-[10px] text-muted truncate">{group.nameHangul}</p>}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Produções */}
                    {showProductions && productions.length > 0 && (
                        <section>
                            <SectionHeader icon={<Film size={14} />} title="Produções" count={productions.length} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                                {productions.map(prod => (
                                    <Link key={prod.id} href={`/productions/${prod.slug ?? prod.id}`}
                                        className="group block rounded-xl p-1.5 -m-1.5 hover:bg-surface-hover transition-colors">
                                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface border border-border/60 mb-2.5 group-hover:border-accent/30 transition-all">
                                            {prod.imageUrl ? (
                                                <Image src={prod.imageUrl} alt={prod.titlePt} fill
                                                    sizes="(max-width: 640px) 50vw, 20vw"
                                                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center p-3"
                                                    style={{ background: nameToGradient(prod.titlePt) }}>
                                                    <p className="text-white/80 text-center text-xs font-bold line-clamp-3">{prod.titlePt}</p>
                                                </div>
                                            )}
                                            {prod.voteAverage && (
                                                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-black/70 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    <Star size={8} fill="currentColor" />{prod.voteAverage.toFixed(1)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{prod.titlePt}</p>
                                        <p className="text-[10px] text-muted mt-0.5">{prod.type}{prod.year ? ` · ${prod.year}` : ''}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Artigos */}
                    {showArticles && articles.length > 0 && (
                        <section>
                            <SectionHeader icon={<BookOpen size={14} />} title="Artigos" count={articles.length} />
                            <div className="space-y-3">
                                {articles.map(article => (
                                    <Link key={article.id} href={`/blog/${article.slug}`}
                                        className="group flex items-start gap-4 p-3 -mx-3 rounded-xl hover:bg-surface-hover transition-colors">
                                        {article.coverImageUrl && (
                                            <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                                                <Image src={article.coverImageUrl} alt={article.title} fill
                                                    sizes="80px" className="object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{article.title}</p>
                                            {article.excerpt && (
                                                <p className="text-xs text-muted mt-1 line-clamp-1">{article.excerpt}</p>
                                            )}
                                            <p className="text-[10px] text-muted/70 mt-1">
                                                {new Date(article.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Loja */}
                    {showStoreProducts && storeProducts.length > 0 && (
                        <section>
                            <SectionHeader icon={<ShoppingBag size={14} />} title="Loja" count={storeProducts.length} />
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                {storeProducts.map(product => (
                                    <Link key={product.id} href="/loja"
                                        className="group block rounded-xl p-1.5 -m-1.5 hover:bg-surface-hover transition-colors">
                                        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-border/60 mb-2.5 group-hover:border-accent/30 transition-all">
                                            <Image src={product.imageUrl} alt={product.name} fill
                                                sizes="(max-width: 640px) 50vw, 20vw"
                                                className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                                                unoptimized />
                                            {product.badge && (
                                                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-white">
                                                    {product.badge}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{product.name}</p>
                                        <p className="text-[10px] text-muted mt-0.5">{product.price ? `${product.price} · ` : ''}{product.store}</p>
                                    </Link>
                                ))}
                            </div>
                            <div className="mt-4">
                                <Link href="/loja"
                                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-semibold">
                                    Ver vitrine completa <ChevronRight size={12} />
                                </Link>
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
        <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6 text-sm">
                        <ArrowLeft size={14} />
                        Voltar
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Search className="w-5 h-5 text-accent" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-foreground">Busca</h1>
                    </div>
                </div>

                <Suspense fallback={
                    <div className="space-y-10">
                        {[1, 2].map(i => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="h-6 w-32" />
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                    {Array.from({ length: 6 }).map((_, j) => <Skeleton key={j} className="aspect-square rounded-xl" />)}
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
