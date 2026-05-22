import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowDownAZ, ExternalLink, Search, ShieldCheck, ShoppingBag, Sparkles, Store, Tag, Truck } from 'lucide-react'
import prisma from '@/lib/prisma'
import { LojaClient } from '@/components/ui/LojaClient'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { LojaCupons } from '@/components/ui/LojaCupons'
import { JsonLd } from '@/components/seo/JsonLd'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SITE_URL } from '@/lib/constants/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Vitrine K-Pop | HallyuHub',
    description: 'Produtos K-Pop, K-Beauty e K-Drama selecionados: álbuns, lightsticks, photocards, skincare coreana e muito mais. Comprar pelo nosso link apoia o HallyuHub.',
    keywords: 'kpop produtos, lightstick, photocard, album kpop, kbeauty, skincare coreana, kdrama, comprar kpop brasil',
    alternates: { canonical: `${SITE_URL}/loja` },
    openGraph: {
        title: 'Vitrine K-Pop — HallyuHub',
        description: 'Curadoria de produtos K-Pop, K-Beauty e K-Drama. Comprar pelo nosso link apoia o site sem custo extra.',
        url: `${SITE_URL}/loja`,
        type: 'website',
    },
}

async function getData() {
    const products = await prisma.storeProduct.findMany({
        where: { isActive: true },
        orderBy: [{ featured: 'desc' }, { category: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        select: {
            id: true, name: true, description: true, price: true, originalPrice: true,
            imageUrl: true, affiliateUrl: true, store: true, category: true,
            badge: true, rating: true, soldCount: true, tags: true,
            featured: true, position: true, createdAt: true,
        },
    }).catch(() => [])
    return { products }
}

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

const STORE_LABELS: Record<string, string> = {
    shopee: 'Shopee',
    amazon: 'Amazon',
    mercadolivre: 'Mercado Livre',
    magalu: 'Magalu',
    shein: 'Shein',
    outro: 'Parceiros',
}

function formatCategory(category: string) {
    return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ')
}

function buildStats(products: Awaited<ReturnType<typeof getData>>['products']) {
    const stores = new Set(products.map(p => p.store))
    const categories = new Set(products.map(p => p.category))
    return [
        { label: 'Produtos selecionados', value: products.length.toString() },
        { label: 'Categorias ativas', value: categories.size.toString().padStart(2, '0') },
        { label: 'Lojas parceiras', value: stores.size.toString().padStart(2, '0') },
    ]
}

export default async function LojaPage({ searchParams }: { searchParams: Promise<{ search?: string; store?: string; category?: string; sort?: string }> }) {
    const sp = await searchParams
    const { products } = await getData()
    const hasProducts = products.length > 0
    const featuredProducts = products.filter(p => p.featured).slice(0, 5)
    const heroProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 3)
    const topCategories = Object.entries(
        products.reduce<Record<string, number>>((acc, product) => {
            acc[product.category] = (acc[product.category] ?? 0) + 1
            return acc
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const stats = buildStats(products)
    const categoryOptions = Object.entries(
        products.reduce<Record<string, number>>((acc, product) => {
            acc[product.category] = (acc[product.category] ?? 0) + 1
            return acc
        }, {})
    ).sort((a, b) => formatCategory(a[0]).localeCompare(formatCategory(b[0]), 'pt-BR'))
    const storeOptions = Object.entries(
        products.reduce<Record<string, number>>((acc, product) => {
            acc[product.store] = (acc[product.store] ?? 0) + 1
            return acc
        }, {})
    ).sort((a, b) => (STORE_LABELS[a[0]] ?? a[0]).localeCompare(STORE_LABELS[b[0]] ?? b[0], 'pt-BR'))

    const jsonLd = hasProducts ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Vitrine K-Pop HallyuHub',
        description: 'Produtos K-Pop, K-Beauty e K-Drama selecionados pela curadoria HallyuHub',
        url: `${SITE_URL}/loja`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p, i) => ({
            '@type': 'ListItem', position: i + 1,
            item: {
                '@type': 'Product', name: p.name, image: p.imageUrl,
                ...(p.description ? { description: p.description } : {}),
                offers: {
                    '@type': 'Offer',
                    ...(p.price ? { price: p.price.replace(/[^0-9,.]/g, '').replace(',', '.'), priceCurrency: 'BRL' } : {}),
                    availability: 'https://schema.org/InStock',
                    url: p.affiliateUrl,
                },
            },
        })),
    } : null

    return (
        <>
            {jsonLd && <JsonLd data={jsonLd} />}
            <main className="min-h-screen bg-background pb-20">
                <form action="/loja" className="page-wrap flex h-12 items-center border-b border-border/50">
                    <div className="flex w-full min-w-0 items-center gap-2">
                        <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex w-max items-center gap-2">
                                <label className="flex shrink-0 items-center gap-1.5">
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Loja</span>
                                    <select name="store" defaultValue={sp.store ?? ''} className="h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground" aria-label="Filtrar loja por plataforma">
                                        <option value="">Todas</option>
                                        {storeOptions.map(([store, count]) => (
                                            <option key={store} value={store}>{STORE_LABELS[store] ?? store} {count}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex shrink-0 items-center gap-1.5">
                                    <span className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">Categoria</span>
                                    <select name="category" defaultValue={sp.category ?? ''} className="h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground" aria-label="Filtrar loja por categoria">
                                        <option value="">Todas</option>
                                        {categoryOptions.map(([category, count]) => (
                                            <option key={category} value={category}>{formatCategory(category)} {count}</option>
                                        ))}
                                    </select>
                                </label>

                                <label className="flex shrink-0 items-center gap-1.5">
                                    <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                                        <ArrowDownAZ className="h-3 w-3" />
                                        Ordem
                                    </span>
                                    <select name="sort" defaultValue={sp.sort ?? 'curated'} className="h-8 shrink-0 !rounded-md !border-border !bg-surface !py-0 !pl-2.5 !pr-8 text-[12px] font-bold text-foreground !shadow-none focus:!border-foreground" aria-label="Ordenar loja">
                                        <option value="curated">Curadoria</option>
                                        <option value="featured">Destaques</option>
                                        <option value="rating">Avaliação</option>
                                        <option value="newest">Novos</option>
                                        <option value="name">A-Z</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <label className="flex h-8 w-[138px] shrink-0 items-center gap-2 rounded-md border border-border bg-background px-2.5 transition-colors focus-within:border-foreground sm:w-[280px]">
                            <Search className="h-4 w-4 shrink-0 text-muted" />
                            <input
                                name="search"
                                type="text"
                                defaultValue={sp.search ?? ''}
                                placeholder="Buscar..."
                                className="min-w-0 flex-1 !border-0 !bg-transparent !p-0 text-[13px] text-foreground !shadow-none placeholder:text-muted focus:outline-none"
                            />
                        </label>

                        <button className="h-8 shrink-0 rounded-md bg-foreground px-3 text-[12px] font-bold text-background transition-opacity hover:opacity-85" type="submit">
                            OK
                        </button>
                    </div>
                </form>

                <div className="page-wrap border-b border-border/50 py-2">
                    <Breadcrumbs items={[{ label: 'Loja' }]} />
                </div>

                {/* ── Hero: texto + mosaico de produtos ────────────────── */}
                <div className="page-wrap border-b border-foreground py-5">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-start">

                            {/* Texto */}
                            <div className="flex min-w-0 flex-col justify-start">
                                <h1 className="mt-1 max-w-[760px] font-display text-[28px] font-black leading-[0.96] tracking-[-0.04em] sm:text-[32px] lg:text-[36px]">
                                    Achados K-pop organizados para comprar sem garimpo infinito.
                                </h1>
                                <p className="mt-3 max-w-[620px] text-sm leading-relaxed text-muted">
                                    Uma vitrine editorial de álbuns, lightsticks, photocards, K-beauty, moda e itens de K-drama com filtros por loja, categoria e curadoria.
                                </p>

                                <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
                                    {stats.map(stat => (
                                        <div key={stat.label} className="border-l-2 border-foreground pl-3">
                                            <p className="font-display text-[22px] font-black leading-none">{stat.value}</p>
                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted leading-tight">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2 font-mono text-[11px] text-muted">
                                    <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                                        Curadoria manual
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2">
                                        <Store className="h-3.5 w-3.5 text-accent" />
                                        Múltiplas lojas
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 border border-border bg-background px-3 py-2">
                                        <Truck className="h-3.5 w-3.5 text-accent" />
                                        Links externos
                                    </span>
                                </div>
                            </div>

                            {/* Mosaico de produtos */}
                            <div className="relative min-h-[320px] overflow-hidden border border-border bg-background p-3">
                                {heroProducts.length > 0 ? (
                                    <div className="grid h-full min-h-[320px] grid-cols-5 grid-rows-4 gap-3">
                                        {heroProducts[0] && (
                                            <a href={heroProducts[0].affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                                                className="group relative col-span-3 row-span-4 overflow-hidden bg-surface">
                                                <Image src={heroProducts[0].imageUrl} alt={heroProducts[0].name} fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" unoptimized priority />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                                                    <p className="line-clamp-2 text-sm font-black leading-tight text-white">{heroProducts[0].name}</p>
                                                    <p className="mt-1 font-mono text-[10px] text-white/70">{STORE_LABELS[heroProducts[0].store] ?? heroProducts[0].store}</p>
                                                </div>
                                            </a>
                                        )}
                                        {heroProducts.slice(1, 3).map(product => (
                                            <a key={product.id} href={product.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                                                className="group relative col-span-2 row-span-2 overflow-hidden bg-surface">
                                                <Image src={product.imageUrl} alt={product.name} fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" unoptimized />
                                                {product.badge && (
                                                    <span className="absolute left-2 top-2 bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-white">
                                                        {product.badge}
                                                    </span>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-full min-h-[320px] items-center justify-center bg-surface text-muted">
                                        <ShoppingBag className="h-12 w-12 opacity-25" />
                                    </div>
                                )}
                            </div>
                        </div>
                </div>

                {/* ── Conteúdo principal ───────────────────────────────── */}
                <div className="page-wrap py-8 space-y-10">

                    {/* Aviso afiliados */}
                    <div className="flex items-start gap-2 border border-border bg-surface px-4 py-3 text-xs leading-5 text-muted">
                        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                        <span>Os produtos abrem em sites parceiros. Comprar pelo nosso link apoia o HallyuHub sem custo extra para você.</span>
                    </div>

                    <LojaCupons />

                    {!hasProducts ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                            <ShoppingBag className="h-12 w-12 opacity-20" />
                            <p className="text-sm">Em breve: produtos selecionados chegando.</p>
                        </div>
                    ) : (
                        <>
                            {/* Departamentos */}
                            {topCategories.length > 0 && (
                                <section>
                                    <div className="flex items-baseline justify-between border-b border-foreground pb-3 mb-5">
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-accent" />
                                            <h2 className="text-[18px] font-black tracking-[-0.03em]">Departamentos</h2>
                                        </div>
                                        <span className="font-mono text-[11px] text-muted">{topCategories.length} categorias ativas</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                        {topCategories.map(([category, count]) => (
                                            <a key={category} href={`#categoria-${category}`}
                                                className="border border-border bg-surface px-4 py-4 transition-colors hover:border-accent/40 hover:bg-surface-hover">
                                                <p className="text-sm font-black text-foreground">{formatCategory(category)}</p>
                                                <p className="mt-1 font-mono text-[10px] text-muted">{count} produto{count !== 1 ? 's' : ''}</p>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Escolhas da curadoria */}
                            {featuredProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between border-b border-foreground pb-3 mb-5">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-accent" />
                                            <h2 className="text-[18px] font-black tracking-[-0.03em]">Escolhas da curadoria</h2>
                                        </div>
                                        <span className="font-mono text-[11px] text-muted hidden sm:inline">itens com maior apelo para fãs</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                        {featuredProducts.map(p => (
                                            <ShopeeCard key={p.id} {...p}
                                                rating={p.rating ?? undefined}
                                                badge={p.badge ?? undefined}
                                                soldCount={p.soldCount ?? undefined}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            <LojaClient products={products} />
                        </>
                    )}
                </div>

                <ScrollToTop />
            </main>
        </>
    )
}
