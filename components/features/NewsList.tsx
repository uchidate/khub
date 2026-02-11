'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/ui/MediaCard'
import { NewsFilters, type FilterValues } from './NewsFilters'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface Artist {
    id: string
    nameRomanized: string
}

interface NewsItem {
    id: string
    title: string
    imageUrl: string | null
    publishedAt: string
    tags: string[]
    artists: Array<{
        artist: {
            id: string
            nameRomanized: string
        }
    }>
}

interface NewsListProps {
    initialArtists?: Artist[]
}

export function NewsList({ initialArtists = [] }: NewsListProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [news, setNews] = useState<NewsItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPersonalized, setIsPersonalized] = useState(false)
    const [followingCount, setFollowingCount] = useState(0)
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 0,
    })

    // Extrair filtros da URL
    const getFiltersFromUrl = useCallback((): FilterValues => {
        return {
            search: searchParams.get('search') || undefined,
            artistId: searchParams.get('artistId') || undefined,
            source: searchParams.get('source') || undefined,
            from: searchParams.get('from') || undefined,
            to: searchParams.get('to') || undefined,
        }
    }, [searchParams])

    const getCurrentPage = () => {
        return Math.max(1, parseInt(searchParams.get('page') || '1'))
    }

    // Atualizar URL com filtros
    const updateUrl = useCallback((filters: FilterValues, page: number = 1) => {
        const params = new URLSearchParams()

        if (filters.search) params.set('search', filters.search)
        if (filters.artistId) params.set('artistId', filters.artistId)
        if (filters.source) params.set('source', filters.source)
        if (filters.from) params.set('from', filters.from)
        if (filters.to) params.set('to', filters.to)
        if (page > 1) params.set('page', page.toString())

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
                limit: '20',
                ...(filters.search && { search: filters.search }),
                ...(filters.artistId && { artistId: filters.artistId }),
                ...(filters.source && { source: filters.source }),
                ...(filters.from && { from: filters.from }),
                ...(filters.to && { to: filters.to }),
            })

            const response = await fetch(`/api/news/feed?${params}`)
            const data = await response.json()

            setNews(data.news || [])
            setIsPersonalized(data.isPersonalized || false)
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

    // Buscar notícias quando URL mudar
    useEffect(() => {
        fetchNews()
    }, [fetchNews])

    // Handler de mudança de filtros
    const handleFilterChange = (filters: FilterValues) => {
        updateUrl(filters, 1) // Sempre volta para página 1 quando muda filtros
    }

    // Handler de mudança de página
    const handlePageChange = (newPage: number) => {
        const filters = getFiltersFromUrl()
        updateUrl(filters, newPage)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div>
            {/* Filtros */}
            <NewsFilters
                onFilterChange={handleFilterChange}
                artists={initialArtists}
                initialFilters={getFiltersFromUrl()}
            />

            {/* Banner de Feed Personalizado */}
            {isPersonalized && (
                <div className="mb-8 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-3">
                    <span className="text-purple-400 text-sm font-bold uppercase tracking-wider">
                        Feed personalizado
                    </span>
                    <span className="text-zinc-400 text-sm">
                        Notícias dos {followingCount} artista{followingCount > 1 ? 's' : ''} que você segue
                    </span>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && news.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-zinc-400 text-lg mb-2">
                        Nenhuma notícia encontrada
                    </p>
                    <p className="text-zinc-500 text-sm">
                        Tente ajustar os filtros ou fazer uma nova busca
                    </p>
                </div>
            )}

            {/* Grid de Notícias */}
            {!isLoading && news.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective-1000">
                        {news.map((item) => {
                            const artistNames = item.artists.map(a => a.artist.nameRomanized)
                            return (
                                <MediaCard
                                    key={item.id}
                                    id={item.id}
                                    title={item.title}
                                    subtitle={new Date(item.publishedAt).toLocaleDateString('pt-BR')}
                                    imageUrl={item.imageUrl}
                                    type="news"
                                    href={`/news/${item.id}`}
                                    badges={item.tags?.slice(0, 3) || []}
                                    artists={artistNames}
                                    aspectRatio="video"
                                />
                            )
                        })}
                    </div>

                    {/* Paginação */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-zinc-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Anterior</span>
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-400">
                                    Página {pagination.page} de {pagination.pages}
                                </span>
                                <span className="text-xs text-zinc-600">
                                    ({pagination.total} notícias)
                                </span>
                            </div>

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-zinc-300"
                            >
                                <span>Próxima</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
