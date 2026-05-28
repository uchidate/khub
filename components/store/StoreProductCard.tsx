'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'
import { TrackedAffiliateLink } from '@/components/ui/TrackedAffiliateLink'
import type { StoreProductRow } from '@/lib/repositories/StoreProductRepository'
import type { MatchedProduct } from '@/lib/store/product-matcher'

export const STORE_LABELS: Record<string, string> = {
    shopee: 'Shopee',
    amazon: 'Amazon',
    mercadolivre: 'Mercado Livre',
    magalu: 'Magalu',
    shein: 'Shein',
    outro: 'Ver produto',
}

export const STORE_COLORS: Record<string, string> = {
    shopee: 'text-orange-500',
    amazon: 'text-[#FF9900]',
    mercadolivre: 'text-yellow-500',
    magalu: 'text-blue-500',
    shein: 'text-foreground',
    outro: 'text-muted',
}

interface Props {
    product: StoreProductRow | MatchedProduct
    placement?: import('@/lib/store/affiliate-placements').AffiliatePlacement
    entityType?: string
    entityId?: string
    position?: number
    priority?: boolean
}

export function StoreProductCard({ product, placement = 'related_store', entityType, entityId, position, priority = false }: Props) {
    const storeLabel = STORE_LABELS[product.store] ?? 'Ver produto'
    const storeColor = STORE_COLORS[product.store] ?? 'text-muted'

    return (
        <TrackedAffiliateLink
            href={product.affiliateUrl}
            productId={product.id}
            placement={placement}
            entityType={entityType}
            entityId={entityId}
            position={position}
            className="group flex flex-col gap-2 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors overflow-hidden"
        >
            {/* Imagem */}
            <div className="relative aspect-square w-full overflow-hidden bg-surface">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    priority={priority}
                />
                {product.badge && (
                    <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        {product.badge}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1 px-3 pb-3">
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                    {product.name}
                </p>

                <div className="flex items-center justify-between mt-auto pt-1">
                    {product.rating != null ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {product.rating.toFixed(1)}
                        </span>
                    ) : (
                        <span />
                    )}
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${storeColor}`}>
                        {storeLabel}
                    </span>
                </div>
            </div>
        </TrackedAffiliateLink>
    )
}
