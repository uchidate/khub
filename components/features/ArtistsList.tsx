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
    trendingScore?: number | null
}

export interface ArtistsPagination {
    page: number
    total: number
    pages: number
    perPage: number
}

function ArtistCard({ artist, priority, trending }: { artist: Artist; priority?: boolean; trending?: boolean }) {
    const group = artist.memberships?.[0]?.group
    const roleLabels = getRoleLabels(artist.roles || [], artist.gender)
    const roleLabel = roleLabels[0] ?? ''
    const [imageFailed, setImageFailed] = useState(false)
    const imageSrc = artist.primaryImageUrl && !imageFailed ? artist.primaryImageUrl : null

    return (
        <Link href={`/artists/${artist.slug ?? artist.id}`} className="group flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageSrc}
                        alt={artist.nameRomanized}
                        width={240}
                        height={300}
                        loading={priority ? 'eager' : 'lazy'}
                        decoding={priority ? 'sync' : 'async'}
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: nameToGradient(artist.nameRomanized) }}>
                        <span className="font-black text-white/15 select-none text-[64px] leading-none">
                            {artist.nameHangul?.slice(0, 2) ?? artist.nameRomanized[0]?.toUpperCase() ?? '?'}
                        </span>
                    </div>
                )}
                {trending && (
                    <span className="absolute top-2 left-2 bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-white">● top</span>
                )}
            </div>
            <div className="pt-2.5 pb-3.5 border-b border-border/50 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                    <span className="text-[14px] font-semibold text-foreground group-hover:text-accent transition-colors truncate leading-tight">{artist.nameRomanized}</span>
                    {artist.nameHangul && <span className="font-mono text-[11px] text-muted shrink-0">{artist.nameHangul}</span>}
                </div>
                <div className="font-mono text-[10px] text-muted mt-1 uppercase tracking-[0.04em] truncate">
                    {roleLabel}{group ? ` · ${group.name}` : ''}
                </div>
            </div>
        </Link>
    )
}

interface ArtistsListProps {
    artists: Artist[]
    pagination: ArtistsPagination
    initialFilters: ArtistFilterValues
    trendingIds?: string[]
}

export function ArtistsList({ artists, pagination, initialFilters, trendingIds = [] }: ArtistsListProps) {
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
                    <div className="mb-6 flex items-end justify-between">
                        <p className="font-mono text-[11px] text-muted uppercase tracking-[0.06em]">
                            {start.toLocaleString('pt-BR')}–{end.toLocaleString('pt-BR')} de {total.toLocaleString('pt-BR')} artistas
                            {totalPages > 1 && ` · pág. ${currentPage} de ${totalPages}`}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0 sm:grid-cols-4 lg:grid-cols-6">
                        {artists.map((artist, i) => (
                            <ArtistCard key={artist.id} artist={artist} priority={i < 12} trending={trendingIds.includes(artist.id)} />
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
