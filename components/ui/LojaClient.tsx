'use client'

import { useState, useMemo } from 'react'
import { ShopeeCard, ShopeeSectionHeader } from '@/components/ui/ShopeeCard'
import { Search, X } from 'lucide-react'

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
    tags: string[]
}

export function LojaClient({ products }: { products: Product[] }) {
    const [activeCategory, setActiveCategory] = useState('')
    const [search, setSearch] = useState('')

    const categories = useMemo(() => {
        const seen = new Set<string>()
        return products.map(p => p.category).filter(c => !seen.has(c) && seen.add(c))
    }, [products])

    const filtered = useMemo(() => {
        let list = products
        if (activeCategory) list = list.filter(p => p.category === activeCategory)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            )
        }
        return list
    }, [products, activeCategory, search])

    const grouped = filtered.reduce<Record<string, Product[]>>((acc, p) => {
        if (!acc[p.category]) acc[p.category] = []
        acc[p.category].push(p)
        return acc
    }, {})

    const hasResults = filtered.length > 0

    return (
        <div className="space-y-8">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Busca */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar produtos..."
                        className="w-full text-sm bg-surface border border-border rounded-xl pl-9 pr-8 py-2 text-foreground focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 transition-colors"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Tabs de categoria */}
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setActiveCategory('')}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                            !activeCategory
                                ? 'bg-orange-500 text-white'
                                : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'
                        }`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(c => c === cat ? '' : cat)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                activeCategory === cat
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-surface border border-border text-muted hover:text-foreground hover:border-orange-400/40'
                            }`}
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
                    <p className="text-sm">Nenhum produto encontrado para &ldquo;{search}&rdquo;</p>
                    <button onClick={() => { setSearch(''); setActiveCategory('') }} className="text-xs text-orange-500 hover:underline mt-1">
                        Limpar filtros
                    </button>
                </div>
            ) : (
                Object.entries(grouped).map(([category, items]) => (
                    <section key={category}>
                        <ShopeeSectionHeader
                            title={CATEGORY_LABELS[category] ?? category}
                            store={items[0]?.store}
                        />
                        <div className={`grid gap-3 ${items.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                            {items.map(p => (
                                <ShopeeCard
                                    key={p.id}
                                    {...p}
                                    affiliateUrl={p.affiliateUrl}
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
