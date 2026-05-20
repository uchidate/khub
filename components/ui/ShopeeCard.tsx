'use client'

import Image from 'next/image'
import { ExternalLink, Star } from 'lucide-react'

export const STORE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    shopee:        { label: 'Shopee',         color: 'text-orange-500', bg: 'bg-orange-500' },
    amazon:        { label: 'Amazon',         color: 'text-[#FF9900]',  bg: 'bg-[#232F3E]' },
    mercadolivre:  { label: 'Mercado Livre',  color: 'text-yellow-500', bg: 'bg-[#FFF159]'  },
    magalu:        { label: 'Magalu',         color: 'text-blue-600',   bg: 'bg-[#0086FF]'  },
    shein:         { label: 'Shein',          color: 'text-white',      bg: 'bg-[#1a1a1a]'  },
    outro:         { label: 'Ver produto',    color: 'text-muted',      bg: 'bg-muted'      },
}

function StoreLogo({ store, className = 'w-4 h-4' }: { store: string; className?: string }) {
    if (store === 'shopee') return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M12 0C9.6 0 7.65 1.95 7.65 4.35c0 .3.03.6.08.88H4.5A1.5 1.5 0 003 6.73l-1.5 13.5A1.5 1.5 0 003 21.75h18a1.5 1.5 0 001.5-1.52L21 6.73a1.5 1.5 0 00-1.5-1.38h-3.23c.05-.28.08-.58.08-.88C16.35 1.95 14.4 0 12 0zm0 1.5c1.57 0 2.85 1.28 2.85 2.85 0 .3-.05.6-.13.88H9.28a3.01 3.01 0 01-.13-.88C9.15 2.78 10.43 1.5 12 1.5zm0 9c-2.07 0-3.75 1.03-3.75 2.25 0 .9.83 1.68 2.06 2.07l1.94.6c.52.17.75.4.75.58 0 .41-.44.75-1.5.75-1.02 0-1.94-.38-2.56-.98l-.94 1.13C8.84 17.62 10.27 18.3 12 18.3c2.18 0 3.75-1.03 3.75-2.4 0-.9-.75-1.65-2.06-2.1l-1.94-.6c-.52-.16-.75-.37-.75-.6 0-.41.45-.75 1.5-.75.9 0 1.72.3 2.32.82l.94-1.12A4.88 4.88 0 0012 10.5z"/>
        </svg>
    )
    if (store === 'amazon') return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M13.958 10.09c0 1.232.029 2.256-.591 3.351-.502.891-1.301 1.438-2.186 1.438-1.214 0-1.922-.924-1.922-2.292 0-2.692 2.415-3.182 4.7-3.182v.685zm3.186 7.705c-.209.189-.512.201-.748.074-1.052-.874-1.239-1.279-1.816-2.112-1.735 1.769-2.963 2.297-5.21 2.297-2.66 0-4.733-1.642-4.733-4.928 0-2.566 1.391-4.309 3.37-5.164 1.715-.754 4.11-.891 5.942-1.099v-.41c0-.753.06-1.642-.384-2.294-.384-.578-1.124-.816-1.777-.816-1.207 0-2.284.618-2.548 1.909-.054.285-.262.567-.549.582l-3.065-.333c-.259-.056-.548-.266-.472-.66C5.97 2.705 8.642 1.87 11.02 1.87c1.213 0 2.799.323 3.756 1.242 1.213 1.14 1.096 2.661 1.096 4.318v3.91c0 1.176.488 1.69 .948 2.327.163.228.199.5-.007.668l-2.659 2.46h-.011zM20.613 19.324c-2.248 1.661-5.513 2.546-8.32 2.546-3.936 0-7.48-1.454-10.163-3.875-.211-.19-.022-.45.229-.302 2.893 1.683 6.47 2.695 10.16 2.695 2.49 0 5.228-.516 7.749-1.585.38-.162.7.25.345.521zM21.613 18.184c-.289-.37-1.904-.174-2.631-.088-.221.027-.255-.165-.056-.304 1.288-.904 3.401-.644 3.647-.34.246.305-.064 2.417-1.275 3.426-.186.155-.363.072-.28-.134.272-.678.883-2.19.595-2.56z"/>
        </svg>
    )
    if (store === 'mercadolivre') return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12C24 5.373 18.628 0 12 0zm5.445 15.295a.55.55 0 01-.478.278H6.83a.55.55 0 01-.48-.277.548.548 0 01.002-.557l1.314-2.268a.55.55 0 01.477-.278h7.707a.55.55 0 01.478.278l1.12 1.934.194.334a.549.549 0 01-.197.556zm-5.497-5.908c-2.208 0-4.098-1.295-4.752-3.109h9.504c-.655 1.814-2.544 3.109-4.752 3.109z"/>
        </svg>
    )
    if (store === 'magalu') return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a2 2 0 110 4 2 2 0 010-4zm0 14.5c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
    )
    if (store === 'shein') return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M7.5 2C5.57 2 4 3.57 4 5.5S5.57 9 7.5 9 11 7.43 11 5.5 9.43 2 7.5 2zm9 0C14.57 2 13 3.57 13 5.5S14.57 9 16.5 9 20 7.43 20 5.5 18.43 2 16.5 2zM4 11v11h7V11H4zm9 0v11h7V11h-7z"/>
        </svg>
    )
    // fallback
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M6 2l1.5 4.5h9L18 2H6zm-2 5l1 13h14l1-13H4zm8 2a4 4 0 110 8 4 4 0 010-8z"/>
        </svg>
    )
}

