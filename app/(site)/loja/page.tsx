import type { Metadata } from 'next'
import Image from 'next/image'
import { ExternalLink, ShieldCheck, ShoppingBag, Sparkles, Store, Tag, Truck } from 'lucide-react'
import prisma from '@/lib/prisma'
import { LojaClient } from '@/components/ui/LojaClient'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { LojaCupons } from '@/components/ui/LojaCupons'
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

export default async function LojaPage() {
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

    const jsonLd = hasProducts ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Vitrine K-Pop HallyuHub',
        description: 'Produtos K-Pop, K-Beauty e K-Drama selecionados pela curadoria HallyuHub',
        url: `${SITE_URL}/loja`,
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
                '@type': 'Product',
                name: p.name,
                image: p.imageUrl,
                ...(p.description ? { description: p.description } : {}),
                offers: {
                    '@type': 'Offer',
                    ...(p.price ? { price: p.price.replace(/[^0-9,.]/g, '').replace(',', '.'), priceCurrency: 'BRL' } : {}),
                    availability: 'https://schema.org/InStock',
                    url: p.affiliateUrl,
                    shippingDetails: {
                        '@type': 'OfferShippingDetails',
                        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'BRL' },
                        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'BR' },
                        deliveryTime: { '@type': 'ShippingDeliveryTime', businessDays: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'] }, cutoffTime: '17:00-03:00', handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' }, transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 15, unitCode: 'DAY' } },
                    },
                    hasMerchantReturnPolicy: {
                        '@type': 'MerchantReturnPolicy',
                        applicableCountry: 'BR',
                        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
                        merchantReturnDays: 7,
                        returnMethod: 'https://schema.org/ReturnByMail',
                        returnFees: 'https://schema.org/FreeReturn',
                    },
                },
            },
        })),
    } : null

    return (
        <main className="min-h-screen bg-background pb-20">
            {jsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            )}

            <section className="border-b border-border bg-[linear-gradient(135deg,var(--color-bg)_0%,var(--color-surface-editorial)_48%,var(--color-surface-media)_100%)]">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_460px] lg:px-12 lg:py-12">
                    <div className="flex min-w-0 flex-col justify-center">
                        <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-accent">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Shopping HallyuHub
                        </div>
                        <h1 className="max-w-3xl text-4xl font-black leading-[0.96] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                            Achados K-pop organizados para comprar sem garimpo infinito.
                        </h1>
                        <p className="mt-5 max-w-2xl text-sm leading-6 text-foreground-subtle sm:text-base">
                            Uma vitrine editorial de álbuns, lightsticks, photocards, K-beauty, moda e itens de K-drama com filtros por loja, categoria e curadoria.
                        </p>

                        <div className="mt-7 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
                            {stats.map(stat => (
                                <div key={stat.label} className="border-l border-border-strong pl-3">
                                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                                    <p className="mt-1 text-[11px] font-semibold leading-tight text-muted">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-7 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2">
                                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                                Curadoria manual
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2">
                                <Store className="h-3.5 w-3.5 text-accent" />
                                Múltiplas lojas
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-2">
                                <Truck className="h-3.5 w-3.5 text-accent" />
                                Links externos
                            </span>
                        </div>
                    </div>

                    <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-border bg-background/65 p-3 shadow-xl shadow-black/5">
                        {heroProducts.length > 0 ? (
                            <div className="grid h-full min-h-[320px] grid-cols-5 grid-rows-4 gap-3">
                                {heroProducts[0] && (
                                    <a href={heroProducts[0].affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="group relative col-span-3 row-span-4 overflow-hidden rounded-3xl bg-surface">
                                        <Image src={heroProducts[0].imageUrl} alt={heroProducts[0].name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized priority />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                                            <p className="line-clamp-2 text-sm font-black leading-tight text-white">{heroProducts[0].name}</p>
                                            <p className="mt-1 text-xs font-semibold text-white/70">{STORE_LABELS[heroProducts[0].store] ?? heroProducts[0].store}</p>
                                        </div>
                                    </a>
                                )}
                                {heroProducts.slice(1, 3).map(product => (
                                    <a key={product.id} href={product.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="group relative col-span-2 row-span-2 overflow-hidden rounded-2xl bg-surface">
                                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                        {product.badge && (
                                            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
                                                {product.badge}
                                            </span>
                                        )}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl bg-surface text-muted">
                                <ShoppingBag className="h-12 w-12 opacity-25" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12">
                <div className="mb-8 flex items-start gap-2 rounded-2xl border border-border bg-surface/70 px-4 py-3 text-xs leading-5 text-muted">
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span>Os produtos abrem em sites parceiros. Comprar pelo nosso link apoia o HallyuHub sem custo extra para você.</span>
                </div>

                <div className="space-y-10">
                    <LojaCupons />

                    {!hasProducts ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
                            <ShoppingBag className="h-12 w-12 opacity-20" />
                            <p className="text-sm">Em breve: produtos selecionados chegando.</p>
                        </div>
                    ) : (
                        <>
                            {topCategories.length > 0 && (
                                <section>
                                    <div className="mb-4 flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-accent" />
                                        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Departamentos em destaque</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                                        {topCategories.map(([category, count]) => (
                                            <a key={category} href={`#categoria-${category}`} className="rounded-2xl border border-border bg-surface px-4 py-4 transition-colors hover:border-accent/40 hover:bg-surface-hover">
                                                <p className="text-sm font-black text-foreground">{formatCategory(category)}</p>
                                                <p className="mt-1 text-xs text-muted">{count} produto{count !== 1 ? 's' : ''}</p>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {featuredProducts.length > 0 && (
                                <section>
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-accent" />
                                            <h2 className="text-sm font-black uppercase tracking-[0.14em] text-foreground">Escolhas da curadoria</h2>
                                        </div>
                                        <span className="hidden text-xs font-semibold text-muted sm:inline">Itens com maior apelo para fãs</span>
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
            </div>
        </main>
    )
}
