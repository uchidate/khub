'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUpDown, Search, UserRound, UsersRound, X } from 'lucide-react'

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

    const chipClass = (active: boolean) =>
        `h-8 shrink-0 rounded-md px-3 text-[12px] font-bold transition-colors ${
            active
                ? 'bg-foreground text-background'
                : 'text-muted hover:bg-surface hover:text-foreground'
        }`

    const selectClass = 'h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground'
    const renderFilterControls = () => (
        <>
            <div className="flex shrink-0 items-center gap-1.5">
                <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    <ArrowUpDown className="h-3 w-3" />
                    Ordem
                </span>
                <div className="flex items-center gap-1 rounded-md bg-surface p-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSortBy(opt.value)}
                            className={chipClass(sortBy === opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    <UserRound className="h-3 w-3" />
                    Atuação
                </span>
                <select value={role} onChange={e => setRole(e.target.value)} className={selectClass} aria-label="Filtrar por atuação">
                    <option value="">Todas</option>
                    {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </label>

            <label className="flex shrink-0 items-center gap-1.5">
                <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                    <UsersRound className="h-3 w-3" />
                    Vínculo
                </span>
                <select value={memberType} onChange={e => setMemberType(e.target.value)} className={selectClass} aria-label="Filtrar por vínculo">
                    <option value="">Todos</option>
                    {MEMBER_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </label>
        </>
    )

    return (
        <div className="relative w-full">
        <div className="sm:hidden pointer-events-none absolute right-0 top-0 h-full w-10 z-10 bg-gradient-to-r from-transparent to-background" />
        <div className="flex w-full items-center gap-2 overflow-x-auto pr-10 sm:pr-0" style={{ scrollbarWidth: 'none' }}>
            <div className="flex shrink-0 items-center gap-2">
                {renderFilterControls()}
            </div>

            <div className="flex h-8 w-[220px] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground sm:w-[340px]">
                <Search className="h-4 w-4 shrink-0 text-muted" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar artista, hangul ou stage name..."
                    className="min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-[13px] text-foreground !shadow-none placeholder:text-muted focus:outline-none"
                />
                {hasActive && (
                    <button
                        onClick={clear}
                        className="flex h-7 shrink-0 items-center justify-center rounded-md bg-surface px-2 text-[11px] font-bold text-muted hover:bg-surface-hover hover:text-foreground"
                        aria-label="Limpar filtros"
                    >
                        <X className="h-3 w-3" />
                        <span className="hidden sm:inline">Limpar</span>
                    </button>
                )}
            </div>
        </div>
        </div>
    )
}
