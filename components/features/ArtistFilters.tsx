'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

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
    { value: '', label: 'Todos os Tipos' },
    { value: 'CANTOR', label: '🎤 Cantores' },
    { value: 'ATOR', label: '🎬 Atores' },
    { value: 'DANÇARINO', label: '💃 Dançarinos' },
    { value: 'RAPPER', label: '🎵 Rappers' },
    { value: 'MODELO', label: '📸 Modelos' },
]

const SORT_OPTIONS = [
    { value: 'trending', label: 'Populares' },
    { value: 'name', label: 'A-Z' },
    { value: 'newest', label: 'Recentes' },
]

const MEMBER_TYPE_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'group', label: 'Grupo' },
    { value: 'solo', label: 'Solo' },
]

export function ArtistFilters({ onFilterChange, initialFilters = {} }: ArtistFiltersProps) {
    const [search, setSearch] = useState(initialFilters.search || '')
    const [role, setRole] = useState(initialFilters.role || '')
    const [groupId, setGroupId] = useState(initialFilters.groupId || '')
    const [agencyId, setAgencyId] = useState(initialFilters.agencyId || '')
    const [memberType, setMemberType] = useState(initialFilters.memberType || '')
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'trending')
    const [showFilters, setShowFilters] = useState(false)
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
    const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        fetch('/api/groups/list')
            .then(r => r.json())
            .then(data => setGroups(data.groups ?? []))
            .catch(() => {})
        fetch('/api/agencies/list')
            .then(r => r.json())
            .then(data => setAgencies(data.agencies ?? []))
            .catch(() => {})
    }, [])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters()
        }, 500)
        return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    useEffect(() => {
        applyFilters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, groupId, agencyId, memberType, sortBy])

    const applyFilters = () => {
        onFilterChange({
            search: search || undefined,
            role: role || undefined,
            groupId: groupId || undefined,
            agencyId: agencyId || undefined,
            memberType: memberType || undefined,
            sortBy,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setRole('')
        setGroupId('')
        setAgencyId('')
        setMemberType('')
        setSortBy('trending')
        onFilterChange({ sortBy: 'trending' })
    }

    const hasActiveFilters = !!(search || role || groupId || agencyId || memberType || sortBy !== 'trending')
    const hasAdvancedFilters = !!(role || groupId || agencyId)

    return (
        <div className="mb-8 space-y-3">
            {/* Row 1: Search + Filtros toggle */}
            <div className="flex gap-2 min-w-0">
                <div className="flex-1 relative min-w-0">
                    <input
                        type="text"
                        placeholder="Buscar por nome"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 pr-10 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all text-base md:text-sm"
                    />
                    {search ? (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    ) : (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    )}
                </div>

                {/* Filtros avançados toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${
                        showFilters || hasAdvancedFilters
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:border-purple-500/50 hover:text-white'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    {hasAdvancedFilters && (
                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                </button>
            </div>

            {/* Row 2: Solo/Grupo + Sort + Limpar */}
            <div className="flex gap-2 min-w-0 overflow-x-auto">
                {/* Solo / Grupo toggle */}
                <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl flex-shrink-0">
                    {MEMBER_TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMemberType(opt.value)}
                            className={`px-2.5 py-2 md:px-4 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                memberType === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl flex-shrink-0">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setSortBy(opt.value)}
                            className={`px-2.5 py-2 md:px-4 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                sortBy === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors flex-shrink-0 px-2"
                    >
                        <X className="w-3 h-3" />
                        Limpar
                    </button>
                )}
            </div>

            {/* Filtros avançados — expandível */}
            {showFilters && (
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Tipo */}
                        <div>
                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">
                                Tipo
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {ROLES.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setRole(option.value)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            role === option.value
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-black/40 text-zinc-400 hover:bg-black/60 hover:text-white border border-white/5'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grupo */}
                        <div>
                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">
                                Grupo Musical
                            </label>
                            <select
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                            >
                                <option value="">Todos os grupos</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Agência */}
                        <div>
                            <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">
                                Agência
                            </label>
                            <select
                                value={agencyId}
                                onChange={(e) => setAgencyId(e.target.value)}
                                className="w-full px-3 py-2.5 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                            >
                                <option value="">Todas as agências</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Tags de filtros ativos */}
            {(search || role || groupId || agencyId || memberType) && (
                <div className="flex flex-wrap items-center gap-2">
                    {search && (
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            &quot;{search}&quot;
                            <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {role && (
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            {ROLES.find(r => r.value === role)?.label}
                            <button onClick={() => setRole('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {groupId && (
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            🎶 {groups.find(g => g.id === groupId)?.name ?? '...'}
                            <button onClick={() => setGroupId('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {agencyId && (
                        <span className="px-3 py-1 bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            🏢 {agencies.find(a => a.id === agencyId)?.name ?? '...'}
                            <button onClick={() => setAgencyId('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                    {memberType && (
                        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-300 text-xs font-bold rounded-full flex items-center gap-2">
                            {MEMBER_TYPE_OPTIONS.find(m => m.value === memberType)?.label}
                            <button onClick={() => setMemberType('')}><X className="w-3 h-3" /></button>
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
