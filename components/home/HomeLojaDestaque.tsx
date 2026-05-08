import Link from 'next/link'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { ShoppingBag } from 'lucide-react'

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
}

export function HomeLojaDestaque({ products }: { products: Product[] }) {
    if (products.length === 0) return null

    return (
        <section className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <h2 className="text-sm font-bold text-foreground">Vitrine K-Pop</h2>
                    <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        Afiliado
                    </span>
                </div>
                <Link href="/loja" className="text-xs text-muted hover:text-orange-500 transition-colors">
                    Ver todos →
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {products.slice(0, 4).map(p => (
                    <ShopeeCard
                        key={p.id}
                        {...p}
                        rating={p.rating ?? undefined}
                        originalPrice={p.originalPrice ?? undefined}
                        badge={p.badge ?? undefined}
                        soldCount={p.soldCount ?? undefined}
                    />
                ))}
            </div>
        </section>
    )
}
