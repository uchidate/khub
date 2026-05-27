import { ShoppingBag } from 'lucide-react'
import { HomeVitrineTicker } from '@/components/home/HomeVitrineTicker'
import { SectionTitleBar } from '@/components/ui/SectionTitleBar'
import { AffiliateNotice } from '@/components/ui/AffiliateNotice'
import type { AffiliatePlacement } from '@/lib/store/affiliate-placements'

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

export function HomeLojaDestaque({ products, placement = 'home_store' }: { products: Product[]; placement?: AffiliatePlacement }) {
    if (products.length === 0) return null

    return (
        <section className="mx-auto max-w-[1440px] border-t border-border px-4 py-6 sm:px-6 lg:px-10">
            <div className="bg-background">
                <SectionTitleBar
                    eyebrow={<span className="inline-flex items-center gap-1.5"><ShoppingBag className="h-3.5 w-3.5" /> Vitrine</span>}
                    title="Achados K-pop selecionados"
                    href="/loja"
                    linkText="Ver loja →"
                />
                <AffiliateNotice compact className="border-x-0 border-t-0" />
                <div className="border-b border-border py-3">
                    <HomeVitrineTicker products={products} placement={placement} />
                </div>
            </div>
        </section>
    )
}
