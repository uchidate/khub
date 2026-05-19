'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
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
    initialFilters?: ArtistFilterValues
    /** hero=true: overlay translúcido sem sticky, para uso dentro do card hero */
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

export function ArtistFilters({ initialFilters = {}, hero = false }: ArtistFiltersProps) {
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

    if (hero) {
        return (
            <div className="bg-white dark:bg-gray-900 py-3 px-3 sm:px-4 space-y-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                <div className="relative">
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar artistas..."
                        className="w-full px-4 pr-10 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-pink-400 transition-all"
                    />
                    {search
                        ? <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
                        : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    }
                </div>
                <div className="flex items-center gap-1">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-all ${
                                sortBy === opt.value
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                {hasActive && (
                    <button onClick={clear} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="Limpar filtros">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="sticky top-[calc(var(--site-sticky-top)+0.75rem)] z-20 mb-6 rounded-2xl border border-violet/20 bg-white p-3 shadow-[0_12px_30px_rgba(18,15,21,0.10)] dark:bg-background sm:p-4">
            <div className="flex items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, hangul ou stage name..." className="flex-1" />
                {hasActive && (
                    <button onClick={clear} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-violet/40 hover:text-foreground" title="Limpar filtros" aria-label="Limpar filtros">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
            <div className="mt-3 flex items-start gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-violet/20 bg-surface-media px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-violet">
                    <SlidersHorizontal className="h-3 w-3" />
                    Filtros
                </div>
                <div className="flex shrink-0 items-center gap-1">
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
                <div className="h-7 w-px shrink-0 bg-border" />
                <div className="flex shrink-0 items-center gap-1">
                    {ROLE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setRole(role === opt.value ? '' : opt.value)}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                role === opt.value
                                    ? 'bg-violet text-white'
                                    : 'bg-surface text-muted hover:bg-surface-media hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
                <div className="h-7 w-px shrink-0 bg-border" />
                <div className="flex shrink-0 items-center gap-1">
                    {MEMBER_TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMemberType(memberType === opt.value ? '' : opt.value)}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                memberType === opt.value
                                    ? 'bg-violet text-white'
                                    : 'bg-surface text-muted hover:bg-surface-media hover:text-foreground'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
