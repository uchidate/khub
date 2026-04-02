'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Film, Star } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { nameToGradient } from '@/lib/utils/name-to-gradient'

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
    const typeLabel = prod.type ? (TYPE_LABEL[prod.type] ?? prod.type) : null
    const imageUrl = prod.imageUrl || prod.backdropUrl
    const score = prod.voteAverage ? Math.round(prod.voteAverage * 10) / 10 : null

    return (
        <Link href={`/productions/${prod.id}`} className="group block">
            {/* Poster 2:3 */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface border border-border group-hover:border-accent/30 transition-colors mb-3">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={prod.titlePt}
                        fill
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-400"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{ background: nameToGradient(prod.titlePt) }}>
                        <Film className="w-8 h-8 text-white/40" />
                        <span className="text-white/60 text-[10px] font-bold px-3 text-center line-clamp-2">{prod.titlePt}</span>
                    </div>
                )}
                {/* Gradient overlay bottom */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* Age rating top-left */}
                {prod.ageRating && (
                    <div className="absolute top-2 left-2">
                        <AgeRatingBadge rating={prod.ageRating} />
                    </div>
                )}
                {/* Score top-right */}
                {score !== null && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[10px] font-black text-yellow-400">
                        <Star className="w-2.5 h-2.5 fill-yellow-400" />
                        {score.toFixed(1)}
                    </div>
                )}
                {/* Type badge bottom-left */}
                {typeLabel && (
                    <div className="absolute bottom-2 left-2">
                        <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold text-white/80">
                            {typeLabel}
                        </span>
                    </div>
                )}
                {/* Streaming platforms bottom-right */}
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
                {prod.year && (
                    <p className="text-xs text-muted mt-0.5">{prod.year}</p>
                )}
                {prod.titleKr && (
                    <p className="text-[11px] text-muted mt-0.5 truncate">{prod.titleKr}</p>
                )}
            </div>
        </Link>
    )
}

function FeaturedProductionCard({ prod }: { prod: Production }) {
    const typeLabel = prod.type ? (TYPE_LABEL[prod.type] ?? prod.type) : null
    const imageUrl = prod.imageUrl || prod.backdropUrl
    const score = prod.voteAverage ? Math.round(prod.voteAverage * 10) / 10 : null

    return (
        <Link href={`/productions/${prod.id}`}
            className="group sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-border bg-surface hover:border-accent/30 hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-video sm:aspect-auto sm:w-2/5 sm:min-h-[280px] overflow-hidden bg-surface shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={prod.titlePt}
                        fill
                        sizes="(max-width: 640px) 100vw, 40vw"
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        priority
                    />
                ) : (
                    <div className="w-full h-full" style={{ background: nameToGradient(prod.titlePt) }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />
                {prod.ageRating && (
                    <div className="absolute top-3 left-3"><AgeRatingBadge rating={prod.ageRating} /></div>
                )}
                {score !== null && (
                    <div className="absolute top-3 right-3 flex items-center gap-0.5 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-[11px] font-black text-yellow-400">
                        <Star className="w-3 h-3 fill-yellow-400" />
                        {score.toFixed(1)}
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-3 p-5 sm:p-8 flex-1">
                {(typeLabel || prod.year) && (
                    <p className="text-[11px] text-muted font-semibold flex items-center gap-2">
                        {typeLabel && <span className="px-2 py-0.5 bg-accent/10 text-accent rounded font-bold">{typeLabel}</span>}
                        {prod.year && <span>{prod.year}</span>}
                    </p>
                )}
                <h2 className="font-black text-foreground text-xl sm:text-2xl leading-tight line-clamp-2 group-hover:text-accent transition-colors">
                    {prod.titlePt}
                </h2>
                {prod.titleKr && (
                    <p className="text-sm text-muted">{prod.titleKr}</p>
                )}
                {(prod.streamingPlatforms as string[] || []).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                        {(prod.streamingPlatforms as string[]).slice(0, 4).map(p => (
                            <span key={p} className="px-2 py-0.5 text-[11px] font-semibold bg-surface border border-border rounded-full text-muted">{p}</span>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border text-[11px] text-muted">
                    {score !== null && (
                        <span className="flex items-center gap-1 text-yellow-500 font-black"><Star className="w-3 h-3 fill-yellow-500" />{score.toFixed(1)}</span>
                    )}
                    <span className="text-accent font-semibold ml-auto flex items-center gap-1">Ver detalhes →</span>
                </div>
            </div>
        </Link>
    )
}

function ProductionsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="rounded-xl bg-skeleton aspect-[2/3] mb-3" />
                    <div className="h-3.5 bg-skeleton rounded w-3/4 mb-1.5" />
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

    const removeSingleFilter = (key: 'search' | 'type' | 'ageRating' | 'sortBy') => {
        const next = { ...filters, [key]: key === 'sortBy' ? 'popular' : '' }
        if (key === 'search') setSearchInput('')
        updateUrl(next, 1)
    }

    const activeChips: Array<{ key: 'search' | 'type' | 'ageRating' | 'sortBy'; label: string }> = [
        ...(filters.search ? [{ key: 'search' as const, label: `Busca: ${filters.search}` }] : []),
        ...(filters.type ? [{ key: 'type' as const, label: `Tipo: ${TYPE_OPTIONS.find(t => t.value === filters.type)?.label ?? filters.type}` }] : []),
        ...(filters.ageRating ? [{ key: 'ageRating' as const, label: `Classificacao: ${AGE_RATING_OPTIONS.find(a => a.value === filters.ageRating)?.label ?? filters.ageRating}` }] : []),
        ...(filters.sortBy !== 'popular' ? [{ key: 'sortBy' as const, label: `Ordem: ${SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label ?? filters.sortBy}` }] : []),
    ]

    const hasActiveFilters = filters.search || filters.type || filters.ageRating

    return (
        <div id="productions-list">
            {/* Filters */}
            <div className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-20 bg-background py-3 px-3 sm:px-4 mb-8 space-y-3 rounded-2xl border border-border shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                {/* Search */}
                <SearchInput
                    value={searchInput}
                    onChange={setSearchInput}
                    onCommit={handleSearch}
                    placeholder="Buscar filme, série ou drama"
                />

                <div className="flex items-center justify-end gap-2 flex-wrap">
                    {(hasActiveFilters || filters.sortBy !== 'popular') && (
                        <button onClick={clearAll} className="text-xs text-accent hover:text-accent/70 transition-colors">
                            Limpar filtros
                        </button>
                    )}
                </div>

                {activeChips.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {activeChips.map(chip => (
                            <button
                                key={chip.key}
                                onClick={() => removeSingleFilter(chip.key)}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface border border-border text-foreground hover:border-accent/40 hover:text-accent transition-colors"
                            >
                                {chip.label} ×
                            </button>
                        ))}
                    </div>
                )}

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {productions.length > 0 && <FeaturedProductionCard prod={productions[0]} />}
                        {productions.slice(1).map((prod, index) => (
                            <ProductionCard key={prod.id} prod={prod} priority={index < 5} />
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
