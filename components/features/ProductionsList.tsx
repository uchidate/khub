'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/ui/MediaCard'
import { ChevronLeft, ChevronRight, Search, X, Film } from 'lucide-react'

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

const TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Todos' },
    { value: 'MOVIE', label: 'Filmes' },
    { value: 'SERIES', label: 'Séries' },
    { value: 'SPECIAL', label: 'Especiais' },
    { value: 'DOCUMENTARY', label: 'Documentários' },
]

const SORT_OPTIONS = [
    { value: 'newest', label: 'Recentes' },
    { value: 'rating', label: 'Avaliação' },
    { value: 'year', label: 'Ano' },
    { value: 'name', label: 'A-Z' },
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
    const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '')

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

    const handleSearch = (value: string) => {
        setSearchInput(value)
        updateUrl({ ...filters, search: value }, 1)
    }
    const handleType = (value: string) => updateUrl({ ...filters, type: value }, 1)
    const handleSort = (value: string) => updateUrl({ ...filters, sortBy: value }, 1)
    const handlePage = (p: number) => {
        updateUrl(filters, p)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const hasActiveFilters = filters.search || filters.type

    return (
        <div>
            {/* Filters */}
            <div className="mb-8 space-y-3">
                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchInput) }}
                        onBlur={() => handleSearch(searchInput)}
                        placeholder="Buscar filme, série ou drama..."
                        className="w-full px-4 pr-10 py-3.5 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                    />
                    {searchInput ? (
                        <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    )}
                </div>

                {/* Type + Sort row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Type filter */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl overflow-x-auto">
                        {TYPE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleType(opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${
                                    filters.type === opt.value
                                        ? 'bg-purple-600 text-white'
                                        : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl ml-auto">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleSort(opt.value)}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    filters.sortBy === opt.value
                                        ? 'bg-purple-600 text-white'
                                        : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active filters summary */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-3">
                        {!isLoading && (
                            <p className="text-xs text-zinc-500">
                                {pagination.total} produção{pagination.total !== 1 ? 'ões' : ''} encontrada{pagination.total !== 1 ? 's' : ''}
                            </p>
                        )}
                        <button
                            onClick={() => { handleSearch(''); handleType('') }}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading && <ProductionsSkeleton />}

            {/* Empty */}
            {!isLoading && productions.length === 0 && (
                <div className="text-center py-20">
                    <Film className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-400 font-bold text-lg mb-2">Nenhuma produção encontrada</p>
                    <p className="text-zinc-500 text-sm mb-4">Tente ajustar os filtros de busca</p>
                    <button
                        onClick={() => { handleSearch(''); handleType('') }}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        Limpar filtros
                    </button>
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
