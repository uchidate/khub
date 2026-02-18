'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export interface ArtistFilterValues {
    search?: string
    role?: string
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
    { value: 'name', label: 'Nome (A-Z)' },
    { value: 'trending', label: 'Mais Populares' },
    { value: 'newest', label: 'Mais Recentes' },
]

export function ArtistFilters({ onFilterChange, initialFilters = {} }: ArtistFiltersProps) {
    const [search, setSearch] = useState(initialFilters.search || '')
    const [role, setRole] = useState(initialFilters.role || '')
    const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'trending')
    const [showFilters, setShowFilters] = useState(false)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            applyFilters()
        }, 500)

        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        applyFilters()
    }, [role, sortBy])

    const applyFilters = () => {
        onFilterChange({
            search: search || undefined,
            role: role || undefined,
            sortBy,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setRole('')
        setSortBy('trending')
        onFilterChange({
            sortBy: 'trending',
        })
    }

    const hasActiveFilters = search || role || sortBy !== 'trending'

    return (
        <div className="mb-10 space-y-4">
            {/* Barra de Busca Principal */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* Filtro de Ordenação */}
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

                    {/* Limpar Filtros */}
                    {hasActiveFilters && (
                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button
                                onClick={clearFilters}
                                className="px-6 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-wider"
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
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Filtros ativos:
                    </span>
                    {search && (
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            Busca: "{search}"
                            <button onClick={() => setSearch('')} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {role && (
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold rounded-full flex items-center gap-2">
                            {ROLES.find(r => r.value === role)?.label}
                            <button onClick={() => setRole('')} className="hover:text-white">
                                <X className="w-3 h-3" />
                            </button>
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
