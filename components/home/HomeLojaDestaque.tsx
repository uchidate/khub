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
    rating?: number | null
    soldCount?: string | null
}

export function HomeLojaDestaque({ products }: { products: Product[] }) {
    if (products.length === 0) return null

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-stretch rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                {/* Label esquerda — vertical */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 bg-orange-500 self-stretch">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
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
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 group-hover:text-orange-500 transition-colors" style={{ writingMode: 'vertical-rl' }}>
                        Ver tudo
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </Link>
            </div>
        </section>
    )
}
