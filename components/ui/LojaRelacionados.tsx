import Link from 'next/link'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import prisma from '@/lib/prisma'
import { HomeVitrineTicker } from '@/components/home/HomeVitrineTicker'

const FALLBACK_CATEGORIES = ['kpop_album', 'lightstick', 'photocard', 'acessorios', 'kbeauty', 'alimenta', 'clothing', 'kdrama', 'outros']

function rotatedSlice<T>(items: T[], count: number): T[] {
    if (items.length <= count) return items
    const hour = Math.floor(Date.now() / (1000 * 60 * 60))
    const offset = hour % items.length
    const rotated = [...items.slice(offset), ...items.slice(0, offset)]
    return rotated.slice(0, count)
}

interface Props {
    tags: string[]
    title?: string
    excludeId?: string
    compact?: boolean
}

export async function LojaRelacionados({ tags, title = 'Achados relacionados', excludeId, compact = false }: Props) {
    if (!tags.length) return null

    const base = {
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
    }

    let pool = await prisma.storeProduct.findMany({
        where: { ...base, tags: { hasSome: tags.map(t => t.toLowerCase()) } },
        orderBy: [{ featured: 'desc' }, { position: 'asc' }],
        take: 20,
        select: { id: true, name: true, imageUrl: true, affiliateUrl: true, store: true, badge: true },
    }).catch(() => [])

    if (!pool.length) {
        pool = await prisma.storeProduct.findMany({
            where: { ...base, category: { in: FALLBACK_CATEGORIES } },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }],
            take: 20,
            select: { id: true, name: true, imageUrl: true, affiliateUrl: true, store: true, badge: true },
        }).catch(() => [])
    }

    if (!pool.length) return null

    const products = rotatedSlice(pool, 20)

    if (compact) {
        return (
            <section className="w-full overflow-hidden">
                <div className="rounded-3xl border border-border bg-surface px-3 py-3 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2 px-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                                <ShoppingBag className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                                <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-accent">
                                    <Sparkles className="h-3 w-3" />
                                    Shopping
                                </p>
                                <p className="truncate text-xs font-bold text-foreground">{title}</p>
                            </div>
                        </div>
                        <Link href="/loja" className="flex flex-shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-black text-foreground transition-colors hover:border-accent/40 hover:text-accent">
                            Ver tudo <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="overflow-hidden">
                        <div className="flex gap-3 animate-home-marquee hover:[animation-play-state:paused]" style={{ width: 'max-content', animationDuration: '28s' }}>
                            {[...products.slice(0, 12), ...products.slice(0, 12)].map((p, idx) => {
                                const STORE_LABELS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }
                                return (
                                    <a key={`${p.id}-${idx}`} href={p.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored"
                                        className="flex w-[76px] flex-shrink-0 flex-col gap-1 group">
                                        <div className="relative h-[76px] w-[76px] overflow-hidden rounded-2xl border border-border bg-background transition-all group-hover:border-accent/60">
                                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 inset-x-0 h-[15px] flex items-center justify-center bg-accent">
                                                <span className="text-[7px] font-bold text-white tracking-wide">{STORE_LABELS[p.store] ?? p.store}</span>
                                            </div>
                                            {p.badge && (
                                                <div className="absolute top-1 left-1 bg-accent text-white text-[7px] font-black px-1.5 py-0.5 rounded-full leading-none">{p.badge}</div>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-muted leading-snug line-clamp-2 group-hover:text-foreground">{p.name}</p>
                                    </a>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="mt-6 overflow-hidden">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
                            <ShoppingBag className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-accent">Shopping</p>
                            <p className="truncate text-sm font-bold text-foreground">{title}</p>
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
