import Link from 'next/link'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
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
        <section className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                            <ShoppingBag className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-accent">
                                <Sparkles className="h-3.5 w-3.5" />
                                Vitrine
                            </p>
                            <p className="truncate text-sm font-bold text-foreground">Achados K-pop selecionados</p>
                        </div>
                    </div>
                    <Link
                        href="/loja"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-black text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                    >
                        Ver loja
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="px-3 py-3">
                    <HomeVitrineTicker products={products} />
                </div>
            </div>
        </section>
    )
}
