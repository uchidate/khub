'use client'

import { TrackedAffiliateLink } from '@/components/ui/TrackedAffiliateLink'
import type { AffiliatePlacement } from '@/lib/store/affiliate-placements'

const STORE_CONFIG: Record<string, { label: string; bg: string; dark: boolean }> = {
    shopee:       { label: 'Shopee',        bg: 'bg-orange-500',  dark: false },
    amazon:       { label: 'Amazon',        bg: 'bg-[#232F3E]',   dark: false },
    mercadolivre: { label: 'Mercado Livre', bg: 'bg-[#FFF159]',   dark: true  },
    magalu:       { label: 'Magalu',        bg: 'bg-[#0086FF]',   dark: false },
    shein:        { label: 'Shein',         bg: 'bg-[#1a1a1a]',   dark: false },
}
const FALLBACK = { label: 'Ver', bg: 'bg-surface', dark: false }

interface Product {
    id: string
    name: string
    imageUrl: string
    affiliateUrl: string
    store: string
    badge?: string | null
}

export function HomeVitrineTicker({ products, compact = false, placement = 'home_store' }: { products: Product[]; compact?: boolean; placement?: AffiliatePlacement }) {
    if (products.length === 0) return null

    const items = [...products, ...products, ...products]

    return (
        <div className="relative">
            <div className={`${compact ? 'w-4 sm:w-8' : 'w-8'} pointer-events-none absolute bottom-0 left-0 top-0 z-10 bg-gradient-to-r from-background to-transparent`} />
            <div className={`${compact ? 'w-4 sm:w-8' : 'w-8'} pointer-events-none absolute bottom-0 right-0 top-0 z-10 bg-gradient-to-l from-background to-transparent`} />

            <div className="overflow-hidden">
                <div
                    className={`${compact ? 'gap-2 sm:gap-3' : 'gap-3'} flex items-center animate-home-marquee hover:[animation-play-state:paused]`}
                    style={{ width: 'max-content', animationDuration: compact ? '24s' : '20s' }}
                >
                    {items.map((p, idx) => {
                        const cfg = STORE_CONFIG[p.store] ?? FALLBACK
                        return (
                            <TrackedAffiliateLink
                                key={`vticker-${p.id}-${idx}`}
                                productId={p.id}
                                href={p.affiliateUrl}
                                placement={placement}
                                title={p.name}
                                className={`${compact ? 'w-[66px] sm:w-[88px]' : 'w-[96px]'} flex-shrink-0 flex flex-col gap-1.5 group`}
                            >
                                {/* Imagem */}
                                <div className={`${compact ? 'w-[66px] h-[66px] min-w-[66px] min-h-[66px] rounded-md sm:w-[88px] sm:h-[88px] sm:min-w-[88px] sm:min-h-[88px]' : 'h-[92px] w-[92px] min-h-[92px] min-w-[92px] rounded-md'} relative overflow-hidden border border-border bg-background transition-colors duration-200 group-hover:border-accent/60`}>
                                    { }
                                    <img
                                        src={p.imageUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className={`${compact ? 'h-[13px] sm:h-[15px]' : 'h-[17px]'} absolute inset-x-0 bottom-0 flex items-center justify-center ${cfg.bg}`}>
                                        <span className={`${compact ? 'text-[6.5px] sm:text-[7px]' : 'text-[7px]'} font-bold tracking-wide ${cfg.dark ? 'text-[#333]' : 'text-white'}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    {p.badge && (
                                        <div className="absolute left-1 top-1 rounded-full bg-accent px-1.5 py-0.5 text-[7px] font-black leading-none text-white">
                                            {p.badge}
                                        </div>
                                    )}
                                </div>
                                {/* Nome */}
                                <p className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px]'} w-full text-muted transition-colors duration-200 line-clamp-2 group-hover:text-foreground leading-snug`}>
                                    {p.name}
                                </p>
                            </TrackedAffiliateLink>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
