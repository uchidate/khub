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

const ROLES = [
    { value: '', label: 'Todos' },
    { value: 'CANTOR', label: 'Cantores' },
    { value: 'ATOR', label: 'Atores' },
    { value: 'RAPPER', label: 'Rappers' },
    { value: 'DANÇARINO', label: 'Dançarinos' },
    { value: 'MODELO', label: 'Modelos' },
]

const SORT_OPTIONS = [
    { value: 'trending', label: 'Em alta' },
    { value: 'name', label: 'A–Z' },
    { value: 'newest', label: 'Recentes' },
]

const MEMBER_TYPE_OPTIONS = [
    { value: 'solo', label: 'Solo' },
    { value: 'group', label: 'Grupo' },
]

export function ArtistFilters({ onFilterChange, initialFilters = {} }: ArtistFiltersProps) {
    const [search, setSearch] = useState(initialFilters.search || '')
    const [role, setRole] = useState(initialFilters.role || '')
    const [memberType, setMemberType] = useState(initialFilters.memberType || '')
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'trending')

    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange({ search: search || undefined, role: role || undefined, memberType: memberType || undefined, sortBy })
        }, 400)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        onFilterChange({ search: search || undefined, role: role || undefined, memberType: memberType || undefined, sortBy })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, memberType, sortBy])

    const clear = () => { setSearch(''); setRole(''); setMemberType(''); setSortBy('trending') }
    const hasActive = !!(search || role || memberType || sortBy !== 'trending')

    return (
        <div className="mb-8 space-y-3">
            {/* Search */}
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar artistas..." />

            {/* Filters row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                {/* Role pills */}
                <div className="flex items-center gap-1 flex-wrap">
                    {ROLES.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRole(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                role === opt.value
                                    ? 'bg-[#ff2d78] text-white'
                                    : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 flex-wrap">
                    {MEMBER_TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMemberType(memberType === opt.value ? '' : opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                memberType === opt.value
                                    ? 'bg-[#080808] text-white'
                                    : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    <span className="w-px h-4 bg-[#e8e8e8] mx-0.5" />
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                sortBy === opt.value
                                    ? 'bg-[#ff2d78] text-white'
                                    : 'bg-surface text-muted hover:bg-[#e8e8e8] hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                    {hasActive && (
                        <button onClick={clear} className="ml-1 p-1.5 text-muted hover:text-foreground transition-colors" title="Limpar filtros">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
