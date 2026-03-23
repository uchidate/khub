'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Film } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'

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
    ageRating: string | null
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'MOVIE', label: 'Filmes' },
    { value: 'SERIES', label: 'Séries' },
    { value: 'SPECIAL', label: 'Especiais' },
    { value: 'DOCUMENTARY', label: 'Documentários' },
]

const TYPE_LABEL: Record<string, string> = {
    FILME: 'Filme', Filme: 'Filme', MOVIE: 'Filme',
    SERIE: 'Série', serie: 'Série', SERIES: 'Série', 'K-Drama': 'K-Drama', SHOW: 'Show',
    SPECIAL: 'Especial', ESPECIAL: 'Especial',
    DOCUMENTARY: 'Documentário', DOCUMENTARIO: 'Documentário',
}

const AGE_RATING_OPTIONS: { value: string; label: string; color: string }[] = [
    { value: '', label: 'Classificadas', color: '' },
    { value: 'all', label: 'Todas (incl. 18+)', color: '' },
    { value: 'L', label: 'Livre', color: 'bg-green-600/80' },
    { value: '10', label: '10+', color: 'bg-blue-600/80' },
    { value: '12', label: '12+', color: 'bg-yellow-600/80' },
    { value: '14', label: '14+', color: 'bg-orange-600/80' },
    { value: '16', label: '16+', color: 'bg-red-600/80' },
    { value: '18', label: '18+', color: 'bg-red-900/80' },
]

const SORT_OPTIONS = [
    { value: 'newest', label: 'Recentes' },
    { value: 'popular', label: 'Populares' },
    { value: 'rating', label: 'Avaliação' },
    { value: 'year', label: 'Ano' },
    { value: 'name', label: 'A-Z' },
]

const AGE_BADGE_STYLE: Record<string, string> = {
    'L':  'bg-green-600 text-white',
    '10': 'bg-blue-600 text-white',
    '12': 'bg-yellow-500 text-black',
    '14': 'bg-orange-500 text-white',
    '16': 'bg-red-600 text-white',
    '18': 'bg-red-900 text-red-100',
}

function ProductionCard({ prod, priority }: { prod: Production; priority?: boolean }) {
    const subtitleParts = [prod.year?.toString(), prod.type ? (TYPE_LABEL[prod.type] ?? prod.type) : null].filter(Boolean)
    const imageUrl = prod.backdropUrl || prod.imageUrl

    return (
        <Link href={`/productions/${prod.id}`} className="group block">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface border border-border group-hover:border-accent/30 transition-colors mb-3">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={prod.titlePt}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-10 h-10 text-border" />
                    </div>
                )}
                {prod.ageRating && (
                    <div className="absolute top-2 left-2">
                        <AgeRatingBadge rating={prod.ageRating} />
                    </div>
                )}
                {(prod.streamingPlatforms as string[] || []).length > 0 && (
                    <div className="absolute bottom-2 right-2 flex gap-1 flex-wrap justify-end">
                        {(prod.streamingPlatforms as string[]).slice(0, 2).map(p => (
                            <span key={p} className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white">{p}</span>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">{prod.titlePt}</h3>
                {subtitleParts.length > 0 && (
                    <p className="text-xs text-muted mt-0.5">{subtitleParts.join(' · ')}</p>
                )}
                {prod.titleKr && (
                    <p className="text-[11px] text-muted mt-0.5 truncate">{prod.titleKr}</p>
                )}
            </div>
        </Link>
    )
}

function ProductionsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="rounded-xl bg-skeleton aspect-video mb-3" />
                    <div className="h-4 bg-skeleton rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-skeleton rounded w-1/3" />
                </div>
            ))}
        </div>
    )
}

