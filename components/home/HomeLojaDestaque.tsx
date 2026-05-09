import Link from 'next/link'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { LojaCupons } from '@/components/ui/LojaCupons'
import { ShoppingBag, ArrowRight } from 'lucide-react'

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
        <section className="max-w-7xl mx-auto px-4 py-6">
            {/* Container com fundo e borda */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-500/5 via-surface to-surface border border-orange-500/10 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-500/10">
                            <ShoppingBag className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black text-foreground">Vitrine K-Pop</h2>
                                <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">
                                    Afiliado
                                </span>
                            </div>
                            <p className="text-[11px] text-muted">K-Pop · K-Beauty · K-Drama</p>
                        </div>
                    </div>
                    <Link
                        href="/loja"
                        className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors group"
                    >
                        Ver loja
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* Grid de produtos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {products.slice(0, 4).map(p => (
                        <ShopeeCard
                            key={p.id}
                            {...p}
                            rating={p.rating ?? undefined}
                            badge={p.badge ?? undefined}
                            soldCount={p.soldCount ?? undefined}
                        />
                    ))}
                </div>

                {/* Cupons do dia */}
                <LojaCupons compact />

                {/* Footer CTA */}
                <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-center">
                    <Link
                        href="/loja"
                        className="flex items-center gap-2 text-xs text-muted hover:text-orange-500 transition-colors"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Comprar pelo nosso link apoia o HallyuHub sem custo extra
                        <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </section>
    )
}
