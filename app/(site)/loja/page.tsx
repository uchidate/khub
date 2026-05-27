import type { Metadata } from 'next'
import { ArrowDownAZ, Search, ShoppingBag, Sparkles } from 'lucide-react'
import prisma from '@/lib/prisma'
import { LojaClient } from '@/components/ui/LojaClient'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { LojaCupons } from '@/components/ui/LojaCupons'
import { AffiliateNotice } from '@/components/ui/AffiliateNotice'
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
        where: { isActive: true, isHidden: false },
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


export default async function LojaPage({ searchParams }: { searchParams: Promise<{ search?: string; store?: string; category?: string; sort?: string }> }) {
    const sp = await searchParams
    const { products } = await getData()
    const hasProducts = products.length > 0
    const featuredProducts = products.filter(p => p.featured).slice(0, 5)
    const topCategories = Object.entries(
        products.reduce<Record<string, number>>((acc, product) => {
            acc[product.category] = (acc[product.category] ?? 0) + 1
            return acc
        }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5)
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

                {/* ── Banner fino ───────────────────────────────────────── */}
                <div className="border-b border-border">
                    <div className="page-wrap flex items-center justify-between gap-4 py-2.5">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="h-3.5 w-3.5 text-accent shrink-0" />
                            <h1 className="text-[13px] font-black tracking-[-0.02em]">
                                Achados para fãs<span className="text-accent">.</span>
                            </h1>
                            <span className="hidden sm:inline text-[11px] text-muted">Álbuns · Lightsticks · Photocards · K-Beauty · Moda</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted shrink-0">{products.length} produtos</span>
                    </div>
                </div>

                {/* ── Conteúdo principal ───────────────────────────────── */}
                <div className="page-wrap py-6 space-y-8">

                    <AffiliateNotice />

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
                                <div className="flex flex-wrap gap-1.5">
                                    {topCategories.map(([category, count]) => (
                                        <a key={category} href={`#categoria-${category}`}
                                            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[12px] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-accent">
                                            {formatCategory(category)}
                                            <span className="text-[10px] opacity-50">{count}</span>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {/* Escolhas da curadoria */}
                            {featuredProducts.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between border-b border-foreground pb-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-3.5 w-3.5 text-accent" />
                                            <h2 className="text-[13px] font-black uppercase tracking-[0.08em]">Escolhas da curadoria</h2>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                                        {featuredProducts.map(p => (
                                            <ShopeeCard key={p.id} {...p}
                                                placement="store_featured"
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
