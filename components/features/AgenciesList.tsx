'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Users, Music2, Building2, Calendar, CheckCircle2, X } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'
import { SearchInput } from '@/components/ui/SearchInput'

const PER_PAGE_OPTIONS = [24, 48, 96]
const DEFAULT_PER_PAGE = 24

const TYPE_LABEL: Record<string, string> = {
    MAJOR: 'Grande Agência',
    INDIE: 'Independente',
    SUBSIDIARY: 'Sub-label',
}

interface Agency {
    id: string
    slug: string | null
    name: string
    description: string | null
    accentColor: string | null
    type: string
    foundedYear: number | null
    isVerified: boolean
    website: string | null
    parent: { id: string; slug: string | null; name: string } | null
    musicalGroups: { id: string; name: string; profileImageUrl: string | null; disbandDate: string | null }[]
    artists: { id: string; nameRomanized: string; primaryImageUrl: string | null }[]
    subsidiaries: {
        id: string
        name: string
        accentColor: string | null
        _count: { artists: number; musicalGroups: number }
        musicalGroups: { id: string; name: string; profileImageUrl: string | null; disbandDate: string | null }[]
    }[]
    _count: { artists: number; musicalGroups: number; subsidiaries: number }
    _totalArtists: number
    _totalGroups: number
}

