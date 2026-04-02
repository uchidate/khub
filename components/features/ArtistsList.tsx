'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArtistFilters, type ArtistFilterValues } from './ArtistFilters'
import { getRoleLabels } from '@/lib/utils/role-labels'
import { nameToGradient } from '@/lib/utils/name-to-gradient'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'

const PER_PAGE_OPTIONS = [50, 100, 150]
const DEFAULT_PER_PAGE = 50


function ArtistsSkeleton() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] rounded-xl bg-skeleton mb-2.5" />
                    <div className="h-3.5 bg-skeleton rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-skeleton rounded w-1/2 mb-1" />
                    <div className="h-2.5 bg-skeleton rounded w-2/3" />
                </div>
            ))}
        </div>
    )
}

interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: number | null
    memberships: { group: { id: string; name: string } }[]
    agency?: { name: string } | null
}

interface ArtistsListResponse {
    artists: Artist[]
    pagination: { page: number; total: number; pages: number }
}

function ArtistCard({ artist, priority }: { artist: Artist; priority?: boolean }) {
    const group = artist.memberships?.[0]?.group
    const roleLabels = getRoleLabels(artist.roles || [], artist.gender)
    const roleLabel = roleLabels[0] ?? ''
    const agencyName = artist.agency?.name ?? group?.name ?? ''

    return (
        <Link href={`/artists/${artist.id}`} className="group block">
            {/* Photo */}
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border mb-2.5 group-hover:border-[#ff2d78]/30 transition-colors">
                {artist.primaryImageUrl ? (
                    <Image
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        width={240}
                        height={320}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.04] transition-transform duration-300"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm font-bold text-muted opacity-40">
                            {artist.nameRomanized.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div>
                {roleLabel && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5 truncate">
                        {roleLabel}
                    </p>
                )}
                <p className="text-[13px] font-bold text-foreground group-hover:text-[#ff2d78] transition-colors truncate leading-tight">
                    {artist.nameRomanized}
                </p>
                {artist.nameHangul && (
                    <p className="text-[11px] text-muted truncate leading-tight mt-0.5">
                        {artist.nameHangul}
                    </p>
                )}
                {agencyName && (
                    <p className="text-[11px] text-muted truncate leading-tight mt-0.5 opacity-70">
                        {agencyName}
                    </p>
                )}
            </div>
        </Link>
    )
}

export function ArtistsList() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [artists, setArtists] = useState<Artist[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 })

    const getFiltersFromUrl = useCallback((): ArtistFilterValues => ({
        search: searchParams.get('search') || undefined,
        role: searchParams.get('role') || undefined,
        groupId: searchParams.get('groupId') || undefined,
        agencyId: searchParams.get('agencyId') || undefined,
        memberType: searchParams.get('memberType') || undefined,
        sortBy: searchParams.get('sortBy') || 'trending',
    }), [searchParams])

    const getCurrentPage = useCallback(() => Math.max(1, parseInt(searchParams.get('page') || '1')), [searchParams])
    const getPerPage = useCallback(() => parseInt(searchParams.get('limit') || String(DEFAULT_PER_PAGE)), [searchParams])

    const updateUrl = useCallback((filters: ArtistFilterValues, page = 1, limit?: number) => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.role) params.set('role', filters.role)
        if (filters.groupId) params.set('groupId', filters.groupId)
        if (filters.agencyId) params.set('agencyId', filters.agencyId)
        if (filters.memberType) params.set('memberType', filters.memberType)
        if (filters.sortBy && filters.sortBy !== 'trending') params.set('sortBy', filters.sortBy)
        if (page > 1) params.set('page', page.toString())
        const perPage = limit ?? getPerPage()
        if (perPage !== DEFAULT_PER_PAGE) params.set('limit', perPage.toString())
        router.push(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false })
    }, [pathname, router, getPerPage])

    const fetchArtists = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = getFiltersFromUrl()
            const params = new URLSearchParams({
                page: getCurrentPage().toString(),
                limit: getPerPage().toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role }),
                ...(filters.groupId && { groupId: filters.groupId }),
                ...(filters.agencyId && { agencyId: filters.agencyId }),
                ...(filters.memberType && { memberType: filters.memberType }),
                ...(filters.sortBy && { sortBy: filters.sortBy }),
            })
            const res = await fetch(`/api/artists/list?${params}`)
            const data: ArtistsListResponse = await res.json()
            setArtists(data.artists || [])
            setPagination(data.pagination)
        } catch (e) {
            console.error('Erro ao buscar artistas:', e)
        } finally {
            setIsLoading(false)
        }
    }, [getFiltersFromUrl, getCurrentPage, getPerPage])

    useEffect(() => { fetchArtists() }, [fetchArtists])

    const handleFilterChange = (filters: ArtistFilterValues) => updateUrl(filters, 1)
    const handlePageChange = (p: number) => {
        updateUrl(getFiltersFromUrl(), p, getPerPage())
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    const handlePerPage = (n: number) => updateUrl(getFiltersFromUrl(), 1, n)

    const perPage = getPerPage()
    const currentPage = pagination.page
    const totalPages = pagination.pages

    return (
        <div>
            <ArtistFilters onFilterChange={handleFilterChange} initialFilters={getFiltersFromUrl()} />

            {isLoading && <ArtistsSkeleton />}

            {!isLoading && artists.length === 0 && (
                <EmptyState
                    title="Nenhum artista encontrado"
                    description="Tente ajustar os filtros"
                    bordered
                />
            )}

            {!isLoading && artists.length > 0 && (
                <>
                    {/* Count */}
                    <p className="text-xs text-muted mb-5">
                        {pagination.total.toLocaleString('pt-BR')} artistas
                        {totalPages > 1 && ` · pág. ${currentPage} de ${totalPages}`}
                    </p>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                        {artists.map((artist, i) => (
                            <ArtistCard key={artist.id} artist={artist} priority={i < 6} />
                        ))}
                    </div>

                    {/* Pagination */}
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        perPage={perPage}
                        perPageOptions={PER_PAGE_OPTIONS}
                        total={pagination.total}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPage}
                        className="mt-12"
                    />
                </>
            )}
        </div>
    )
}
