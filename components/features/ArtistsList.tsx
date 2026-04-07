'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArtistFilters, type ArtistFilterValues } from './ArtistFilters'
import { getRoleLabels } from '@/lib/utils/role-labels'
import { nameToGradient } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'

export interface Artist {
    id: string
    nameRomanized: string
    nameHangul: string | null
    primaryImageUrl: string | null
    roles: string[]
    gender?: number | null
    memberships: { group: { id: string; name: string } }[]
    agency?: { name: string } | null
}

export interface ArtistsPagination {
    page: number
    total: number
    pages: number
}

function ArtistCard({ artist, priority }: { artist: Artist; priority?: boolean }) {
    const group = artist.memberships?.[0]?.group
    const roleLabels = getRoleLabels(artist.roles || [], artist.gender)
    const roleLabel = roleLabels[0] ?? ''

    return (
        <Link href={`/artists/${artist.id}`} className="group block rounded-2xl p-2 -m-2">
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface border border-border/80 shadow-sm mb-2.5 group-hover:border-accent/30 group-hover:shadow-md transition-all">
                {artist.primaryImageUrl ? (
                    <Image
                        src={artist.primaryImageUrl}
                        alt={artist.nameRomanized}
                        width={240}
                        height={320}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        priority={priority}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(artist.nameRomanized) }}>
                        <span className="text-3xl font-black text-white/80 drop-shadow select-none">
                            {artist.nameRomanized[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 gap-0.5">
                    {artist.nameHangul && <p className="text-white text-[12px] font-bold truncate leading-tight">{artist.nameHangul}</p>}
                    {group && <p className="text-white/65 text-[10px] truncate leading-tight">{group.name}</p>}
                </div>
            </div>
            <div>
                {roleLabel && <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-0.5 truncate">{roleLabel}</p>}
                <p className="text-[13px] font-bold text-foreground group-hover:text-accent transition-colors truncate leading-tight">{artist.nameRomanized}</p>
                {artist.nameHangul && <p className="text-[11px] text-muted truncate leading-tight mt-0.5">{artist.nameHangul}</p>}
                {artist.agency?.name && <p className="text-[11px] text-muted truncate leading-tight mt-0.5 opacity-70">{artist.agency.name}</p>}
            </div>
        </Link>
    )
}

interface ArtistsListProps {
    artists: Artist[]
    pagination: ArtistsPagination
    initialFilters: ArtistFilterValues
}

export function ArtistsList({ artists, pagination, initialFilters }: ArtistsListProps) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const buildUrl = (filters: ArtistFilterValues, page: number) => {
        const params = new URLSearchParams()
        if (filters.search) params.set('search', filters.search)
        if (filters.role) params.set('role', filters.role)
        if (filters.groupId) params.set('groupId', filters.groupId)
        if (filters.agencyId) params.set('agencyId', filters.agencyId)
        if (filters.memberType) params.set('memberType', filters.memberType)
        if (filters.sortBy && filters.sortBy !== 'trending') params.set('sortBy', filters.sortBy)
        if (page > 1) params.set('page', page.toString())
        return params.toString() ? `${pathname}?${params}` : pathname
    }

    const currentFilters: ArtistFilterValues = {
        search: searchParams.get('search') || undefined,
        role: searchParams.get('role') || undefined,
        groupId: searchParams.get('groupId') || undefined,
        agencyId: searchParams.get('agencyId') || undefined,
        memberType: searchParams.get('memberType') || undefined,
        sortBy: searchParams.get('sortBy') || 'trending',
    }

    const handleFilterChange = (filters: ArtistFilterValues) => {
        router.push(buildUrl(filters, 1))
    }

    const handlePageChange = (p: number) => {
        router.push(buildUrl(currentFilters, p))
    }

    const buildHref = (p: number) => buildUrl(currentFilters, p)

    const { page: currentPage, pages: totalPages, total } = pagination

    return (
        <div id="artists-list">
            <ArtistFilters onFilterChange={handleFilterChange} initialFilters={initialFilters} />

            {artists.length === 0 && (
                <EmptyState title="Nenhum artista encontrado" description="Tente ajustar os filtros" bordered />
            )}

            {artists.length > 0 && (
                <>
                    <p className="text-xs text-muted mb-5">
                        {total.toLocaleString('pt-BR')} artistas
                        {totalPages > 1 && ` · pág. ${currentPage} de ${totalPages}`}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
                        {artists.map((artist, i) => (
                            <ArtistCard key={artist.id} artist={artist} priority={i < 6} />
                        ))}
                    </div>
                    <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        buildHref={buildHref}
                        onPageChange={handlePageChange}
                        className="mt-12"
                    />
                </>
            )}
        </div>
    )
}
