'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Film, SlidersHorizontal, Star, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { nameToGradient } from '@/lib/utils'

interface Production {
    id: string
    slug?: string | null
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

const AGE_RATING_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Classificadas' },
    { value: 'all', label: 'Todas (incl. 18+)' },
    { value: 'L', label: 'Livre' },
    { value: '10', label: '10+' },
    { value: '12', label: '12+' },
    { value: '14', label: '14+' },
    { value: '16', label: '16+' },
    { value: '18', label: '18+' },
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
    const [imageFailed, setImageFailed] = useState(false)
    const imageUrl = !imageFailed ? (prod.imageUrl || prod.backdropUrl) : null
    const score = prod.voteAverage ? Math.round(prod.voteAverage * 10) / 10 : null
    const platforms = (prod.streamingPlatforms as string[] || []).slice(0, 2)

    return (
        <Link href={`/productions/${prod.slug ?? prod.id}`} className="group grid grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-background p-2.5 shadow-sm transition-all hover:border-violet/35 hover:bg-surface-media/35 hover:shadow-md sm:block sm:border-0 sm:bg-transparent sm:p-2 sm:-m-2 sm:shadow-none sm:hover:bg-transparent">
            {/* Poster 2:3 */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-surface border border-border/80 shadow-sm group-hover:border-violet/40 group-hover:shadow-md transition-all sm:mb-3">
                {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageUrl}
                        alt={prod.titlePt}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding={priority ? 'sync' : 'async'}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={() => setImageFailed(true)}
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
            </div>
            <div className="min-w-0 self-center space-y-1 sm:self-auto">
                <h3 className="text-[0.95rem] font-bold text-foreground group-hover:text-violet transition-colors line-clamp-2 leading-snug sm:text-[0.92rem]">{prod.titlePt}</h3>
                <div className="flex items-center gap-2 text-xs text-muted min-h-[1rem]">
                    {prod.year && <span>{prod.year}</span>}
                    {typeLabel && <span>• {typeLabel}</span>}
                    {score !== null && <span className="text-amber-500 font-semibold">{score.toFixed(1)}</span>}
                </div>
                {prod.titleKr && (
                    <p className="text-[11px] text-muted mt-0.5 truncate">{prod.titleKr}</p>
                )}
                {platforms.length > 0 && (
                    <div className="pt-1 flex gap-1.5 flex-wrap">
                        {platforms.map(p => (
                            <span key={p} className="px-2 py-0.5 text-[10px] font-semibold bg-surface border border-border rounded-full text-muted">
                                {p}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    )
}

function ProductionsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="rounded-xl bg-skeleton aspect-[2/3] mb-3" />
                    <div className="h-3.5 bg-skeleton rounded w-4/5 mb-1.5" />
                    <div className="h-3 bg-skeleton rounded w-2/5" />
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

export function ProductionsList({ hideFilter = false }: { hideFilter?: boolean }) {
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
            {!hideFilter && <div className="sticky top-[calc(var(--site-sticky-top)+0.75rem)] z-20 mb-6 rounded-2xl border border-violet/20 bg-white p-3 shadow-[0_12px_30px_rgba(18,15,21,0.10)] dark:bg-background sm:p-4">
                <div className="flex items-center gap-2">
                    <SearchInput
                        value={searchInput}
                        onChange={setSearchInput}
                        onCommit={handleSearch}
                        placeholder="Buscar por drama, filme ou título em coreano..."
                        className="flex-1"
                    />
                    {(hasActiveFilters || filters.sortBy !== 'popular') && (
                        <button onClick={clearAll} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-violet/40 hover:text-foreground" title="Limpar filtros" aria-label="Limpar filtros">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div id="productions-advanced-filters" className="mt-3 space-y-3">
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
                    <div className="flex items-start gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-violet/20 bg-surface-media px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet">
                            <SlidersHorizontal className="h-3 w-3" />
                            Filtros
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            {TYPE_OPTIONS.filter(opt => opt.value === '' || !typeCounts || (typeCounts[opt.value] ?? 0) > 0).map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleType(opt.value)}
                                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                        filters.type === opt.value
                                            ? 'bg-foreground text-background'
                                            : 'bg-surface text-muted hover:bg-surface-media hover:text-foreground'
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
                        <div className="h-7 w-px shrink-0 bg-border" />
                        <div className="flex shrink-0 items-center gap-1">
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSort(opt.value)}
                                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                        filters.sortBy === opt.value
                                            ? 'bg-violet text-white'
                                            : 'bg-surface text-muted hover:bg-surface-media hover:text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="h-7 w-px shrink-0 bg-border" />
                        <div className="flex shrink-0 items-center gap-1">
                        {AGE_RATING_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleAgeRating(opt.value)}
                                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                    filters.ageRating === opt.value
                                        ? 'bg-violet text-white'
                                        : 'bg-surface text-muted hover:bg-surface-media hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        {!filters.ageRating && (
                            <span className="shrink-0 self-center text-[10px] text-muted italic ml-1">18+ ocultos</span>
                        )}
                        </div>
                    </div>
                </div>

            </div>}

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
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet">Catálogo</p>
                            <h2 className="text-xl font-black tracking-[-0.03em] text-foreground sm:text-2xl">Dramas & filmes</h2>
                        </div>
                        <p className="text-xs text-muted">
                            {pagination.total > 0 ? `${pagination.total.toLocaleString('pt-BR')} resultados` : 'Refine sua busca'}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {productions.map((prod, index) => (
                            <ProductionCard key={prod.id} prod={prod} priority={index < 5} />
                        ))}
                    </div>

                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={pagination.pages}
                        perPage={getPerPage()}
                        perPageOptions={[24, 36, 50]}
                        total={pagination.total}
                        onPageChange={handlePage}
                        onPerPageChange={handlePerPage}
                    />
                </>
            )}
        </div>
    )
}
