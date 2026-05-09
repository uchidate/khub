'use client'

import Image from 'next/image'
import { ShoppingBag, Star } from 'lucide-react'

const STORE_LABELS: Record<string, string> = {
    shopee:       'Shopee',
    amazon:       'Amazon',
    mercadolivre: 'Mercado Livre',
    outro:        'Ver produto',
}

interface ShopeeCardProps {
    id?: string
    name: string
    price: string
    originalPrice?: string
    rating?: number
    sold?: string
    soldCount?: string
    imageUrl: string
    affiliateUrl: string
    badge?: string
    compact?: boolean
    store?: string
}

function trackClick(id?: string) {
    if (!id) return
    fetch(`/api/store/${id}/click`, { method: 'POST' }).catch(() => {})
}

export function ShopeeCard({
    id,
    name,
    price: _price,
    originalPrice: _originalPrice,
    rating = 4.8,
    sold,
    soldCount,
    imageUrl,
    affiliateUrl,
    badge: _badge,
    compact = false,
    store = 'shopee',
}: ShopeeCardProps) {
    const vendidos = soldCount ?? sold

    if (compact) {
        return (
            <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackClick(id)}
                className="flex gap-3 p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border/40 hover:border-orange-400/40 transition-all group"
            >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted/10">
                    <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{name}</p>
                    {vendidos && <p className="text-[10px] text-muted">{vendidos} vendidos</p>}
                </div>
                <div className="flex-shrink-0 self-center">
                    <span className="text-[10px] font-semibold text-orange-500 group-hover:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">Ver</span>
                </div>
            </a>
        )
    }


    // Card padrão
    return (
        <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick(id)}
            className="flex flex-col rounded-2xl bg-surface border border-border/40 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all group overflow-hidden"
        >
            <div className="relative aspect-square bg-muted/10">
                <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
            </div>
            <div className="p-3 flex flex-col gap-1.5 flex-1">
                <p className="text-xs text-foreground line-clamp-2 leading-snug font-medium flex-1">{name}</p>
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] text-muted">{rating}</span>
                    {vendidos && <span className="text-[11px] text-muted">· {vendidos}</span>}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold bg-orange-500 text-white px-2 py-1 rounded-full group-hover:bg-orange-400 transition-colors">
                        <ShoppingBag className="w-3 h-3" />
                        {STORE_LABELS[store] ?? 'Comprar'}
                    </span>
                </div>
            </div>
        </a>
    )
}

export function ShopeeSectionHeader({ title, seeAllUrl, store }: { title: string; seeAllUrl?: string; store?: string }) {
    const storeLabel = store ? (STORE_LABELS[store] ?? store) : 'Afiliado'
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">{storeLabel}</span>
            </div>
            {seeAllUrl && (
                <a href={seeAllUrl} className="text-xs text-muted hover:text-orange-500 transition-colors">
                    Ver mais →
                </a>
            )}
        </div>
    )
}
