'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import type { ArtistFilterValues } from './ArtistFilters'
import { getRoleLabels } from '@/lib/utils/role-labels'
import { nameToGradient } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaginationControls } from '@/components/ui/PaginationControls'

export interface Artist {
    id: string
    slug?: string | null
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
    perPage: number
}

function ArtistCard({ artist, priority }: { artist: Artist; priority?: boolean }) {
    const group = artist.memberships?.[0]?.group
    const roleLabels = getRoleLabels(artist.roles || [], artist.gender)
    const roleLabel = roleLabels[0] ?? ''
    const [imageFailed, setImageFailed] = useState(false)
    const imageSrc = artist.primaryImageUrl && !imageFailed ? artist.primaryImageUrl : null

    return (
        <Link href={`/artists/${artist.slug ?? artist.id}`} className="group grid grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-background p-2.5 shadow-sm transition-all hover:border-violet/35 hover:bg-surface-media/35 hover:shadow-md sm:block sm:border-0 sm:bg-transparent sm:p-2 sm:-m-2 sm:shadow-none sm:hover:bg-transparent">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border/80 bg-surface shadow-sm transition-all group-hover:border-violet/30 sm:mb-2.5">
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageSrc}
                        alt={artist.nameRomanized}
                        width={240}
                        height={320}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding={priority ? 'sync' : 'async'}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(artist.nameRomanized) }}>
                        <span className="text-2xl font-black text-white/80 drop-shadow select-none sm:text-3xl">
                            {artist.nameRomanized[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2.5 gap-0.5">
                    {artist.nameHangul && <p className="text-white text-[12px] font-bold truncate leading-tight">{artist.nameHangul}</p>}
                    {group && <p className="text-white/65 text-[10px] truncate leading-tight">{group.name}</p>}
                </div>
            </div>
            <div className="min-w-0 self-center sm:self-auto">
                {roleLabel && <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-violet mb-1 truncate sm:text-[10px]">{roleLabel}</p>}
                <p className="text-[14px] font-bold text-foreground group-hover:text-violet transition-colors truncate leading-tight sm:text-[13px]">{artist.nameRomanized}</p>
                {artist.nameHangul && <p className="text-[11px] text-muted truncate leading-tight mt-0.5">{artist.nameHangul}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-1">
                    {group && (
                        <span className="max-w-full truncate rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {group.name}
                        </span>
                    )}
                    {artist.agency?.name && (
                        <span className="max-w-full truncate rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {artist.agency.name}
                        </span>
                    )}
                </div>
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

    const handlePageChange = (p: number) => {
        router.push(buildUrl(currentFilters, p))
    }

    const buildHref = (p: number) => buildUrl(currentFilters, p)

    const { page: currentPage, pages: totalPages, total } = pagination
    const start = total === 0 ? 0 : (currentPage - 1) * pagination.perPage + 1
    const end = Math.min(start + artists.length - 1, total)

    return (
        <div id="artists-list">

            {artists.length === 0 && (
                <EmptyState title="Nenhum artista encontrado" description="Tente ajustar os filtros" bordered />
            )}

            {artists.length > 0 && (
                <>
                    <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet">Catálogo</p>
                            <h2 className="text-xl font-black tracking-[-0.03em] text-foreground sm:text-2xl">Todos os artistas</h2>
                        </div>
                        <p className="text-xs text-muted">
                            {start.toLocaleString('pt-BR')}-{end.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')}
                            {totalPages > 1 && ` · pág. ${currentPage} de ${totalPages}`}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-5">
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
