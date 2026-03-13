'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { NewsListCard } from './NewsListCard'
import { NewsFilters, type FilterValues } from './NewsFilters'
import { AdBanner } from '@/components/ui/AdBanner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function NewsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl overflow-hidden bg-zinc-800/60">
                    <div className="aspect-video" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-zinc-700/60 rounded w-3/4" />
                        <div className="h-3 bg-zinc-700/40 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    )
}

interface Artist {
    id: string
    nameRomanized: string
}

interface Group {
    id: string
    name: string
}

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    contentMd?: string | null
    originalContent?: string | null
    sourceUrl?: string | null
    artists: Array<{
        artist: {
            id: string
            nameRomanized: string
        }
    }>
}

interface NewsListProps {
    initialArtists?: Artist[]
    initialGroups?: Group[]
}

type FeedMode = 'personalized' | 'all'

export function NewsList({ initialArtists = [], initialGroups = [] }: NewsListProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [followingCount, setFollowingCount] = useState(0)
    const [feedMode, setFeedMode] = useState<FeedMode>(
        () => (searchParams.get('feed') === 'all' ? 'all' : 'personalized')
    )
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })
    const [pageJumpInput, setPageJumpInput] = useState('')
    const [isEditingPage, setIsEditingPage] = useState(false)

    // Ref para leitura do feedMode atual sem adicionar dependência nos useCallbacks
    const feedModeRef = useRef<FeedMode>(feedMode)
    feedModeRef.current = feedMode

    // Extrair filtros da URL
    const getFiltersFromUrl = useCallback((): FilterValues => ({
        search: searchParams.get('search') || undefined,
        artistId: searchParams.get('artistId') || undefined,
        groupId: searchParams.get('groupId') || undefined,
        source: searchParams.get('source') || undefined,
        from: searchParams.get('from') || undefined,
        to: searchParams.get('to') || undefined,
    }), [searchParams])

    const getCurrentPage = () => Math.max(1, parseInt(searchParams.get('page') || '1'))
    const getPerPage = () => parseInt(searchParams.get('limit') || '50')

    // Atualizar URL com filtros e feed mode
    const updateUrl = useCallback((filters: FilterValues, page: number = 1, feed?: FeedMode, limit?: number) => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.artistId) params.set('artistId', filters.artistId)
        if (filters.groupId) params.set('groupId', filters.groupId)
        if (filters.source) params.set('source', filters.source)
        if (filters.from) params.set('from', filters.from)
        if (filters.to) params.set('to', filters.to)
        if (page > 1) params.set('page', page.toString())
        if (limit && limit !== 50) params.set('limit', limit.toString())
        // Preservar feed mode — usar valor explícito ou ler do ref (atual)
        const currentFeed = feed ?? feedModeRef.current
        if (currentFeed === 'all') params.set('feed', 'all')
        const newUrl = params.toString() ? `${pathname}?${params}` : pathname
        router.push(newUrl, { scroll: false })
    }, [pathname, router])

    // Buscar notícias da API
    const fetchNews = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = getFiltersFromUrl()
            const page = getCurrentPage()

            const params = new URLSearchParams({
                page: page.toString(),
                limit: getPerPage().toString(),
                feed: feedModeRef.current,
                ...(filters.search && { search: filters.search }),
                ...(filters.artistId && { artistId: filters.artistId }),
                ...(filters.groupId && { groupId: filters.groupId }),
                ...(filters.source && { source: filters.source }),
                ...(filters.from && { from: filters.from }),
                ...(filters.to && { to: filters.to }),
            })

            const response = await fetch(`/api/news/feed?${params}`)
            const data = await response.json()

            setNews(data.news || [])
            setFollowingCount(data.followingCount || 0)
            setPagination({
                page: data.pagination.page,
                total: data.pagination.total,
                pages: data.pagination.pages,
            })
        } catch (error) {
            console.error('Erro ao buscar notícias:', error)
        } finally {
            setIsLoading(false)
        }
    }, [getFiltersFromUrl])

    // Sincronizar feedMode com URL (ex: botão voltar do browser)
    useEffect(() => {
        const urlFeed: FeedMode = searchParams.get('feed') === 'all' ? 'all' : 'personalized'
        setFeedMode(urlFeed)
    }, [searchParams])

    // Buscar notícias quando URL mudar
    useEffect(() => { fetchNews() }, [fetchNews])

    const handleFilterChange = useCallback((filters: FilterValues) => {
        updateUrl(filters, 1)
    }, [updateUrl])

    const handlePageChange = (newPage: number) => {
        updateUrl(getFiltersFromUrl(), newPage, undefined, getPerPage())
    }
    const handlePerPage = (n: number) => {
        updateUrl(getFiltersFromUrl(), 1, undefined, n)
    }

    const handleFeedMode = (mode: FeedMode) => {
        // Atualizar ref imediatamente (antes do re-render) para a chamada de API usar o valor novo
        feedModeRef.current = mode
        setFeedMode(mode)
        updateUrl(getFiltersFromUrl(), 1, mode)
    }

    const showTabs = followingCount > 0

    return (
        <div>
            {/* Tabs: Para você / Todas — visível apenas quando usuário tem artistas seguidos */}
            {showTabs && (
                <div className="flex border-b border-white/10 mb-6">
                    <button
                        onClick={() => handleFeedMode('personalized')}
                        className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                            feedMode === 'personalized'
                                ? 'border-purple-500 text-white'
                                : 'border-transparent text-zinc-400 hover:text-white'
                        }`}
                    >
                        Para você
                    </button>
                    <button
                        onClick={() => handleFeedMode('all')}
                        className={`px-6 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                            feedMode === 'all'
                                ? 'border-purple-500 text-white'
                                : 'border-transparent text-zinc-400 hover:text-white'
                        }`}
                    >
                        Todas
                    </button>
                </div>
            )}

            {/* Filtros */}
            <NewsFilters
                onFilterChange={handleFilterChange}
                artists={initialArtists}
                groups={initialGroups}
                initialFilters={getFiltersFromUrl()}
            />

            {/* Ad: entre filtros e grid */}
            <AdBanner
                slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_NEWS_LIST ?? ''}
                format="horizontal"
                className="my-6"
            />

            {/* Loading State */}
            {isLoading && <NewsSkeleton />}

            {/* Empty State */}
            {!isLoading && news.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-zinc-400 text-lg mb-2">
                        Nenhuma notícia encontrada
                    </p>
                    {feedMode === 'personalized' && showTabs ? (
                        <p className="text-zinc-500 text-sm">
                            Nenhuma notícia dos seus artistas seguidos.{' '}
                            <button
                                onClick={() => handleFeedMode('all')}
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                Ver todas as notícias
                            </button>
                        </p>
                    ) : (
                        <p className="text-zinc-500 text-sm">
                            Tente ajustar os filtros ou fazer uma nova busca
                        </p>
                    )}
                </div>
            )}

            {/* Grid de Notícias */}
            {!isLoading && news.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {news.map((item) => {
                            const artistNames = item.artists.map(a => a.artist.nameRomanized)
                            return (
                                <NewsListCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    imageUrl={item.imageUrl}
                                    publishedAt={item.publishedAt}
                                    tags={item.tags || []}
                                    contentMd={item.contentMd || item.originalContent}
                                    artists={artistNames}
                                    sourceUrl={item.sourceUrl}
                                    adminHref={`/admin/news/${item.id}?returnTo=${encodeURIComponent(pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`}
                                />
                            )
                        })}
                    </div>

                    {/* Paginação */}
                    {pagination.pages > 0 && (
                        <div className="mt-10 flex flex-col items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs text-zinc-600">Por página:</span>
                                {[50, 100, 150].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => handlePerPage(n)}
                                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${getPerPage() === n ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <span className="text-xs text-zinc-600 ml-1">({pagination.total.toLocaleString('pt-BR')} total)</span>
                            </div>
                            {pagination.pages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="hidden md:inline">Anterior</span>
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        {isEditingPage ? (
                                            <input
                                                autoFocus
                                                type="number"
                                                min={1}
                                                max={pagination.pages}
                                                value={pageJumpInput}
                                                onChange={e => setPageJumpInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        const p = Math.min(pagination.pages, Math.max(1, parseInt(pageJumpInput) || pagination.page))
                                                        handlePageChange(p)
                                                        setIsEditingPage(false)
                                                        setPageJumpInput('')
                                                    }
                                                    if (e.key === 'Escape') { setIsEditingPage(false); setPageJumpInput('') }
                                                }}
                                                onBlur={() => { setIsEditingPage(false); setPageJumpInput('') }}
                                                className="w-12 text-center px-2 py-1 bg-zinc-800 border border-purple-500/50 rounded text-sm text-white focus:outline-none"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => { setIsEditingPage(true); setPageJumpInput(String(pagination.page)) }}
                                                className="px-2 py-1 rounded text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 transition-colors min-w-[2rem] text-center"
                                                title="Clique para ir a uma página específica"
                                            >
                                                {pagination.page}
                                            </button>
                                        )}
                                        <span className="text-sm text-zinc-500">/ {pagination.pages}</span>
                                    </div>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <span className="hidden md:inline">Próxima</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
