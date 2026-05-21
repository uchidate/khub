'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export interface ArtistFilterValues {
    search?: string
    role?: string
    groupId?: string
    agencyId?: string
    memberType?: string
    sortBy?: string
}

interface ArtistFiltersProps {
    initialFilters?: ArtistFilterValues
    hero?: boolean
}

const SORT_OPTIONS = [
    { value: 'trending', label: 'Em alta' },
    { value: 'name', label: 'A–Z' },
    { value: 'newest', label: 'Novos' },
]

const ROLE_OPTIONS = [
    { value: 'CANTOR', label: 'Cantores' },
    { value: 'ATOR', label: 'Atores' },
    { value: 'RAPPER', label: 'Rappers' },
    { value: 'DANÇARINO', label: 'Dança' },
    { value: 'MODELO', label: 'Modelos' },
]

const MEMBER_TYPE_OPTIONS = [
    { value: 'group', label: 'Em grupo' },
    { value: 'solo', label: 'Solo' },
]

export function ArtistFilters({ initialFilters = {} }: ArtistFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(initialFilters.search || '')
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'trending')
    const [role, setRole] = useState(initialFilters.role || '')
    const [memberType, setMemberType] = useState(initialFilters.memberType || '')

    const initialSearch = initialFilters.search || ''
    const initialSortBy = initialFilters.sortBy || 'trending'
    const initialRole = initialFilters.role || ''
    const initialMemberType = initialFilters.memberType || ''

    const buildUrl = (s: string, sort: string, selectedRole: string, selectedMemberType: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (s) params.set('search', s); else params.delete('search')
        if (sort && sort !== 'trending') params.set('sortBy', sort); else params.delete('sortBy')
        if (selectedRole) params.set('role', selectedRole); else params.delete('role')
        if (selectedMemberType) params.set('memberType', selectedMemberType); else params.delete('memberType')
        params.delete('page')
        return params.toString() ? `${pathname}?${params}` : pathname
    }

    useEffect(() => {
        if (search === initialSearch) return
        const timer = setTimeout(() => router.push(buildUrl(search, sortBy, role, memberType)), 400)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        if (sortBy === initialSortBy) return
        router.push(buildUrl(search, sortBy, role, memberType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy])

    useEffect(() => {
        if (role === initialRole) return
        router.push(buildUrl(search, sortBy, role, memberType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role])

    useEffect(() => {
        if (memberType === initialMemberType) return
        router.push(buildUrl(search, sortBy, role, memberType))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [memberType])

    const clear = () => { setSearch(''); setSortBy('trending'); setRole(''); setMemberType('') }
    const hasActive = !!(search || sortBy !== 'trending' || role || memberType)

    return (
        <div className="border border-border bg-background mb-6">
            {/* Search row */}
            <div className="flex items-center border-b border-border">
                <Search className="h-4 w-4 shrink-0 text-muted mx-3" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nome, hangul ou stage name..."
                    className="flex-1 py-3 text-[13px] bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                />
                {hasActive && (
                    <button onClick={clear} className="flex items-center gap-1 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.06em] text-muted hover:text-foreground transition-colors border-l border-border" aria-label="Limpar filtros">
                        <X className="h-3 w-3" /> Limpar
                    </button>
                )}
            </div>

            {/* Filter chips row */}
            <div className="flex items-center gap-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Sort */}
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted px-3 py-2.5 border-r border-border shrink-0">Ordem</span>
                {SORT_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setSortBy(opt.value)}
                        className={`px-3 py-2.5 font-mono text-[11px] shrink-0 border-r border-border transition-colors ${
                            sortBy === opt.value
                                ? 'bg-foreground text-background font-bold'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}

                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted px-3 py-2.5 border-r border-border shrink-0">Tipo</span>
                {ROLE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setRole(role === opt.value ? '' : opt.value)}
                        className={`px-3 py-2.5 font-mono text-[11px] shrink-0 border-r border-border transition-colors ${
                            role === opt.value
                                ? 'bg-foreground text-background font-bold'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}

                {MEMBER_TYPE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setMemberType(memberType === opt.value ? '' : opt.value)}
                        className={`px-3 py-2.5 font-mono text-[11px] shrink-0 border-r border-border transition-colors ${
                            memberType === opt.value
                                ? 'bg-foreground text-background font-bold'
                                : 'text-muted hover:text-foreground'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
