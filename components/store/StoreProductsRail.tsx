import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { matchProductsForEntity, type MatchInput } from '@/lib/store/product-matcher'
import { StoreProductCard } from '@/components/store/StoreProductCard'
import { AffiliateNotice } from '@/components/ui/AffiliateNotice'

interface Props extends MatchInput {
    title?: string
    /** Número de produtos a exibir */
    limit?: number
    /** Não renderizar nada se só tiver fallback (sem match real) */
    hideIfOnlyFallback?: boolean
}

export async function StoreProductsRail({
    title = 'Produtos relacionados',
    limit = 6,
    hideIfOnlyFallback = false,
    ...matchInput
}: Props) {
    const products = await matchProductsForEntity({ ...matchInput, limit })

    if (!products.length) return null

    if (hideIfOnlyFallback && products.every(p => p.matchSource === 'fallback')) return null

    const hasRealMatch = products.some(p => p.matchSource !== 'fallback')

    return (
        <section className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-accent" />
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted">
                        {title}
                    </h2>
                    {hasRealMatch && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                            Curadoria
                        </span>
                    )}
                </div>
                <Link
                    href="/loja"
                    className="text-[11px] font-semibold text-muted hover:text-accent transition-colors"
                >
                    Ver loja →
                </Link>
            </div>

            {/* Grid responsivo: 2 cols mobile / 3 tablet / até 6 desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                {products.map((product, i) => (
                    <StoreProductCard
                        key={product.id}
                        product={product}
                        placement="related_store"
                        entityType={matchInput.entityType}
                        entityId={matchInput.entityId}
                        position={i + 1}
                        priority={i < 2}
                    />
                ))}
            </div>

            <AffiliateNotice className="mt-3" />
        </section>
    )
}
