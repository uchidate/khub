'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'

export interface ArtistFilterValues {
    search?: string
    role?: string
    groupId?: string
    agencyId?: string
    memberType?: string
    sortBy?: string
}

interface ArtistFiltersProps {
    onFilterChange: (filters: ArtistFilterValues) => void
    initialFilters?: ArtistFilterValues
}

const SORT_OPTIONS = [
    { value: 'trending', label: 'Em alta' },
    { value: 'name', label: 'A–Z' },
]

export function ArtistFilters({ onFilterChange, initialFilters = {} }: ArtistFiltersProps) {
    const [search, setSearch] = useState(initialFilters.search || '')
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'trending')

    const initialSearch = initialFilters.search || ''
    const initialSortBy = initialFilters.sortBy || 'trending'

    useEffect(() => {
        if (search === initialSearch) return
        const timer = setTimeout(() => {
            onFilterChange({ search: search || undefined, sortBy })
        }, 400)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        if (sortBy === initialSortBy) return
        onFilterChange({ search: search || undefined, sortBy })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy])

    const clear = () => { setSearch(''); setSortBy('trending') }
    const hasActive = !!(search || sortBy !== 'trending')

    return (
        <div className="sticky top-[52px] sm:top-[60px] lg:top-[64px] z-20 bg-background py-3 px-3 sm:px-4 mb-8 space-y-3 rounded-2xl border border-border shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar artistas..." />

            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                sortBy === opt.value
                                    ? 'bg-foreground text-background'
                                    : 'bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {hasActive && (
                    <button onClick={clear} className="p-1.5 text-muted hover:text-foreground transition-colors" title="Limpar filtros">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}
