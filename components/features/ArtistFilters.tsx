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
    { value: 'Cantor', label: '🎤 Cantores' },
    { value: 'Ator', label: '🎬 Atores' },
    { value: 'Dançarino', label: '💃 Dançarinos' },
    { value: 'Rapper', label: '🎵 Rappers' },
    { value: 'Modelo', label: '📸 Modelos' },
]

const SORT_OPTIONS = [
    { value: 'trending', label: 'Mais Populares' },
    { value: 'name', label: 'Nome (A-Z)' },
    { value: 'newest', label: 'Mais Recentes' },
]

const MEMBER_TYPE_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'group', label: '🎶 Grupo' },
    { value: 'solo', label: '🎤 Solo' },
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

    // Carregar grupos e agências para os filtros
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

    return (
        <div className="mb-10 space-y-4">
            {/* Barra de Busca + Toggle rápido */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-4 pr-12 py-4 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    {search ? (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    ) : (
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
                    )}
                </div>

                {/* Quick: Solo / Grupo */}
                <div className="flex gap-1 p-1 bg-zinc-900/50 border border-white/10 rounded-xl">
                    {MEMBER_TYPE_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setMemberType(opt.value)}
                            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                                memberType === opt.value
                                    ? 'bg-purple-600 text-white'
                                    : 'text-zinc-400 hover:text-white'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold transition-all ${
                        showFilters || hasActiveFilters
                            ? 'bg-purple-600 text-white'
                            : 'bg-zinc-900/50 border border-white/10 text-zinc-300 hover:border-purple-500/50'
                    }`}
                >
                    <SlidersHorizontal className="w-5 h-5" />
                    <span className="hidden sm:inline">Filtros</span>
                    {hasActiveFilters && (
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                </button>
            </div>

            {/* Painel de Filtros Expandido */}
            {showFilters && (
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/10 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Filtro de Tipo */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">
                                Tipo de Artista
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setRole(option.value)}
                                        className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${
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

                        {/* Filtro de Grupo */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">
                                Grupo Musical
                            </label>
                            <select
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                            >
                                <option value="">Todos os grupos</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                            {groupId && (
                                <button
                                    onClick={() => setGroupId('')}
                                    className="mt-2 text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <X className="w-3 h-3" /> Limpar grupo
                                </button>
                            )}
                        </div>

                        {/* Filtro de Agência */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">
                                Agência
                            </label>
                            <select
                                value={agencyId}
                                onChange={(e) => setAgencyId(e.target.value)}
                                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                            >
                                <option value="">Todas as agências</option>
                                {agencies.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                            {agencyId && (
                                <button
                                    onClick={() => setAgencyId('')}
                                    className="mt-2 text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <X className="w-3 h-3" /> Limpar agência
                                </button>
                            )}
                        </div>

                        {/* Ordenação */}
                        <div>
                            <label className="block text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3">
                                Ordenar Por
                            </label>
                            <div className="space-y-2">
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSortBy(option.value)}
                                        className={`w-full px-4 py-3 rounded-lg text-sm font-bold text-left transition-all ${
                                            sortBy === option.value
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-black/40 text-zinc-400 hover:bg-black/60 hover:text-white border border-white/5'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg font-bold transition-all text-sm uppercase tracking-wider"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Tags de Filtros Ativos */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Filtros ativos:</span>
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
                    {sortBy !== 'trending' && (
                        <span className="px-3 py-1 bg-zinc-700/50 text-zinc-300 text-xs font-bold rounded-full">
                            {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
