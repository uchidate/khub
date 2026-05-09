import type { Metadata } from 'next'
import { ShoppingBag, Sparkles, Clock } from 'lucide-react'
import prisma from '@/lib/prisma'
import { LojaClient } from '@/components/ui/LojaClient'
import { LojaBanner } from '@/components/ui/LojaBanner'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { LojaCupons } from '@/components/ui/LojaCupons'
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

const CATEGORY_LABELS: Record<string, string> = {
    kpop_album: 'Álbuns K-Pop', lightstick: 'Lightsticks', kbeauty: 'K-Beauty',
    kdrama: 'K-Drama', clothing: 'Roupas', acessorios: 'Acessórios',
    photocard: 'Photocards', alimenta: 'Alimentação', outros: 'Outros',
}

async function getData() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const select = {
        id: true, name: true, price: true, originalPrice: true,
        imageUrl: true, affiliateUrl: true, store: true, category: true,
        badge: true, rating: true, soldCount: true, tags: true,
        featured: true, position: true, createdAt: true,
    } as const

    const [products, novidades] = await Promise.all([
        prisma.storeProduct.findMany({
            where: { isActive: true },
            orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
            select,
        }).catch(() => []),
        prisma.storeProduct.findMany({
            where: { isActive: true, createdAt: { gte: sevenDaysAgo } },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select,
        }).catch(() => []),
    ])

    return { products, novidades }
}

export default async function LojaPage() {
    const { products, novidades } = await getData()
    const hasProducts = products.length > 0
    // Novidades: só exibe se houver produtos que NÃO estão já em todos (evita duplicar quando há poucos)
    const showNovidades = novidades.length > 0 && novidades.length < products.length

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
                offers: {
                    '@type': 'Offer',
                    ...(p.price ? { price: p.price.replace(/[^0-9,.]/g, '').replace(',', '.'), priceCurrency: 'BRL' } : {}),
                    availability: 'https://schema.org/InStock',
                    url: p.affiliateUrl,
                },
                ...(p.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, bestRating: 5 } } : {}),
            },
        })),
    } : null

    return (
        <div className="min-h-screen bg-background pb-20">
            {jsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            )}

            <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                <Breadcrumbs items={[{ label: 'Vitrine' }]} className="mb-6" />

                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-5 h-5 text-orange-500" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Vitrine K-Pop</h1>
                        <span className="text-xs font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2.5 py-1 rounded-full">Afiliado</span>
                    </div>
                    <p className="text-sm text-muted max-w-xl">
                        K-Pop · K-Beauty · K-Drama — curadoria manual dos melhores produtos. Comprar pelo nosso link apoia o HallyuHub sem custo extra.
                    </p>
                </div>

            <div className="space-y-10">
                {/* Banner editorial */}
                <LojaBanner />
                <LojaCupons />

                {!hasProducts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Em breve — produtos selecionados chegando!</p>
                    </div>
                ) : (
                    <>
                        {/* Novidades */}
                        {showNovidades && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-orange-500" />
                                    <h2 className="text-sm font-bold text-foreground">Novidades</h2>
                                    <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">Últimos 7 dias</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {novidades.map(p => (
                                        <ShopeeCard key={p.id} {...p}
                                            rating={p.rating ?? undefined}
                                            originalPrice={p.originalPrice ?? undefined}
                                            badge={p.badge ?? undefined}
                                            soldCount={p.soldCount ?? undefined}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Destaques */}
                        {products.filter(p => p.featured).length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-4 h-4 text-orange-500" />
                                    <h2 className="text-sm font-bold text-foreground">Mais vendidos</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {products.filter(p => p.featured).slice(0, 4).map(p => (
                                        <ShopeeCard key={p.id} {...p}
                                            rating={p.rating ?? undefined}
                                            originalPrice={p.originalPrice ?? undefined}
                                            badge={p.badge ?? undefined}
                                            soldCount={p.soldCount ?? undefined}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Catálogo completo com filtros */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <h2 className="text-sm font-bold text-foreground">
                                    {Object.keys(
                                        products.reduce<Record<string, boolean>>((a, p) => ({ ...a, [p.category]: true }), {})
                                    ).map(c => CATEGORY_LABELS[c] ?? c).join(' · ')}
                                </h2>
                            </div>
                            <LojaClient products={products} />
                        </section>
                    </>
                )}
            </div>
            </div>
        </div>
    )
}
