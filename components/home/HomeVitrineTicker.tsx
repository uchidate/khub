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
}

function trackClick(id: string) {
    fetch(`/api/store/${id}/click`, { method: 'POST' }).catch(() => {})
}

export function HomeVitrineTicker({ products, compact = false }: { products: Product[]; compact?: boolean }) {
    if (products.length === 0) return null

    const items = [...products, ...products, ...products]

    return (
        <div className="relative">
            <div className={`${compact ? 'w-4 sm:w-8' : 'w-8'} pointer-events-none absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-white dark:from-gray-900 to-transparent`} />
            <div className={`${compact ? 'w-4 sm:w-8' : 'w-8'} pointer-events-none absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-white dark:from-gray-900 to-transparent`} />

            <div className="overflow-hidden">
                <div
                    className={`${compact ? 'gap-2 sm:gap-3' : 'gap-3'} flex items-center animate-home-marquee hover:[animation-play-state:paused]`}
                    style={{ width: 'max-content', animationDuration: compact ? '24s' : '20s' }}
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
                                className={`${compact ? 'w-[66px] sm:w-[88px]' : 'w-[88px]'} flex-shrink-0 flex flex-col gap-1.5 group`}
                            >
                                {/* Imagem */}
                                <div className={`${compact ? 'w-[66px] h-[66px] min-w-[66px] min-h-[66px] rounded-lg sm:w-[88px] sm:h-[88px] sm:min-w-[88px] sm:min-h-[88px] sm:rounded-xl' : 'w-[88px] h-[88px] min-w-[88px] min-h-[88px] rounded-xl'} relative overflow-hidden border border-gray-200 dark:border-gray-700 group-hover:border-orange-400/60 group-hover:shadow-md group-hover:shadow-orange-500/10 transition-all duration-200`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.imageUrl}
                                        alt={p.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className={`${compact ? 'h-[13px] sm:h-[15px]' : 'h-[15px]'} absolute bottom-0 inset-x-0 flex items-center justify-center ${cfg.bg}`}>
                                        <span className={`${compact ? 'text-[6.5px] sm:text-[7px]' : 'text-[7px]'} font-bold tracking-wide ${cfg.dark ? 'text-[#333]' : 'text-white'}`}>
                                            {cfg.label}
                                        </span>
                                    </div>
                                    {p.badge && (
                                        <div className="absolute top-1 left-1 bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full leading-none">
                                            {p.badge}
                                        </div>
                                    )}
                                </div>
                                {/* Nome */}
                                <p className={`${compact ? 'text-[9px] sm:text-[10px]' : 'text-[10px]'} text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 leading-snug line-clamp-2 transition-colors duration-200 w-full`}>
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