interface ShopeeCardProps {
    id?: string
    name: string
    description?: string | null
    price?: string | null
    originalPrice?: string | null
    rating?: number
    soldCount?: string
    sold?: string
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
    description,
    price,
    originalPrice,
    rating = 4.8,
    sold,
    soldCount,
    imageUrl,
    affiliateUrl,
    badge,
    compact = false,
    store = 'shopee',
}: ShopeeCardProps) {
    const vendidos = soldCount ?? sold
    const cfg = STORE_CONFIG[store] ?? STORE_CONFIG.outro

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
                    {price && <p className="mt-1 text-sm font-black text-foreground">{price}</p>}
                    {vendidos && <p className="text-[10px] text-muted">{vendidos} vendidos</p>}
                </div>
                <div className="flex-shrink-0 self-center">
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.bg} ${store === 'mercadolivre' ? 'text-[#333]' : 'text-white'} px-2 py-1 rounded-full`}>
                        <StoreLogo store={store} className="w-3 h-3" />
                    </span>
                </div>
            </a>
        )
    }

    return (
        <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick(id)}
            title={`Ver no ${cfg.label} (link externo)`}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl hover:shadow-black/5 group"
        >
            <div className="relative aspect-square bg-muted/10">
                <Image src={imageUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                {badge && (
                    <span className="absolute left-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-accent px-2.5 py-1 text-[10px] font-black leading-none text-white shadow-sm">
                        {badge}
                    </span>
                )}
                {/* Indicador de link externo */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-white" />
                    <span className="text-[9px] text-white font-semibold">{cfg.label}</span>
                </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-center justify-between gap-2">
                    <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold ${cfg.bg} ${store === 'mercadolivre' ? 'text-[#333]' : 'text-white'} px-2 py-1 rounded-full transition-opacity group-hover:opacity-80`}>
                        <StoreLogo store={store} className="w-3 h-3" />
                        {cfg.label}
                    </span>
                    {rating > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {rating.toFixed(1)}
                        </span>
                    )}
                </div>
                <p className="min-h-[2.25rem] text-sm font-bold leading-tight text-foreground line-clamp-2">{name}</p>
                {description && <p className="hidden text-xs leading-snug text-muted line-clamp-2 sm:block">{description}</p>}
                <div className="mt-auto space-y-2 pt-1">
                    {(price || originalPrice) && (
                        <div>
                            {price && <p className="text-base font-black leading-none text-foreground">{price}</p>}
                            {originalPrice && <p className="mt-1 text-[11px] text-muted line-through">{originalPrice}</p>}
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
                        <span className="min-w-0 truncate text-[10px] font-semibold text-muted">
                            {vendidos ? `${vendidos} vendidos` : 'Selecionado pela curadoria'}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-[10px] font-black text-accent transition-colors">
                            Ver
                            <ExternalLink className="h-3 w-3" />
                        </span>
                    </div>
                </div>
            </div>
        </a>
    )
}

export function ShopeeSectionHeader({ title, seeAllUrl, store }: { title: string; seeAllUrl?: string; store?: string }) {
    const cfg = store ? (STORE_CONFIG[store] ?? STORE_CONFIG.outro) : null
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">{title}</h2>
                {cfg && store && (
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${cfg.bg} ${store === 'mercadolivre' ? 'text-[#333]' : 'text-white'} px-2 py-0.5 rounded-full`}>
                        <StoreLogo store={store} className="w-3 h-3" />
                        {cfg.label}
                    </span>
                )}
            </div>
            {seeAllUrl && (
                <a href={seeAllUrl} className="text-xs text-muted hover:text-orange-500 transition-colors">
                    Ver mais →
                </a>
            )}
        </div>
    )
}
