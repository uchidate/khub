'use client'

import { useState, useMemo } from 'react'
import { ShopeeCard, ShopeeSectionHeader, STORE_CONFIG } from '@/components/ui/ShopeeCard'
import { Search, X, SlidersHorizontal } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album:  'Álbuns K-Pop',
    lightstick:  'Lightsticks',
    kbeauty:     'K-Beauty',
    kdrama:      'K-Drama',
    clothing:    'Roupas',
    acessorios:  'Acessórios',
    photocard:   'Photocards',
    alimenta:    'Alimentação',
    outros:      'Outros',
}

const PLATFORM_FILTERS = [
    { value: '',             label: 'Todas as lojas' },
    { value: 'shopee',       label: 'Shopee' },
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'amazon',       label: 'Amazon' },
    { value: 'magalu',       label: 'Magalu' },
]

type SortOption = 'default' | 'rating' | 'featured'

interface Product {
    id: string
    name: string
    price?: string | null
    originalPrice?: string | null
    imageUrl: string
    affiliateUrl: string
    store: string
    category: string
    badge?: string | null
    rating?: number | null
    soldCount?: string | null
    featured?: boolean
    position?: number
    tags: string[]
}

export function LojaClient({ products }: { products: Product[] }) {
    const [activeCategory, setActiveCategory] = useState('')
    const [activePlatform, setActivePlatform] = useState('')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortOption>('default')
    const [showFilters, setShowFilters] = useState(false)

    // Só mostra plataformas que têm produtos
    const availablePlatforms = useMemo(() => {
        const stores = new Set(products.map(p => p.store))
        return PLATFORM_FILTERS.filter(f => f.value === '' || stores.has(f.value))
    }, [products])

    const categories = useMemo(() => {
        const seen = new Set<string>()
        return products
            .filter(p => !activePlatform || p.store === activePlatform)
            .map(p => p.category)
            .filter(c => !seen.has(c) && seen.add(c))
    }, [products, activePlatform])

    const filtered = useMemo(() => {
        let list = [...products]

        if (activePlatform) list = list.filter(p => p.store === activePlatform)
        if (activeCategory) list = list.filter(p => p.category === activeCategory)

        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            )
        }

        switch (sort) {
            case 'rating':   list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break
            case 'featured': list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break
            default:         list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); break
        }

        return list
    }, [products, activePlatform, activeCategory, search, sort])

    const useFlat = sort !== 'default'

    const grouped = useMemo(() => {
        if (useFlat) return null
        return filtered.reduce<Record<string, Product[]>>((acc, p) => {
            if (!acc[p.category]) acc[p.category] = []
            acc[p.category].push(p)
            return acc
        }, {})
    }, [filtered, useFlat])

    const hasResults = filtered.length > 0
    const hasFilters = search || activeCategory || activePlatform || sort !== 'default'
    const clearAll = () => { setSearch(''); setActiveCategory(''); setActivePlatform(''); setSort('default') }

    return (
        <div className="space-y-5">
            {/* Busca + botão filtros */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full text-sm bg-surface border border-border rounded-xl pl-9 pr-8 py-2.5 text-foreground focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border transition-colors ${showFilters || sort !== 'default' ? 'bg-orange-500 text-white border-orange-500' : 'bg-surface border-border text-muted hover:text-foreground hover:border-orange-400/40'}`}
                >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Filtros
                </button>
                {hasFilters && (
                    <button onClick={clearAll} className="text-xs text-muted hover:text-orange-500 transition-colors flex items-center gap-1">
                        <X className="w-3 h-3" />Limpar
                    </button>
                )}
            </div>

            {/* Painel de filtros */}
            {showFilters && (
                <div className="flex flex-wrap gap-3 p-4 bg-surface/50 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted font-medium">Ordenar:</span>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortOption)}
                            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-orange-400/50"
                        >
                            <option value="default">Padrão</option>
                            <option value="rating">Melhor avaliação</option>
                            <option value="featured">Destaque</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Filtro de plataforma — pills horizontais */}
            {availablePlatforms.length > 2 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                    {availablePlatforms.map(p => {
                        const cfg = p.value ? STORE_CONFIG[p.value] : null
                        const isActive = activePlatform === p.value
                        return (
                            <button
                                key={p.value}
                                onClick={() => { setActivePlatform(p.value); setActiveCategory('') }}
                                className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-colors border ${
                                    isActive
                                        ? `${cfg?.bg ?? 'bg-orange-500'} text-white border-transparent shadow-sm`
                                        : 'bg-surface border-border text-muted hover:text-foreground hover:border-orange-400/40'
                                }`}
                            >
                                {p.label}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Tabs de categoria */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                <button
                    onClick={() => setActiveCategory('')}
                    className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-colors ${!activeCategory ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'}`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(c => c === cat ? '' : cat)}
                        className={`flex-shrink-0 text-xs px-4 py-2 rounded-full font-semibold transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30' : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'}`}
                    >
                        {CATEGORY_LABELS[cat] ?? cat}
                    </button>
                ))}
            </div>

            {/* Resultados */}
            {!hasResults ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Nenhum produto encontrado</p>
                    <button onClick={clearAll} className="text-xs text-orange-500 hover:underline mt-1">Limpar filtros</button>
                </div>
            ) : useFlat ? (
                <div>
                    <p className="text-xs text-muted mb-4">{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {filtered.map(p => (
                            <ShopeeCard key={p.id} {...p}
                                rating={p.rating ?? undefined}
                                badge={p.badge ?? undefined}
                                soldCount={p.soldCount ?? undefined}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                Object.entries(grouped!).map(([category, items]) => (
                    <section key={category}>
                        <ShopeeSectionHeader title={CATEGORY_LABELS[category] ?? category} store={items[0]?.store} />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {items.map(p => (
                                <ShopeeCard key={p.id} {...p}
                                    rating={p.rating ?? undefined}
                                    badge={p.badge ?? undefined}
                                    soldCount={p.soldCount ?? undefined}
                                />
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}
