'use client'

import { useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShopeeCard, STORE_CONFIG } from '@/components/ui/ShopeeCard'
import { ArrowDownAZ, Flame, Grid2X2, Search, SlidersHorizontal, Sparkles, Star, Store, X } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album: 'Álbuns K-Pop',
    lightstick: 'Lightsticks',
    kbeauty: 'K-Beauty',
    kdrama: 'K-Drama',
    clothing: 'Moda',
    acessorios: 'Acessórios',
    photocard: 'Photocards',
    alimenta: 'Snacks',
    outros: 'Outros',
}

const PLATFORM_FILTERS = [
    { value: '', label: 'Todas' },
    { value: 'shopee', label: 'Shopee' },
    { value: 'mercadolivre', label: 'Mercado Livre' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'magalu', label: 'Magalu' },
    { value: 'shein', label: 'Shein' },
]

type SortOption = 'curated' | 'rating' | 'featured' | 'newest' | 'name'

interface Product {
    id: string
    name: string
    description?: string | null
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
    createdAt?: Date | string
}

const SORT_OPTIONS: Array<{ value: SortOption; label: string; icon: ComponentType<{ className?: string }> }> = [
    { value: 'curated', label: 'Curadoria', icon: Sparkles },
    { value: 'featured', label: 'Destaques', icon: Flame },
    { value: 'rating', label: 'Avaliação', icon: Star },
    { value: 'newest', label: 'Novos', icon: Grid2X2 },
    { value: 'name', label: 'A-Z', icon: ArrowDownAZ },
]

