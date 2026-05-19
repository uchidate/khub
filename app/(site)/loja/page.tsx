import type { Metadata } from 'next'
import { ShoppingBag, Sparkles, ExternalLink } from 'lucide-react'
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
        orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        select: {
            id: true, name: true, description: true, price: true, originalPrice: true,
            imageUrl: true, affiliateUrl: true, store: true, category: true,
            badge: true, rating: true, soldCount: true, tags: true,
            featured: true, position: true, createdAt: true,
        },
    }).catch(() => [])
    return { products }
}

export default async function LojaPage() {
    const { products } = await getData()
    const hasProducts = products.length > 0

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
        <div className="min-h-screen bg-background pb-20">
            {jsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-6 pb-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight leading-tight">Vitrine K-Pop</h1>
                        <p className="text-xs text-muted mt-0.5">Comprar pelo link apoia o HallyuHub sem custo extra</p>
                    </div>
                </div>

                {/* Aviso de links externos */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/8 border border-orange-500/20 text-xs text-orange-400 mb-4">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Os produtos abrem em sites parceiros (Mercado Livre, Shopee, etc.). Comprar pelo nosso link apoia o HallyuHub sem custo extra para você.</span>
                </div>

            <div className="space-y-6">
                <LojaCupons />

                {!hasProducts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Em breve — produtos selecionados chegando!</p>
                    </div>
                ) : (
                    <>
                        {/* Destaques */}
                        {products.filter(p => p.featured).length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-orange-500" />
                                    <h2 className="text-sm font-bold text-foreground">Destaques</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {products.filter(p => p.featured).slice(0, 4).map(p => (
                                        <ShopeeCard key={p.id} {...p}
                                            rating={p.rating ?? undefined}
                                            badge={p.badge ?? undefined}
                                            soldCount={p.soldCount ?? undefined}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Catálogo com filtros */}
                        <LojaClient products={products} />
                    </>
                )}
            </div>
            </div>
        </div>
    )
}
