'use client'

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
    price?: string | null
}

function trackClick(id: string) {
    fetch(`/api/store/${id}/click`, { method: 'POST' }).catch(() => {})
}

export function HomeVitrineTicker({ products }: { products: Product[] }) {
    if (products.length === 0) return null

    const items = [...products, ...products, ...products]

    return (
        <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-surface to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-surface to-transparent" />

            <div className="overflow-hidden">
                <div
                    className="flex items-start gap-4 animate-home-marquee hover:[animation-play-state:paused]"
                    style={{ width: 'max-content', animationDuration: '22s' }}
                >
                    {items.map((p, idx) => {
                        const cfg = STORE_CONFIG[p.store] ?? FALLBACK
                        return (
                            <a
                                key={`vticker-${p.id}-${idx}`}
                                href={p.affiliateUrl}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                onClick={() => trackClick(p.id)}
                                title={p.name}
                                className="flex-shrink-0 flex flex-col gap-1.5 w-[108px] group"
                            >
                                {/* Imagem */}
                                <div className="relative w-[108px] h-[108px] rounded-xl overflow-hidden bg-surface-hover border border-border/50 group-hover:border-orange-400/60 group-hover:shadow-lg group-hover:shadow-orange-500/10 transition-all duration-250">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.imageUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Badge loja */}
                                    <div className={`absolute bottom-0 inset-x-0 h-[17px] flex items-center justify-center ${cfg.bg}`}>
                                        <span className={`text-[8px] font-bold tracking-wide ${cfg.dark ? 'text-[#333]' : 'text-white'}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    {/* Badge promoção */}
                                    {p.badge && (
                                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                                            {p.badge}
                                        </div>
                                    )}
                                </div>

                                {/* Nome */}
                                <p className="text-[11px] font-medium text-muted group-hover:text-foreground leading-snug line-clamp-2 transition-colors duration-200">
                                    {p.name}
                                </p>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
