'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/ui/MediaCard'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

interface Production {
    id: string
    titlePt: string
    titleKr: string | null
    type: string | null
    year: number | null
    imageUrl: string | null
    backdropUrl: string | null
    voteAverage: number | null
    streamingPlatforms: string[] | null
}

const PRODUCTION_TYPES = ['MOVIE', 'SERIES', 'SPECIAL', 'DOCUMENTARY']
const SORT_OPTIONS = [
    { value: 'newest', label: 'Mais recentes' },
    { value: 'year', label: 'Ano' },
    { value: 'rating', label: 'Avaliação' },
    { value: 'name', label: 'Nome A-Z' },
]

function ProductionsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl bg-zinc-800/60 aspect-video" />
            ))}
        </div>
    )
}

export function ProductionsList() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [productions, setProductions] = useState<Production[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })

    const getFilters = useCallback(() => ({
        search: searchParams.get('search') || '',
        type: searchParams.get('type') || '',
        sortBy: searchParams.get('sortBy') || 'newest',
    }), [searchParams])

    const getCurrentPage = () => Math.max(1, parseInt(searchParams.get('page') || '1'))

    const updateUrl = useCallback((filters: { search: string; type: string; sortBy: string }, page = 1) => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.type) params.set('type', filters.type)
        if (filters.sortBy && filters.sortBy !== 'newest') params.set('sortBy', filters.sortBy)
        if (page > 1) params.set('page', page.toString())
        router.push(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
    }, [pathname, router])

    const fetchProductions = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = getFilters()
            const page = getCurrentPage()
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '18',
                ...(filters.search && { search: filters.search }),
                ...(filters.type && { type: filters.type }),
                ...(filters.sortBy && { sortBy: filters.sortBy }),
            })
            const res = await fetch(`/api/productions/list?${params}`)
            const data = await res.json()
            setProductions(data.productions || [])
            setPagination(data.pagination)
        } catch (e) {
            console.error('Erro ao buscar produções:', e)
        } finally {
            setIsLoading(false)
        }
    }, [getFilters])

    useEffect(() => { fetchProductions() }, [fetchProductions])

    const filters = getFilters()
    const currentPage = getCurrentPage()

    const handleSearch = (value: string) => updateUrl({ ...filters, search: value }, 1)
    const handleType = (value: string) => updateUrl({ ...filters, type: value }, 1)
    const handleSort = (value: string) => updateUrl({ ...filters, sortBy: value }, 1)
    const handlePage = (p: number) => {
        updateUrl(filters, p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                {/* Search */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        defaultValue={filters.search}
                        placeholder="Buscar"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value) }}
                        onBlur={(e) => handleSearch(e.target.value)}
                        className="w-full px-4 pr-10 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                    {filters.search ? (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    )}
                </div>

                {/* Type filter */}
                <select
                    value={filters.type}
                    onChange={(e) => handleType(e.target.value)}
                    className="px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
                >
                    <option value="">Todos os tipos</option>
                    {PRODUCTION_TYPES.map(t => (
                        <option key={t} value={t}>{t === 'MOVIE' ? 'Filmes' : t === 'SERIES' ? 'Séries' : t === 'SPECIAL' ? 'Especiais' : 'Documentários'}</option>
                    ))}
                </select>

                {/* Sort */}
                <select
                    value={filters.sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="px-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
                >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>

            {/* Loading */}
            {isLoading && <ProductionsSkeleton />}

            {/* Empty */}
            {!isLoading && productions.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-zinc-400 text-lg mb-2">Nenhuma produção encontrada</p>
                    <p className="text-zinc-500 text-sm">Tente ajustar os filtros</p>
                </div>
            )}

            {/* Grid */}
            {!isLoading && productions.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 perspective-1000">
                        {productions.map((prod) => (
                            <MediaCard
                                key={prod.id}
                                id={prod.id}
                                title={prod.titlePt}
                                subtitle={`${prod.year ?? ''} • ${prod.type ?? ''}`}
                                imageUrl={prod.backdropUrl || prod.imageUrl}
                                type="production"
                                href={`/productions/${prod.id}`}
                                badges={prod.streamingPlatforms as string[] || []}
                                aspectRatio="video"
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <button
                                onClick={() => handlePage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-400">Página {currentPage} de {pagination.pages}</span>
                                <span className="text-xs text-zinc-600">({pagination.total} produções)</span>
                            </div>
                            <button
                                onClick={() => handlePage(currentPage + 1)}
                                disabled={currentPage === pagination.pages}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Próxima
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