function AgeRatingBadge({ rating }: { rating: string }) {
    return (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${AGE_BADGE_STYLE[rating] ?? 'bg-surface text-muted'}`}>
            {rating === 'L' ? 'L' : `${rating}+`}
        </span>
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
    const [typeCounts, setTypeCounts] = useState<Record<string, number> | null>(null)

    useEffect(() => {
        fetch('/api/productions/list?typeCounts=1')
            .then(r => r.json())
            .then(setTypeCounts)
            .catch(() => {})
    }, [])

    const getFilters = useCallback(() => ({
        search: searchParams.get('search') || '',
        type: searchParams.get('type') || '',
        ageRating: searchParams.get('ageRating') || '',
        sortBy: searchParams.get('sortBy') || 'popular',
    }), [searchParams])

    const getCurrentPage = () => Math.max(1, parseInt(searchParams.get('page') || '1'))
    const getPerPage = () => parseInt(searchParams.get('limit') || '50')

    const updateUrl = useCallback((filters: { search: string; type: string; ageRating: string; sortBy: string }, page = 1, limit?: number) => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.type) params.set('type', filters.type)
        if (filters.ageRating) params.set('ageRating', filters.ageRating)
        if (filters.sortBy && filters.sortBy !== 'popular') params.set('sortBy', filters.sortBy)
        if (page > 1) params.set('page', page.toString())
        if (limit && limit !== 50) params.set('limit', limit.toString())
        router.push(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
    }, [pathname, router])

    const fetchProductions = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = getFilters()
            const page = getCurrentPage()
            const params = new URLSearchParams({
                page: page.toString(),
                limit: getPerPage().toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.type && { type: filters.type }),
                ...(filters.ageRating && { ageRating: filters.ageRating }),
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
    const handleAgeRating = (value: string) => updateUrl({ ...filters, ageRating: value }, 1)
    const handleSort = (value: string) => updateUrl({ ...filters, sortBy: value }, 1)
    const handlePage = (p: number) => {
        updateUrl(filters, p, getPerPage())
    }
    const handlePerPage = (n: number) => {
        updateUrl(filters, 1, n)
    }
    const clearAll = () => {
        setSearchInput('')
        updateUrl({ search: '', type: '', ageRating: '', sortBy: 'popular' }, 1)
    }

    const hasActiveFilters = filters.search || filters.type || filters.ageRating

    return (
        <div>
            {/* Filters */}
            <div className="mb-8 space-y-3">
                {/* Search */}
                <SearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    onCommit={handleSearch}
                    placeholder="Buscar filme, série ou drama"
                />

                {/* Type + Sort */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                        {TYPE_OPTIONS.filter(opt => opt.value === '' || !typeCounts || (typeCounts[opt.value] ?? 0) > 0).map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleType(opt.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    filters.type === opt.value
                                        ? 'bg-accent text-white'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                                {opt.value && typeCounts && (
                                    <span className="ml-1 opacity-50 font-normal">
                                        {typeCounts[opt.value] ?? 0}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleSort(opt.value)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    filters.sortBy === opt.value
                                        ? 'bg-accent text-white'
                                        : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Age Rating filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider mr-1">Classificação:</span>
                    {AGE_RATING_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleAgeRating(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                filters.ageRating === opt.value
                                    ? opt.color
                                        ? `${opt.color} text-white`
                                        : 'bg-accent text-white'
                                    : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    {!filters.ageRating && (
                        <span className="text-[10px] text-muted italic ml-1">18+ e sem classificação ocultos</span>
                    )}
                </div>

                {/* Active filters summary */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-3">
                        {!isLoading && (
                            <p className="text-xs text-muted">
                                {pagination.total} {pagination.total !== 1 ? 'produções' : 'produção'} encontrada{pagination.total !== 1 ? 's' : ''}
                            </p>
                        )}
                        <button onClick={clearAll} className="text-xs text-accent hover:text-accent/70 transition-colors">
                            Limpar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {isLoading && <ProductionsSkeleton />}

            {/* Empty */}
            {!isLoading && productions.length === 0 && (
                <EmptyState
                    icon={<Film className="w-12 h-12" />}
                    title="Nenhuma produção encontrada"
                    description="Tente ajustar os filtros de busca"
                    action={{ label: 'Limpar filtros', onClick: clearAll }}
                />
            )}

            {/* Grid */}
            {!isLoading && productions.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productions.map((prod, index) => (
                            <ProductionCard key={prod.id} prod={prod} priority={index < 3} />
                        ))}
                    </div>

                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={pagination.pages}
                        perPage={getPerPage()}
                        total={pagination.total}
                        onPageChange={handlePage}
                        onPerPageChange={handlePerPage}
                    />
                </>
            )}
        </div>
    )
}