interface AgenciesResponse {
    agencies: Agency[]
    pagination: { page: number; total: number; pages: number }
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function AgenciesSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface overflow-hidden">
                    <div className="h-24 bg-skeleton" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 bg-skeleton rounded w-2/3" />
                        <div className="h-3 bg-skeleton rounded w-1/3" />
                        <div className="h-3 bg-skeleton rounded w-full" />
                        <div className="h-3 bg-skeleton rounded w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// ─── Agency Card ─────────────────────────────────────────────────────────────

function AgencyCard({ agency }: { agency: Agency }) {
    const accent = agency.accentColor ?? '#6b7280'
    const isMajor = agency.type === 'MAJOR'
    const isParent = agency._count.artists === 0 && agency._count.subsidiaries > 0
    const activeGroups = agency.musicalGroups.filter(g => !g.disbandDate)

    // Portrait strip: direct artists → direct groups → subsidiary groups (for HYBE-type)
    const portraits = agency.artists.length > 0 || agency.musicalGroups.length > 0
        ? [
            ...agency.artists.filter(a => a.primaryImageUrl).map(a => a.primaryImageUrl!),
            ...agency.musicalGroups.filter(g => g.profileImageUrl).map(g => g.profileImageUrl!),
          ].slice(0, isMajor ? 7 : 5)
        : agency.subsidiaries
            .flatMap(s => s.musicalGroups.filter(g => g.profileImageUrl).map(g => g.profileImageUrl!))
            .slice(0, isMajor ? 7 : 5)

    const headerH = isMajor ? 'h-44' : 'h-36'

    return (
        <Link
            href={`/agencies/${agency.slug ?? agency.id}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[var(--ac)]/50 hover:-translate-y-0.5"
            style={{ '--ac': accent } as React.CSSProperties}
        >
            {/* ── Portrait lineup header ── */}
            <div className={`relative overflow-hidden ${headerH}`}>

                {portraits.length > 0 ? (
                    /* Horizontal portrait strip */
                    <div className="absolute inset-0 flex">
                        {portraits.map((src, i) => (
                            <div
                                key={i}
                                className="relative flex-1 overflow-hidden"
                                style={{ minWidth: 0 }}
                            >
                                <Image
                                    src={src}
                                    alt=""
                                    fill
                                    sizes="120px"
                                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                />
                                {/* thin separator */}
                                {i < portraits.length - 1 && (
                                    <div className="absolute right-0 inset-y-0 w-px bg-black/30 z-10" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}70)` }} />
                )}

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
                <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: `linear-gradient(to top, ${accent}50, transparent)` }} />

                {/* Type badge top-left */}
                <div className="absolute top-2.5 left-3 flex items-center gap-1.5">
                    <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full backdrop-blur-sm text-white"
                        style={{ backgroundColor: `${accent}cc` }}
                    >
                        {TYPE_LABEL[agency.type] ?? agency.type}
                    </span>
                    {agency.parent && (
                        <span className="text-[9px] text-white/60 font-semibold">
                            via {agency.parent.name}
                        </span>
                    )}
                </div>

                {/* Verified + website top-right */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                    {agency.isVerified && (
                        <CheckCircle2 size={14} className="text-white/90 drop-shadow" />
                    )}
                    {agency.website && (
                        <button
                            onClick={e => { e.preventDefault(); window.open(agency.website!, '_blank', 'noopener,noreferrer') }}
                            className="text-white/60 hover:text-white transition-colors"
                        >
                            <ExternalLink size={12} />
                        </button>
                    )}
                </div>

                {/* Agency name + stats bottom overlay */}
                <div className="absolute bottom-0 inset-x-0 px-3 pb-3 pt-6">
                    <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-black text-white leading-tight drop-shadow truncate group-hover:opacity-90 transition-opacity">
                                {agency.name}
                            </h3>
                            {agency.foundedYear && (
                                <p className="text-[9px] text-white/55 flex items-center gap-0.5 mt-0.5">
                                    <Calendar size={8} /> {agency.foundedYear}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {agency._totalArtists > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                    <Users size={10} /> {agency._totalArtists}
                                </span>
                            )}
                            {agency._totalGroups > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                    <Music2 size={10} /> {agency._totalGroups}
                                </span>
                            )}
                            {agency._count.subsidiaries > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-white/80">
                                    <Building2 size={10} /> {agency._count.subsidiaries}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Card body ── */}
            <div className="p-4 flex flex-col gap-3 flex-1">

                {/* Description */}
                {agency.description && (
                    <p className="text-[11px] text-muted leading-relaxed line-clamp-2">
                        {agency.description}
                    </p>
                )}

                {/* For parent agencies: show sub-label pills */}
                {isParent && agency.subsidiaries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {agency.subsidiaries.map(sub => (
                            <span
                                key={sub.id}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{ color: sub.accentColor ?? accent, backgroundColor: `${sub.accentColor ?? accent}15`, borderColor: `${sub.accentColor ?? accent}30` }}
                            >
                                {sub.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* For regular agencies: show active groups */}
                {!isParent && activeGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {activeGroups.slice(0, 4).map(g => (
                            <span
                                key={g.id}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                                style={{ color: accent, backgroundColor: `${accent}15`, borderColor: `${accent}30` }}
                            >
                                {g.profileImageUrl && (
                                    <span className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0 relative inline-block">
                                        <Image src={g.profileImageUrl} alt="" width={12} height={12} className="object-cover w-full h-full" />
                                    </span>
                                )}
                                {g.name}
                            </span>
                        ))}
                        {agency._count.musicalGroups > 4 && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted">
                                +{agency._count.musicalGroups - 4}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AgenciesList() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [agencies, setAgencies] = useState<Agency[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })

    const search  = searchParams.get('search') || ''
    const type    = searchParams.get('type') || ''
    const verified = searchParams.get('verified') || ''
    const sortBy  = searchParams.get('sortBy') || 'relevance'
    const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const perPage = parseInt(searchParams.get('limit') || String(DEFAULT_PER_PAGE))

    const updateUrl = useCallback((updates: Record<string, string>, resetPage = true) => {
        const params = new URLSearchParams(searchParams.toString())
        Object.entries(updates).forEach(([k, v]) => {
            if (v) params.set(k, v)
            else params.delete(k)
        })
        if (resetPage) params.delete('page')
        router.push(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
    }, [pathname, router, searchParams])

    const fetchAgencies = useCallback(async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: perPage.toString(),
            })
            if (search) params.set('search', search)
            if (type) params.set('type', type)
            if (verified) params.set('verified', verified)
            if (sortBy && sortBy !== 'relevance') params.set('sortBy', sortBy)

            const res = await fetch(`/api/agencies?${params}`)
            const data: AgenciesResponse = await res.json()
            setAgencies(data.agencies || [])
            setPagination(data.pagination)
        } catch (e) {
            console.error('Erro ao buscar agências:', e)
        } finally {
            setIsLoading(false)
        }
    }, [search, type, verified, sortBy, currentPage, perPage])

    useEffect(() => { fetchAgencies() }, [fetchAgencies])

    const handlePageChange = (p: number) => {
        updateUrl({ page: p.toString() }, false)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const isDefaultView = !search && !type && !verified && sortBy === 'relevance' && currentPage === 1

    // Split major vs rest for featured layout
    const majorAgencies = isDefaultView ? agencies.filter(a => a.type === 'MAJOR') : []
    const restAgencies  = isDefaultView ? agencies.filter(a => a.type !== 'MAJOR') : agencies

    return (
        <div>
            {/* ── Filters ── */}
            <div className="mb-8 space-y-3">
                <SearchInput
                    value={search}
                    onChange={v => updateUrl({ search: v })}
                    placeholder="Buscar agências..."
                />

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Type pills */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {[
                            { value: '', label: 'Todas' },
                            { value: 'MAJOR', label: 'Grandes' },
                            { value: 'INDIE', label: 'Independentes' },
                            { value: 'SUBSIDIARY', label: 'Sub-labels' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updateUrl({ type: opt.value })}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    type === opt.value
                                        ? 'bg-[#ff2d78] text-white'
                                        : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Right: verified + sort + clear */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={() => updateUrl({ verified: verified === '1' ? '' : '1' })}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                verified === '1'
                                    ? 'bg-[#080808] text-white'
                                    : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                            }`}
                        >
                            <CheckCircle2 size={11} />
                            Verificadas
                        </button>

                        <span className="w-px h-4 bg-border mx-0.5" />

                        {[
                            { value: 'relevance', label: 'Relevância' },
                            { value: 'name', label: 'A–Z' },
                            { value: 'founded', label: 'Mais antigas' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updateUrl({ sortBy: opt.value })}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                    sortBy === opt.value
                                        ? 'bg-[#ff2d78] text-white'
                                        : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}

                        {(search || type || verified || sortBy !== 'relevance') && (
                            <button
                                onClick={() => updateUrl({ search: '', type: '', verified: '', sortBy: 'relevance' })}
                                className="ml-1 p-1.5 text-muted hover:text-foreground transition-colors"
                                title="Limpar filtros"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && <AgenciesSkeleton />}

            {!isLoading && agencies.length === 0 && (
                <EmptyState
                    title="Nenhuma agência encontrada"
                    description="Tente ajustar os filtros"
                    bordered
                />
            )}

            {!isLoading && agencies.length > 0 && (
                <>
                    <p className="text-xs text-muted mb-6">
                        {pagination.total.toLocaleString('pt-BR')} agência{pagination.total !== 1 ? 's' : ''}
                        {pagination.pages > 1 && ` · pág. ${pagination.page} de ${pagination.pages}`}
                    </p>

                    {/* Featured: Grandes Agências */}
                    {majorAgencies.length > 0 && (
                        <div className="mb-10">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-4 h-px bg-border inline-block" />
                                Grandes Agências
                                <span className="w-4 h-px bg-border inline-block" />
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {majorAgencies.map(agency => (
                                    <AgencyCard key={agency.id} agency={agency} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Rest */}
                    {restAgencies.length > 0 && (
                        <div>
                            {majorAgencies.length > 0 && (
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-4 h-px bg-border inline-block" />
                                    Independentes & Sub-labels
                                    <span className="w-4 h-px bg-border inline-block" />
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {restAgencies.map(agency => (
                                    <AgencyCard key={agency.id} agency={agency} />
                                ))}
                            </div>
                        </div>
                    )}

                    <PaginationControls
                        currentPage={pagination.page}
                        totalPages={pagination.pages}
                        perPage={perPage}
                        perPageOptions={PER_PAGE_OPTIONS}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                        onPerPageChange={n => updateUrl({ limit: n.toString() })}
                        className="mt-12"
                    />
                </>
            )}
        </div>
    )
}
