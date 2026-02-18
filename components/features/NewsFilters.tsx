'use client'

import { useState, useEffect } from 'react'
import { Search, X, Calendar, User, Globe } from 'lucide-react'

export interface NewsFiltersProps {
    onFilterChange: (filters: FilterValues) => void
    artists?: Array<{ id: string; nameRomanized: string }>
    initialFilters?: FilterValues
}

export interface FilterValues {
    search?: string
    artistId?: string
    source?: string
    from?: string
    to?: string
}

const NEWS_SOURCES = [
    { value: 'soompi.com', label: 'Soompi' },
    { value: 'koreaboo.com', label: 'Koreaboo' },
    { value: 'kpopstarz.com', label: 'KpopStarz' },
]

export function NewsFilters({ onFilterChange, artists = [], initialFilters = {} }: NewsFiltersProps) {
    const [filters, setFilters] = useState<FilterValues>(initialFilters)
    const [isExpanded, setIsExpanded] = useState(false)

    // Detectar se há filtros ativos (exceto search)
    const hasActiveFilters = !!(filters.artistId || filters.source || filters.from || filters.to)

    useEffect(() => {
        const timer = setTimeout(() => {
            onFilterChange(filters)
        }, 500) // Debounce de 500ms

        return () => clearTimeout(timer)
    }, [filters, onFilterChange])

    const updateFilter = (key: keyof FilterValues, value: string | undefined) => {
        setFilters(prev => {
            if (!value) {
                const { [key]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [key]: value }
        })
    }

    const clearFilters = () => {
        setFilters({})
        setIsExpanded(false)
    }

    return (
        <div className="mb-8 space-y-4">
            {/* Barra de Busca Principal */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Buscar"
                    value={filters.search || ''}
                    onChange={(e) => updateFilter('search', e.target.value || undefined)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
            </div>

            {/* Toggle Filtros Avançados */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-lg text-sm text-zinc-300 hover:border-purple-500/50 hover:text-purple-400 transition-all"
                >
                    <Globe className="w-4 h-4" />
                    <span>Filtros Avançados</span>
                    {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                    )}
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition-all"
                    >
                        <X className="w-4 h-4" />
                        <span>Limpar Filtros</span>
                    </button>
                )}
            </div>

            {/* Painel de Filtros Expandido */}
            {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-zinc-900/30 border border-white/5 rounded-xl backdrop-blur-sm">
                    {/* Filtro por Artista */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                            <User className="w-4 h-4" />
                            Artista
                        </label>
                        <select
                            value={filters.artistId || ''}
                            onChange={(e) => updateFilter('artistId', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">Todos os artistas</option>
                            {artists.map(artist => (
                                <option key={artist.id} value={artist.id}>
                                    {artist.nameRomanized}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Fonte */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                            <Globe className="w-4 h-4" />
                            Fonte
                        </label>
                        <select
                            value={filters.source || ''}
                            onChange={(e) => updateFilter('source', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">Todas as fontes</option>
                            {NEWS_SOURCES.map(source => (
                                <option key={source.value} value={source.value}>
                                    {source.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Data */}
                    <div className="md:col-span-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                            <Calendar className="w-4 h-4" />
                            Período
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.from || ''}
                                onChange={(e) => updateFilter('from', e.target.value || undefined)}
                                max={filters.to || undefined}
                                className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            />
                            <input
                                type="date"
                                value={filters.to || ''}
                                onChange={(e) => updateFilter('to', e.target.value || undefined)}
                                min={filters.from || undefined}
                                className="px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Indicadores de Filtros Ativos */}
            {hasActiveFilters && !isExpanded && (
                <div className="flex flex-wrap gap-2">
                    {filters.artistId && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                            <User className="w-3 h-3" />
                            {artists.find(a => a.id === filters.artistId)?.nameRomanized || 'Artista selecionado'}
                            <button
                                onClick={() => updateFilter('artistId', undefined)}
                                className="hover:text-purple-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.source && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                            <Globe className="w-3 h-3" />
                            {NEWS_SOURCES.find(s => s.value === filters.source)?.label || filters.source}
                            <button
                                onClick={() => updateFilter('source', undefined)}
                                className="hover:text-purple-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(filters.from || filters.to) && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-400">
                            <Calendar className="w-3 h-3" />
                            {filters.from && new Date(filters.from).toLocaleDateString('pt-BR')}
                            {filters.from && filters.to && ' - '}
                            {filters.to && new Date(filters.to).toLocaleDateString('pt-BR')}
                            <button
                                onClick={() => {
                                    updateFilter('from', undefined)
                                    updateFilter('to', undefined)
                                }}
                                className="hover:text-purple-300"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
