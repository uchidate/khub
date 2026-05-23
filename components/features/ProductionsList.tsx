'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Film, Search, X } from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
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

interface FeaturedProduction {
    id: string
    slug?: string | null
    titlePt: string
    titleKr: string | null
    type: string | null
    year: number | null
    imageUrl: string | null
    voteAverage: number | null
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

    return (
        <Link href={`/productions/${prod.slug ?? prod.id}`} className="group flex flex-col">
            <div className="relative aspect-[2/3] overflow-hidden bg-surface">
                {imageUrl ? (
                     
                    <img
                        src={imageUrl}
                        alt={prod.titlePt}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding={priority ? 'sync' : 'async'}
                        className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(prod.titlePt) }}>
                        <span className="font-black text-white/15 text-[56px] leading-none select-none">
                            {prod.titlePt[0]}
                        </span>
                    </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {prod.ageRating && <AgeRatingBadge rating={prod.ageRating} />}
                    {prod.year && <span className="bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">{prod.year}</span>}
                </div>
                {score !== null && (
                    <div className="absolute bottom-2 right-2 bg-black/65 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                        ★ {score.toFixed(1)}
                    </div>
                )}
            </div>
            <div className="pt-2.5 pb-3.5 border-b border-border/50 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">{prod.titlePt}</span>
                    {prod.titleKr && <span className="font-mono text-[10px] text-muted shrink-0">{prod.titleKr}</span>}
                </div>
                <div className="font-mono text-[10px] text-muted mt-1 uppercase tracking-[0.04em] truncate">
                    {typeLabel}{prod.year ? ` · ${prod.year}` : ''}
                </div>
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

export function ProductionsList({ hideFilter = false, featuredProductions = [] }: { hideFilter?: boolean; featuredProductions?: FeaturedProduction[] }) {
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
            const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
            const perPage = parseInt(searchParams.get('limit') || '50')
            const params = new URLSearchParams({
                page: page.toString(),
                limit: perPage.toString(),
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
    }, [getFilters, searchParams])

    useEffect(() => { fetchProductions() }, [fetchProductions])

    const filters = getFilters()
    const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1'))

    const handleSearch = (value: string) => {
        setSearchInput(value)
        updateUrl({ ...filters, search: value }, 1)
    }
    const handleType = (value: string) => updateUrl({ ...filters, type: value }, 1)
    const handleAgeRating = (value: string) => updateUrl({ ...filters, ageRating: value }, 1)
    const handleSort = (value: string) => updateUrl({ ...filters, sortBy: value }, 1)
    const handlePage = (p: number) => {
        updateUrl(filters, p, parseInt(searchParams.get('limit') || '50'))
    }
    const handlePerPage = (n: number) => {
        updateUrl(filters, 1, n)
    }
    const clearAll = () => {
        setSearchInput('')
        updateUrl({ search: '', type: '', ageRating: '', sortBy: 'popular' }, 1)
    }

    const hasActiveFilters = filters.search || filters.type || filters.ageRating
    const chipClass = (active: boolean) =>
        `h-8 shrink-0 rounded-md px-3 text-[12px] font-bold transition-colors ${
            active ? 'bg-foreground text-background' : 'text-muted hover:bg-surface hover:text-foreground'
        }`
    const selectClass = 'h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground'

    const renderFilterControls = () => (
        <>
            <div className="flex shrink-0 items-center gap-1 rounded-md bg-surface p-1">
                {TYPE_OPTIONS.filter(opt => opt.value === '' || !typeCounts || (typeCounts[opt.value] ?? 0) > 0).slice(0, 3).map(opt => (
                    <button
                        key={opt.value || 'all'}
                        type="button"
                        onClick={() => handleType(opt.value)}
                        className={chipClass(filters.type === opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Tipo</span>
                <select value={filters.type} onChange={e => handleType(e.target.value)} className={selectClass} aria-label="Filtrar por tipo">
                    {TYPE_OPTIONS.filter(opt => opt.value === '' || !typeCounts || (typeCounts[opt.value] ?? 0) > 0).map(opt => (
                        <option key={opt.value || 'all'} value={opt.value}>
                            {opt.label}{opt.value && typeCounts ? ` ${typeCounts[opt.value] ?? 0}` : ''}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Ordenar</span>
                <select value={filters.sortBy} onChange={e => handleSort(e.target.value)} className={selectClass} aria-label="Ordenar produções">
                    {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Idade</span>
                <select value={filters.ageRating} onChange={e => handleAgeRating(e.target.value)} className={selectClass} aria-label="Filtrar por classificação indicativa">
                    {AGE_RATING_OPTIONS.map(opt => <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>)}
                </select>
            </label>
        </>
    )

    return (
        <div id="productions-list">
            {/* Filters */}
            {!hideFilter && (
                <nav aria-label="Filtros" className="sticky z-[200] page-wrap flex h-12 items-center border-b border-border/50 bg-background" style={{ top: 'var(--site-header-h, 92px)' }}>
                    <div className="relative w-full">
                    <div className="sm:hidden pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-gradient-to-r from-transparent to-background" />
                    <div className="flex w-full items-center gap-2 overflow-x-auto pr-10 sm:pr-0" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex shrink-0 items-center gap-2">
                            {renderFilterControls()}
                        </div>

                        <div className="flex h-8 w-[220px] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground sm:w-[360px]">
                            <Search className="h-4 w-4 shrink-0 text-muted" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch(searchInput)}
                                placeholder="Buscar drama, filme ou título..."
                                className="min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !p-0 text-[13px] text-foreground !shadow-none placeholder:text-muted focus:outline-none"
                            />
                        </div>
                        {(hasActiveFilters || filters.sortBy !== 'popular') && (
                            <button onClick={clearAll} className="flex h-8 shrink-0 items-center justify-center rounded-md bg-surface px-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground" aria-label="Limpar filtros">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    </div>
                </nav>
            )}

            {!hideFilter && (
                <div className="page-wrap border-b border-border/50 py-1.5">
                    <Breadcrumbs items={[{ label: 'Produções' }]} />
                </div>
            )}

            {!hideFilter && featuredProductions.length > 0 && (
                <section className="page-wrap pt-3 pb-6">
                    <div className="flex items-baseline justify-between mb-3">
                        <h2 className="text-[22px] font-black tracking-[-0.03em] text-foreground">
                            Capa do mês <span className="font-normal text-muted text-base ml-2">이달의 작품</span>
                        </h2>
                        <span className="font-mono text-[11px] text-muted">curado pela redação</span>
                    </div>

                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-3">
                        {/* Destaque principal — hero full-width */}
                        {featuredProductions[0] && (() => { const p = featuredProductions[0]; return (
                            <Link href={`/productions/${p.slug ?? p.id}`} className="group block relative overflow-hidden bg-surface aspect-[4/5]">
                                {p.imageUrl ? (
                                    <img src={p.imageUrl} alt={p.titlePt} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-surface flex items-center justify-center">
                                        <span className="font-black text-foreground/10 text-[80px] leading-none">{p.titlePt[0]}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                <div className="absolute top-3 left-3 flex items-center gap-2">
                                    <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-white">● #1 em alta</span>
                                    {p.voteAverage && (
                                        <span className="bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">★ {p.voteAverage.toFixed(1)}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-5">
                                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-accent/90">{p.type ? (TYPE_LABEL[p.type] ?? p.type) : ''}{p.year ? ` · ${p.year}` : ''}</span>
                                    <h3 className="text-[32px] font-black tracking-[-0.04em] leading-[1.0] mt-1 text-white group-hover:text-accent transition-colors">{p.titlePt}</h3>
                                    {p.titleKr && <p className="text-[13px] text-white/55 mt-1">{p.titleKr}</p>}
                                </div>
                            </Link>
                        )})()}
                        {/* Secundários — 2 colunas */}
                        {featuredProductions.slice(1).length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {featuredProductions.slice(1).map((p, i) => (
                                    <Link key={p.id} href={`/productions/${p.slug ?? p.id}`} className="group block">
                                        <div className="relative overflow-hidden bg-surface aspect-[2/3]">
                                            {p.imageUrl ? (
                                                <img src={p.imageUrl} alt={p.titlePt} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-surface flex items-center justify-center">
                                                    <span className="font-black text-foreground/10 text-[40px] leading-none">{p.titlePt[0]}</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                            <div className="absolute top-2 left-2">
                                                <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-white">● #{i + 2}</span>
                                            </div>
                                            {p.voteAverage && (
                                                <div className="absolute top-2 right-2 bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                                                    ★ {p.voteAverage.toFixed(1)}
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                                <span className="font-mono text-[8px] font-bold uppercase tracking-wide text-accent">{p.type ? (TYPE_LABEL[p.type] ?? p.type) : ''}</span>
                                                <h3 className="text-[14px] font-black tracking-tight leading-tight mt-0.5 text-white group-hover:text-accent transition-colors line-clamp-2">{p.titlePt}</h3>
                                                {p.titleKr && <p className="text-[10px] text-white/50 mt-0.5 truncate">{p.titleKr}</p>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Desktop layout — mantém original */}
                    <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr] gap-4">
                        {featuredProductions.map((p, i) => (
                            <Link key={p.id} href={`/productions/${p.slug ?? p.id}`} className="group block">
                                <div className={`relative overflow-hidden bg-surface ${i === 0 ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
                                    {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.titlePt} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-surface flex items-center justify-center">
                                            <span className="font-black text-foreground/10 text-[80px] leading-none">{p.titlePt[0]}</span>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                                        <span className="bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-white">● #{i + 1} em alta</span>
                                        {p.year && <span className="bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">{p.year}</span>}
                                    </div>
                                    {p.voteAverage && (
                                        <div className="absolute bottom-2 right-2 bg-black/65 px-1.5 py-0.5 font-mono text-[11px] font-bold text-white">
                                            ★ {p.voteAverage.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-3 pb-4 border-b border-border/50">
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-accent">{p.type ? (TYPE_LABEL[p.type] ?? p.type) : ''}</span>
                                    <h3 className={`font-display font-black tracking-[-0.03em] leading-[1.05] mt-1 group-hover:text-accent transition-colors ${i === 0 ? 'text-[28px]' : 'text-[20px]'}`}>{p.titlePt}</h3>
                                    {p.titleKr && <p className="text-[12px] text-muted mt-0.5">{p.titleKr}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            <div className={hideFilter ? '' : 'page-wrap pt-6'}>

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
                    <div className="mb-5 flex items-baseline justify-between border-b border-foreground pb-3">
                        <h2 className="text-[22px] font-black tracking-[-0.03em] text-foreground">Todas as produções</h2>
                        <p className="font-mono text-[11px] text-muted">
                            {pagination.total > 0 ? `vendo 1–${Math.min(getPerPage(), productions.length)} de ${pagination.total.toLocaleString('pt-BR')}` : 'Refine sua busca'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                        {productions.map((prod, index) => (
                            <ProductionCard key={prod.id} prod={prod} priority={index < 8} />
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
        </div>
    )
}
