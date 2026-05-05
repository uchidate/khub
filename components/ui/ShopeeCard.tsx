'use client'

import Image from 'next/image'
import { ShoppingBag, Star } from 'lucide-react'

interface ShopeeCardProps {
    name: string
    price: string
    originalPrice?: string
    rating?: number
    sold?: string
    imageUrl: string
    affiliateUrl: string
    badge?: string
    compact?: boolean
}

export function ShopeeCard({
    name,
    price,
    originalPrice,
    rating = 4.8,
    sold,
    imageUrl,
    affiliateUrl,
    badge,
    compact = false,
}: ShopeeCardProps) {
    if (compact) {
        return (
            <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex gap-3 p-3 rounded-xl bg-surface hover:bg-surface-hover border border-border/40 hover:border-orange-400/40 transition-all group"
            >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted/10">
                    <Image src={imageUrl} alt={name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">{name}</p>
                    <p className="text-sm font-bold text-orange-500 mt-1">{price}</p>
                    {sold && <p className="text-[10px] text-muted">{sold} vendidos</p>}
                </div>
                <div className="flex-shrink-0 self-center">
                    <span className="text-[10px] font-semibold text-orange-500 group-hover:text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">Ver</span>
                </div>
            </a>
        )
    }

    return (
        <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-col rounded-2xl bg-surface border border-border/40 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all group overflow-hidden"
        >
            <div className="relative aspect-square bg-muted/10">
                <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                {badge && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
            </div>
            <div className="p-3 flex flex-col gap-1.5">
                <p className="text-xs text-foreground line-clamp-2 leading-snug font-medium">{name}</p>
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] text-muted">{rating}</span>
                    {sold && <span className="text-[11px] text-muted">· {sold} vendidos</span>}
                </div>
                <div className="flex items-center justify-between mt-1">
                    <div>
                        <p className="text-base font-bold text-orange-500">{price}</p>
                        {originalPrice && <p className="text-[11px] text-muted line-through">{originalPrice}</p>}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] font-semibold bg-orange-500 text-white px-2.5 py-1 rounded-full group-hover:bg-orange-400 transition-colors">
                        <ShoppingBag className="w-3 h-3" />
                        Comprar
                    </span>
                </div>
            </div>
        </a>
    )
}

export function ShopeeSectionHeader({ title, seeAllUrl }: { title: string; seeAllUrl?: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className="text-lg">🛒</span>
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">Afiliado</span>
            </div>
            {seeAllUrl && (
                <a href={seeAllUrl} className="text-xs text-muted hover:text-orange-500 transition-colors">
                    Ver mais →
                </a>
            )}
        </div>
    )
}
