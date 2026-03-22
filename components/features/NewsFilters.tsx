'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Calendar, User, Globe, Users } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { useAnalytics } from '@/hooks/useAnalytics'

export interface NewsFiltersProps {
    onFilterChange: (filters: FilterValues) => void
    artists?: Array<{ id: string; nameRomanized: string }>
    groups?: Array<{ id: string; name: string }>
    initialFilters?: FilterValues
}

export interface FilterValues {
    search?: string
    artistId?: string
    groupId?: string
    source?: string
    from?: string
    to?: string
}

const NEWS_SOURCES = [
    { value: 'soompi.com', label: 'Soompi' },
    { value: 'koreaboo.com', label: 'Koreaboo' },
    { value: 'kpopstarz.com', label: 'KpopStarz' },
    { value: 'dramabeans.com', label: 'Dramabeans' },
    { value: 'asianjunkie.com', label: 'Asian Junkie' },
]

// Fontes mostradas como pílulas de acesso rápido (mais populares)
const QUICK_SOURCE_PILLS = NEWS_SOURCES

export function NewsFilters({ onFilterChange, artists = [], groups = [], initialFilters = {} }: NewsFiltersProps) {
    const [filters, setFilters] = useState<FilterValues>(initialFilters)
    const [isExpanded, setIsExpanded] = useState(false)
    const { trackSearch } = useAnalytics()
    // Ref para disparar trackSearch apenas quando a busca está estabilizada (após debounce)
    const searchTrackedRef = useRef<string>('')
    // Ref estável para trackSearch — evita que nova referência a cada render dispare o efeito
    const trackSearchRef = useRef(trackSearch)
    trackSearchRef.current = trackSearch
    // Não disparar onFilterChange no mount — NewsList já busca ao carregar via URL
    const didMountRef = useRef(false)

    // Detectar se há filtros ativos (exceto search)
    const hasActiveFilters = !!(filters.artistId || filters.groupId || filters.source || filters.from || filters.to)

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true
            return
        }
        const timer = setTimeout(() => {
            onFilterChange(filters)
            // Rastrear busca textual após o debounce (evita spam por tecla)
            if (filters.search && filters.search.length >= 3 && filters.search !== searchTrackedRef.current) {
                searchTrackedRef.current = filters.search
                trackSearchRef.current(filters.search, 'news')
            }
        }, 500) // Debounce de 500ms

        return () => clearTimeout(timer)
    }, [filters, onFilterChange])

    const updateFilter = (key: keyof FilterValues, value: string | undefined) => {
        setFilters(prev => {
            if (!value) {
                const { [key]: _removed, ...rest } = prev
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
            <SearchInput
                value={filters.search || ''}
                onChange={v => updateFilter('search', v || undefined)}
                placeholder="Buscar notícias..."
            />

            {/* Pílulas de fonte rápida */}
            <div className="flex flex-wrap gap-2">
                {QUICK_SOURCE_PILLS.map(src => (
                    <button
                        key={src.value}
                        onClick={() => updateFilter('source', filters.source === src.value ? undefined : src.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                            filters.source === src.value
                                ? 'bg-[#ff2d78] border-[#ff2d78] text-white'
                                : 'bg-background border-border text-muted hover:text-foreground hover:border-[#ff2d78]/40'
                        }`}
                    >
                        {src.label}
                    </button>
                ))}
            </div>

            {/* Toggle Filtros Avançados */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:border-[#ff2d78]/50 hover:text-[#ff2d78] transition-all"
                >
                    <Globe className="w-4 h-4" />
                    <span>Filtros Avançados</span>
                    {hasActiveFilters && (
                        <span className="w-2 h-2 rounded-full bg-[#ff2d78]" />
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-surface border border-border rounded-xl">
                    {/* Filtro por Grupo */}
                    {groups.length > 0 && (
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
                                <Users className="w-4 h-4" />
                                Grupo
                            </label>
                            <select
                                value={filters.groupId || ''}
                                onChange={(e) => {
                                    updateFilter('groupId', e.target.value || undefined)
                                    if (e.target.value) updateFilter('artistId', undefined)
                                }}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
                            >
                                <option value="">Todos os grupos</option>
                                {groups.map(group => (
                                    <option key={group.id} value={group.id}>{group.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtro por Artista */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
                            <User className="w-4 h-4" />
                            Artista
                        </label>
                        <select
                            value={filters.artistId || ''}
                            onChange={(e) => {
                                updateFilter('artistId', e.target.value || undefined)
                                if (e.target.value) updateFilter('groupId', undefined)
                            }}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
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
                        <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
                            <Globe className="w-4 h-4" />
                            Fonte
                        </label>
                        <select
                            value={filters.source || ''}
                            onChange={(e) => updateFilter('source', e.target.value || undefined)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
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
                        <label className="flex items-center gap-2 text-sm font-medium text-muted mb-2">
                            <Calendar className="w-4 h-4" />
                            Período
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="date"
                                value={filters.from || ''}
                                onChange={(e) => updateFilter('from', e.target.value || undefined)}
                                max={filters.to || undefined}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
                            />
                            <input
                                type="date"
                                value={filters.to || ''}
                                onChange={(e) => updateFilter('to', e.target.value || undefined)}
                                min={filters.from || undefined}
                                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-[#ff2d78]/20"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Indicadores de Filtros Ativos */}
            {hasActiveFilters && !isExpanded && (
                <div className="flex flex-wrap gap-2">
                    {filters.groupId && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff2d78]/10 border border-[#ff2d78]/30 rounded-full text-xs text-[#ff2d78]">
                            <Users className="w-3 h-3" />
                            {groups.find(g => g.id === filters.groupId)?.name || 'Grupo selecionado'}
                            <button
                                onClick={() => updateFilter('groupId', undefined)}
                                aria-label="Remover filtro de grupo"
                                className="p-0.5 hover:text-[#ff2d78]/70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.artistId && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff2d78]/10 border border-[#ff2d78]/30 rounded-full text-xs text-[#ff2d78]">
                            <User className="w-3 h-3" />
                            {artists.find(a => a.id === filters.artistId)?.nameRomanized || 'Artista selecionado'}
                            <button
                                onClick={() => updateFilter('artistId', undefined)}
                                aria-label="Remover filtro de artista"
                                className="p-0.5 hover:text-[#ff2d78]/70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {filters.source && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff2d78]/10 border border-[#ff2d78]/30 rounded-full text-xs text-[#ff2d78]">
                            <Globe className="w-3 h-3" />
                            {NEWS_SOURCES.find(s => s.value === filters.source)?.label || filters.source}
                            <button
                                onClick={() => updateFilter('source', undefined)}
                                aria-label="Remover filtro de fonte"
                                className="p-0.5 hover:text-[#ff2d78]/70"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(filters.from || filters.to) && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#ff2d78]/10 border border-[#ff2d78]/30 rounded-full text-xs text-[#ff2d78]">
                            <Calendar className="w-3 h-3" />
                            {filters.from && new Date(filters.from).toLocaleDateString('pt-BR')}
                            {filters.from && filters.to && ' - '}
                            {filters.to && new Date(filters.to).toLocaleDateString('pt-BR')}
                            <button
                                onClick={() => {
                                    updateFilter('from', undefined)
                                    updateFilter('to', undefined)
                                }}
                                aria-label="Remover filtro de data"
                                className="p-0.5 hover:text-[#ff2d78]/70"
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
