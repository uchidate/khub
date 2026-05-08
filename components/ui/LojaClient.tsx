'use client'

import { useState, useMemo } from 'react'
import { ShopeeCard, ShopeeSectionHeader } from '@/components/ui/ShopeeCard'
import { Search, X, ArrowUpDown } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album:   'Álbuns K-Pop',
    lightstick:   'Lightsticks',
    kbeauty:      'K-Beauty',
    kdrama:       'K-Drama',
    clothing:     'Roupas',
    acessorios:   'Acessórios',
    photocard:    'Photocards',
    outros:       'Outros',
}

const PRICE_RANGES = [
    { label: 'Até R$50',    min: 0,   max: 50 },
    { label: 'R$50–150',    min: 50,  max: 150 },
    { label: 'R$150–300',   min: 150, max: 300 },
    { label: 'Acima R$300', min: 300, max: Infinity },
]

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating' | 'featured'

interface Product {
    id: string
    name: string
    price: string
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

function parsePrice(priceStr: string): number {
    return parseFloat(priceStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0
}

export function LojaClient({ products }: { products: Product[] }) {
    const [activeCategory, setActiveCategory] = useState('')
    const [search, setSearch] = useState('')
    const [sort, setSort] = useState<SortOption>('default')
    const [priceRange, setPriceRange] = useState(-1) // índice em PRICE_RANGES, -1 = todos

    const categories = useMemo(() => {
        const seen = new Set<string>()
        return products.map(p => p.category).filter(c => !seen.has(c) && seen.add(c))
    }, [products])

    const filtered = useMemo(() => {
        let list = [...products]

        if (activeCategory) list = list.filter(p => p.category === activeCategory)

        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            )
        }

        if (priceRange >= 0) {
            const { min, max } = PRICE_RANGES[priceRange]
            list = list.filter(p => {
                const v = parsePrice(p.price)
                return v >= min && v <= max
            })
        }

        switch (sort) {
            case 'price_asc':  list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break
            case 'price_desc': list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break
            case 'rating':     list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break
            case 'featured':   list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break
            default:           list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)); break
        }

        return list
    }, [products, activeCategory, search, sort, priceRange])

    // Quando ordenação está ativa, mostra tudo em lista plana (sem agrupamento)
    const useFlat = sort !== 'default' || priceRange >= 0

    const grouped = useMemo(() => {
        if (useFlat) return null
        return filtered.reduce<Record<string, Product[]>>((acc, p) => {
            if (!acc[p.category]) acc[p.category] = []
            acc[p.category].push(p)
            return acc
        }, {})
    }, [filtered, useFlat])

    const hasResults = filtered.length > 0

    const clearAll = () => { setSearch(''); setActiveCategory(''); setSort('default'); setPriceRange(-1) }
    const hasFilters = search || activeCategory || sort !== 'default' || priceRange >= 0

    return (
        <div className="space-y-6">
            {/* Barra de controles */}
            <div className="flex flex-col gap-3">
                {/* Linha 1: busca + ordenação + preço */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar produtos..."
                            className="w-full text-sm bg-surface border border-border rounded-xl pl-9 pr-8 py-2 text-foreground focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 transition-colors"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortOption)}
                            className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-orange-400/50"
                        >
                            <option value="default">Ordenar por padrão</option>
                            <option value="price_asc">Menor preço</option>
                            <option value="price_desc">Maior preço</option>
                            <option value="rating">Melhor avaliação</option>
                            <option value="featured">Destaque</option>
                        </select>
                    </div>

                    <select
                        value={priceRange}
                        onChange={e => setPriceRange(Number(e.target.value))}
                        className="text-xs bg-surface border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:border-orange-400/50"
                    >
                        <option value={-1}>Todos os preços</option>
                        {PRICE_RANGES.map((r, i) => (
                            <option key={i} value={i}>{r.label}</option>
                        ))}
                    </select>

                    {hasFilters && (
                        <button onClick={clearAll} className="text-xs text-orange-500 hover:underline flex items-center gap-1">
                            <X className="w-3 h-3" />Limpar
                        </button>
                    )}
                </div>

                {/* Linha 2: tabs de categoria */}
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setActiveCategory('')}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!activeCategory ? 'bg-orange-500 text-white' : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'}`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(c => c === cat ? '' : cat)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'}`}
                        >
                            {CATEGORY_LABELS[cat] ?? cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resultados */}
            {!hasResults ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Nenhum produto encontrado</p>
                    <button onClick={clearAll} className="text-xs text-orange-500 hover:underline mt-1">Limpar filtros</button>
                </div>
            ) : useFlat ? (
                // Vista plana quando ordenação/filtro de preço está ativo
                <div>
                    <p className="text-xs text-muted mb-4">{filtered.length} produto{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {filtered.map(p => (
                            <ShopeeCard key={p.id} {...p}
                                rating={p.rating ?? undefined}
                                originalPrice={p.originalPrice ?? undefined}
                                badge={p.badge ?? undefined}
                                soldCount={p.soldCount ?? undefined}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                // Vista agrupada por categoria (padrão)
                Object.entries(grouped!).map(([category, items]) => (
                    <section key={category}>
                        <ShopeeSectionHeader title={CATEGORY_LABELS[category] ?? category} store={items[0]?.store} />
                        <div className={`grid gap-3 ${items.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                            {items.map(p => (
                                <ShopeeCard key={p.id} {...p}
                                    rating={p.rating ?? undefined}
                                    originalPrice={p.originalPrice ?? undefined}
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