function categoryLabel(category: string) {
    return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

export function LojaClient({ products }: { products: Product[] }) {
    const searchParams = useSearchParams()
    const initialSort = searchParams.get('sort') as SortOption | null
    const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '')
    const [activePlatform, setActivePlatform] = useState(searchParams.get('store') || '')
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [sort, setSort] = useState<SortOption>(
        initialSort && SORT_OPTIONS.some(option => option.value === initialSort) ? initialSort : 'curated'
    )
    const [showFilters, setShowFilters] = useState(false)

    const availablePlatforms = useMemo(() => {
        const stores = new Set(products.map(p => p.store))
        return PLATFORM_FILTERS.filter(f => f.value === '' || stores.has(f.value))
    }, [products])

    const categories = useMemo(() => {
        const counts = products
            .filter(p => !activePlatform || p.store === activePlatform)
            .reduce<Record<string, number>>((acc, product) => {
                acc[product.category] = (acc[product.category] ?? 0) + 1
                return acc
            }, {})

        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1] || categoryLabel(a[0]).localeCompare(categoryLabel(b[0]), 'pt-BR'))
            .map(([value, count]) => ({ value, count, label: categoryLabel(value) }))
    }, [products, activePlatform])

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase()
        const list = products.filter(product => {
            if (activePlatform && product.store !== activePlatform) return false
            if (activeCategory && product.category !== activeCategory) return false
            if (!query) return true

            return (
                product.name.toLowerCase().includes(query) ||
                product.description?.toLowerCase().includes(query) ||
                product.tags.some(tag => tag.toLowerCase().includes(query)) ||
                categoryLabel(product.category).toLowerCase().includes(query)
            )
        })

        return list.sort((a, b) => {
            if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0)
            if (sort === 'featured') return Number(b.featured) - Number(a.featured)
            if (sort === 'newest') return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
            if (sort === 'name') return a.name.localeCompare(b.name, 'pt-BR')
            return (Number(b.featured) - Number(a.featured)) || ((a.position ?? 999) - (b.position ?? 999)) || a.name.localeCompare(b.name, 'pt-BR')
        })
    }, [products, activePlatform, activeCategory, search, sort])

    const grouped = useMemo(() => {
        return filtered.reduce<Record<string, Product[]>>((acc, product) => {
            if (!acc[product.category]) acc[product.category] = []
            acc[product.category].push(product)
            return acc
        }, {})
    }, [filtered])

    const groupedEntries = Object.entries(grouped)
    const hasResults = filtered.length > 0
    const hasFilters = Boolean(search || activeCategory || activePlatform || sort !== 'curated')
    const clearAll = () => {
        setSearch('')
        setActiveCategory('')
        setActivePlatform('')
        setSort('curated')
    }

    return (
        <section className="scroll-mt-28" id="catalogo">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent font-bold">Catálogo completo</p>
                    <h2 className="mt-1 font-display text-[26px] font-black tracking-[-0.03em]">Encontre por fandom, loja ou categoria</h2>
                </div>
                <p className="font-mono text-[11px] text-muted">
                    {filtered.length} de {products.length} produto{products.length !== 1 ? 's' : ''}
                </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">

                {/* Sidebar */}
                <aside className="lg:sticky lg:top-[calc(var(--site-sticky-top)+1rem)] lg:self-start">
                    <div className="space-y-4 border-y border-border bg-background py-4">

                        {/* Busca */}
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar produto, grupo..."
                                className="w-full rounded-none border-border bg-background py-3 pl-9 pr-9 text-sm text-foreground transition-colors focus:border-accent"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors" aria-label="Limpar busca">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Mostrar/ocultar filtros no mobile */}
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className="flex w-full items-center justify-center gap-2 border border-border bg-background px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-foreground hover:border-accent/40 transition-colors lg:hidden"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtros
                        </button>

                        <div className={`${showFilters ? 'block' : 'hidden'} space-y-5 lg:block`}>
                            {/* Lojas */}
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted">
                                    <Store className="h-3.5 w-3.5" /> Lojas
                                </div>
                                <div className="flex flex-wrap gap-2 lg:flex-col">
                                    {availablePlatforms.map(platform => {
                                        const cfg = platform.value ? STORE_CONFIG[platform.value] : null
                                        const isActive = activePlatform === platform.value
                                        return (
                                            <button
                                                key={platform.value}
                                                onClick={() => { setActivePlatform(platform.value); setActiveCategory('') }}
                                                className={`flex items-center justify-between gap-2 border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                                    isActive
                                                        ? 'border-accent bg-accent text-white'
                                                        : 'border-border bg-background text-muted hover:border-accent/40 hover:text-foreground'
                                                }`}
                                            >
                                                <span>{platform.label}</span>
                                                {cfg && <span className={`h-2 w-2 ${cfg.bg}`} />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Categorias */}
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted">
                                    <Grid2X2 className="h-3.5 w-3.5" /> Categorias
                                </div>
                                <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto overflow-x-hidden pr-1 scrollbar-none lg:flex-col">
                                    <button
                                        onClick={() => setActiveCategory('')}
                                        className={`flex items-center justify-between border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                            !activeCategory
                                                ? 'border-accent bg-accent text-white'
                                                : 'border-border bg-background text-muted hover:border-accent/40 hover:text-foreground'
                                        }`}
                                    >
                                        <span>Todas</span>
                                        <span className="ml-2 opacity-60">{products.filter(p => !activePlatform || p.store === activePlatform).length}</span>
                                    </button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setActiveCategory(v => v === cat.value ? '' : cat.value)}
                                            className={`flex items-center justify-between gap-3 border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                                activeCategory === cat.value
                                                    ? 'border-accent bg-accent text-white'
                                                    : 'border-border bg-background text-muted hover:border-accent/40 hover:text-foreground'
                                            }`}
                                        >
                                            <span className="truncate">{cat.label}</span>
                                            <span className="opacity-60">{cat.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ordenação */}
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-muted">
                                    Ordenar por
                                </div>
                                <div className="flex flex-wrap gap-2 lg:flex-col">
                                    {SORT_OPTIONS.map(option => {
                                        const Icon = option.icon
                                        const isActive = sort === option.value
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setSort(option.value)}
                                                className={`flex items-center gap-2 border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                                    isActive
                                                        ? 'border-foreground bg-foreground text-background'
                                                        : 'border-border bg-background text-muted hover:border-accent/40 hover:text-foreground'
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                                {option.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {hasFilters && (
                            <button onClick={clearAll} className="flex w-full items-center justify-center gap-1.5 border border-border bg-background px-3 py-2.5 text-xs font-bold text-muted hover:border-accent/40 hover:text-accent transition-colors">
                                <X className="h-3.5 w-3.5" /> Limpar filtros
                            </button>
                        )}
                    </div>
                </aside>

                {/* Grid de produtos */}
                <div className="min-w-0 space-y-8">
                    {!hasResults ? (
                        <div className="flex flex-col items-center justify-center gap-3 border border-dashed border-border py-16 text-muted">
                            <Search className="h-8 w-8 opacity-25" />
                            <p className="text-sm">Nenhum produto encontrado</p>
                            <button onClick={clearAll} className="text-xs font-bold text-accent hover:underline">Limpar filtros</button>
                        </div>
                    ) : sort === 'curated' && !search && !activeCategory ? (
                        groupedEntries.map(([category, items]) => (
                            <section key={category} id={`categoria-${category}`} className="scroll-mt-28">
                                <div className="flex items-baseline justify-between border-b border-border pb-2.5 mb-4">
                                    <h3 className="text-[16px] font-black tracking-tight">{categoryLabel(category)}</h3>
                                    <span className="font-mono text-[10px] text-muted">{items.length} produto{items.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                    {items.map(product => (
                                        <ShopeeCard key={product.id} {...product}
                                            placement="store_catalog"
                                            rating={product.rating ?? undefined}
                                            badge={product.badge ?? undefined}
                                            soldCount={product.soldCount ?? undefined}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filtered.map(product => (
                                <ShopeeCard key={product.id} {...product}
                                    placement="store_catalog"
                                    rating={product.rating ?? undefined}
                                    badge={product.badge ?? undefined}
                                    soldCount={product.soldCount ?? undefined}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
