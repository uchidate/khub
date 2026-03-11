'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { MediaCard } from '@/components/ui/MediaCard'
import { ArtistFilters, type ArtistFilterValues } from './ArtistFilters'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getRoleLabels } from '@/lib/utils/role-labels'

function ArtistsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-[2/3] rounded-xl bg-zinc-800/60" />
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
    streamingSignals?: { showTitle: string; rank: number; source: string }[]
}

interface ArtistsListResponse {
    artists: Artist[]
    pagination: {
        page: number
        total: number
        pages: number
    }
}

export function ArtistsList() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [artists, setArtists] = useState<Artist[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 0,
    })
    const [pageJumpInput, setPageJumpInput] = useState('')
    const [isEditingPage, setIsEditingPage] = useState(false)

    // Extrair filtros da URL
    const getFiltersFromUrl = useCallback((): ArtistFilterValues => {
        return {
            search: searchParams.get('search') || undefined,
            role: searchParams.get('role') || undefined,
            groupId: searchParams.get('groupId') || undefined,
            agencyId: searchParams.get('agencyId') || undefined,
            memberType: searchParams.get('memberType') || undefined,
            sortBy: searchParams.get('sortBy') || 'trending',
        }
    }, [searchParams])

    const getCurrentPage = () => {
        return Math.max(1, parseInt(searchParams.get('page') || '1'))
    }

    // Atualizar URL com filtros
    const updateUrl = useCallback((filters: ArtistFilterValues, page: number = 1) => {
        const params = new URLSearchParams()

        if (filters.search) params.set('search', filters.search)
        if (filters.role) params.set('role', filters.role)
        if (filters.groupId) params.set('groupId', filters.groupId)
        if (filters.agencyId) params.set('agencyId', filters.agencyId)
        if (filters.memberType) params.set('memberType', filters.memberType)
        if (filters.sortBy && filters.sortBy !== 'trending') params.set('sortBy', filters.sortBy)
        if (page > 1) params.set('page', page.toString())

        const newUrl = params.toString() ? `${pathname}?${params}` : pathname
        router.push(newUrl, { scroll: false })
    }, [pathname, router])

    // Buscar artistas da API
    const fetchArtists = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = getFiltersFromUrl()
            const page = getCurrentPage()

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '24',
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role }),
                ...(filters.groupId && { groupId: filters.groupId }),
                ...(filters.agencyId && { agencyId: filters.agencyId }),
                ...(filters.memberType && { memberType: filters.memberType }),
                ...(filters.sortBy && { sortBy: filters.sortBy }),
            })

            const response = await fetch(`/api/artists/list?${params}`)
            const data: ArtistsListResponse = await response.json()

            setArtists(data.artists || [])
            setPagination(data.pagination)
        } catch (error) {
            console.error('Erro ao buscar artistas:', error)
        } finally {
            setIsLoading(false)
        }
    }, [getFiltersFromUrl])

    // Buscar artistas quando URL mudar
    useEffect(() => {
        fetchArtists()
    }, [fetchArtists])

    // Handler de mudança de filtros
    const handleFilterChange = (filters: ArtistFilterValues) => {
        updateUrl(filters, 1) // Sempre volta para página 1 quando muda filtros
    }

    // Handler de mudança de página
    const handlePageChange = (newPage: number) => {
        const filters = getFiltersFromUrl()
        updateUrl(filters, newPage)
    }

    return (
        <div>
            {/* Filtros */}
            <ArtistFilters
                onFilterChange={handleFilterChange}
                initialFilters={getFiltersFromUrl()}
            />

            {/* Loading State */}
            {isLoading && <ArtistsSkeleton />}

            {/* Empty State */}
            {!isLoading && artists.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-zinc-400 text-lg mb-2">
                        Nenhum artista encontrado
                    </p>
                    <p className="text-zinc-500 text-sm">
                        Tente ajustar os filtros ou fazer uma nova busca
                    </p>
                </div>
            )}

            {/* Grid de Artistas */}
            {!isLoading && artists.length > 0 && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 perspective-1000">
                        {artists.map((artist) => {
                            const group = artist.memberships?.[0]?.group
                            return (
                                <MediaCard
                                    key={artist.id}
                                    id={artist.id}
                                    title={artist.nameRomanized}
                                    subtitle={artist.nameHangul || undefined}
                                    imageUrl={artist.primaryImageUrl}
                                    type="artist"
                                    href={`/artists/${artist.id}`}
                                    badges={[
                                        ...(group ? [group.name] : []),
                                        ...getRoleLabels(artist.roles || [], artist.gender),
                                    ]}
                                    aspectRatio="poster"
                                    adminHref={`/admin/artists/${artist.id}?returnTo=${encodeURIComponent(pathname + (searchParams.toString() ? '?' + searchParams.toString() : ''))}`}
                                    streamingSignal={artist.streamingSignals?.[0]}
                                />
                            )
                        })}
                    </div>

                    {/* Paginação */}
                    {pagination.pages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-3 flex-wrap">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-500">Página</span>
                                {isEditingPage ? (
                                    <input
                                        autoFocus
                                        type="number"
                                        min={1}
                                        max={pagination.pages}
                                        value={pageJumpInput}
                                        onChange={e => setPageJumpInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                const p = Math.min(pagination.pages, Math.max(1, parseInt(pageJumpInput) || pagination.page))
                                                handlePageChange(p)
                                                setIsEditingPage(false)
                                                setPageJumpInput('')
                                            }
                                            if (e.key === 'Escape') {
                                                setIsEditingPage(false)
                                                setPageJumpInput('')
                                            }
                                        }}
                                        onBlur={() => { setIsEditingPage(false); setPageJumpInput('') }}
                                        className="w-14 text-center px-2 py-1 bg-zinc-800 border border-purple-500/50 rounded text-sm text-white focus:outline-none"
                                    />
                                ) : (
                                    <button
                                        onClick={() => { setIsEditingPage(true); setPageJumpInput(String(pagination.page)) }}
                                        className="px-2 py-1 rounded text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 hover:text-purple-400 transition-colors min-w-[2rem] text-center"
                                        title="Clique para ir a uma página específica"
                                    >
                                        {pagination.page}
                                    </button>
                                )}
                                <span className="text-sm text-zinc-500">de {pagination.pages}</span>
                                <span className="text-xs text-zinc-600 hidden sm:inline">({pagination.total.toLocaleString('pt-BR')} artistas)</span>
                            </div>

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                Próxima
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
