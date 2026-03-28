'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink, Users, Music2, Building2, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'

const PER_PAGE_OPTIONS = [24, 48, 96]
const DEFAULT_PER_PAGE = 24

const TYPE_LABEL: Record<string, string> = {
    MAJOR: 'Grande Agência',
    INDIE: 'Independente',
    SUBSIDIARY: 'Sub-label',
}

const TYPE_STYLE: Record<string, string> = {
    MAJOR: 'bg-amber-400/10 text-amber-600 border-amber-400/20',
    INDIE: 'bg-blue-400/10 text-blue-600 border-blue-400/20',
    SUBSIDIARY: 'bg-violet-400/10 text-violet-600 border-violet-400/20',
}

interface Agency {
    id: string
    name: string
    description: string | null
    accentColor: string | null
    type: string
    foundedYear: number | null
    isVerified: boolean
    website: string | null
    parent: { id: string; name: string } | null
    musicalGroups: { id: string; name: string; profileImageUrl: string | null; disbandDate: string | null }[]
    artists: { id: string; nameRomanized: string; primaryImageUrl: string | null }[]
    _count: { artists: number; musicalGroups: number; subsidiaries: number }
}

interface AgenciesResponse {
    agencies: Agency[]
    pagination: { page: number; total: number; pages: number }
}

function AgenciesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface overflow-hidden">
                    <div className="h-1 bg-skeleton" />
                    <div className="p-6 space-y-3">
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

function AgencyCard({ agency }: { agency: Agency }) {
    const accent = agency.accentColor ?? '#6b7280'
    const activeGroups = agency.musicalGroups.filter(g => !g.disbandDate)
    const disbandedGroups = agency.musicalGroups.filter(g => !!g.disbandDate)
    const sortedGroups = [...activeGroups, ...disbandedGroups]

    return (
        <Link
            href={`/agencies/${agency.id}`}
            className="group flex flex-col rounded-2xl border border-border bg-surface hover:border-[var(--accent-color)]/40 hover:shadow-md transition-all overflow-hidden"
            style={{ '--accent-color': accent } as React.CSSProperties}
        >
            <div className="h-1 w-full" style={{ backgroundColor: accent }} />

            <div className="p-5 flex flex-col gap-3 flex-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-[14px] font-black text-foreground group-hover:text-[var(--accent-color)] transition-colors leading-tight">
                                {agency.name}
                            </h3>
                            {agency.isVerified && (
                                <span
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
                                    style={{ backgroundColor: accent }}
                                    title="Agência verificada"
                                >
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                        <path d="M1.5 4L3.2 5.7L6.5 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {agency.type && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_STYLE[agency.type] ?? 'text-muted border-border'}`}>
                                    {TYPE_LABEL[agency.type] ?? agency.type}
                                </span>
                            )}
                            {agency.foundedYear && (
                                <span className="text-[11px] text-muted flex items-center gap-1">
                                    <Calendar size={10} />
                                    {agency.foundedYear}
                                </span>
                            )}
                            {agency.parent && (
                                <span className="text-[10px] text-muted">
                                    via {agency.parent.name}
                                </span>
                            )}
                        </div>
                    </div>
                    {agency.website && (
                        <a
                            href={agency.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="shrink-0 text-muted hover:text-foreground transition-colors"
                        >
                            <ExternalLink size={13} />
                        </a>
                    )}
                </div>

                {/* Description */}
                {agency.description && (
                    <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
                        {agency.description}
                    </p>
                )}

                {/* Groups */}
                {sortedGroups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {sortedGroups.slice(0, 4).map(g => (
                            <span
                                key={g.id}
                                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    g.disbandDate
                                        ? 'text-muted border-border'
                                        : 'border-[var(--accent-color)]/30'
                                }`}
                                style={!g.disbandDate ? { color: accent, backgroundColor: `${accent}15` } : undefined}
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
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-border text-muted">
                                +{agency._count.musicalGroups - 4}
                            </span>
                        )}
                    </div>
                )}

                {/* Artist avatars */}
                {agency.artists.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {agency.artists.slice(0, 5).map(a => (
                                <div
                                    key={a.id}
                                    className="w-6 h-6 rounded-full border-2 border-surface overflow-hidden bg-background flex-shrink-0 relative"
                                    title={a.nameRomanized}
                                >
                                    {a.primaryImageUrl ? (
                                        <Image src={a.primaryImageUrl} alt="" fill sizes="24px" className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-muted">
                                            {a.nameRomanized[0]}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <span className="text-[11px] text-muted">
                            {agency._count.artists} artista{agency._count.artists !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex gap-3 text-[11px] text-muted">
                        <span className="flex items-center gap-1">
                            <Users size={11} />
                            {agency._count.artists}
                        </span>
                        {agency._count.musicalGroups > 0 && (
                            <span className="flex items-center gap-1">
                                <Music2 size={11} />
                                {agency._count.musicalGroups}
                            </span>
                        )}
                        {agency._count.subsidiaries > 0 && (
                            <span className="flex items-center gap-1">
                                <Building2 size={11} />
                                {agency._count.subsidiaries}
                            </span>
                        )}
                    </div>
                    <span className="text-[11px] font-semibold text-muted group-hover:text-[var(--accent-color)] transition-colors">
                        Ver perfil →
                    </span>
                </div>
            </div>
        </Link>
    )
}

export function AgenciesList() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [agencies, setAgencies] = useState<Agency[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })

    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const verified = searchParams.get('verified') || ''
    const sortBy = searchParams.get('sortBy') || 'relevance'
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

    return (
        <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {/* Search */}
                <div className="relative">
                    <input
                        type="search"
                        placeholder="Buscar agência..."
                        value={search}
                        onChange={e => updateUrl({ search: e.target.value })}
                        className="h-8 pl-3 pr-3 rounded-full text-xs border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 w-44"
                    />
                </div>

                {/* Type filter */}
                <div className="flex gap-1">
                    {[
                        { value: '', label: 'Todas' },
                        { value: 'MAJOR', label: 'Grandes' },
                        { value: 'INDIE', label: 'Independentes' },
                        { value: 'SUBSIDIARY', label: 'Sub-labels' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => updateUrl({ type: opt.value })}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                                type === opt.value
                                    ? 'bg-foreground text-background border-foreground'
                                    : 'text-muted border-border hover:border-foreground/30 hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Verified toggle */}
                <button
                    onClick={() => updateUrl({ verified: verified === '1' ? '' : '1' })}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                        verified === '1'
                            ? 'bg-foreground text-background border-foreground'
                            : 'text-muted border-border hover:border-foreground/30 hover:text-foreground'
                    }`}
                >
                    Verificadas
                </button>

                {/* Sort */}
                <select
                    value={sortBy}
                    onChange={e => updateUrl({ sortBy: e.target.value })}
                    className="h-8 px-3 rounded-full text-[11px] border border-border bg-surface text-muted focus:outline-none focus:border-foreground/30 cursor-pointer"
                >
                    <option value="relevance">Relevância</option>
                    <option value="name">Nome A–Z</option>
                    <option value="founded">Mais antigas</option>
                </select>
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
                    <p className="text-xs text-muted mb-5">
                        {pagination.total.toLocaleString('pt-BR')} agência{pagination.total !== 1 ? 's' : ''}
                        {pagination.pages > 1 && ` · pág. ${pagination.page} de ${pagination.pages}`}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {agencies.map(agency => (
                            <AgencyCard key={agency.id} agency={agency} />
                        ))}
                    </div>

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
