import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { HomeVitrineTicker } from '@/components/home/HomeVitrineTicker'

interface Product {
    id: string
    name: string
    imageUrl: string
    affiliateUrl: string
    store: string
    category: string
    badge?: string | null
    price?: string | null
    rating?: number | null
    soldCount?: string | null
}

export function HomeLojaDestaque({ products }: { products: Product[] }) {
    if (products.length === 0) return null

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-stretch rounded-2xl overflow-hidden border border-border/50 bg-surface shadow-sm">
                {/* Label esquerda — vertical */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 bg-orange-500 self-stretch">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white [writing-mode:vertical-rl] rotate-180">
                        Shopping
                    </span>
                </div>

                {/* Ticker */}
                <div className="flex-1 min-w-0 py-3 px-2">
                    <HomeVitrineTicker products={products} />
                </div>

                {/* CTA direita — vertical */}
                <Link
                    href="/loja"
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 border-l border-border/40 hover:bg-surface-hover transition-colors group"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted group-hover:text-orange-500 transition-colors [writing-mode:vertical-rl]">
                        Ver tudo
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted group-hover:text-orange-500 transition-colors" />
                </Link>
            </div>
        </section>
    )
}
