import Link from 'next/link'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import prisma from '@/lib/prisma'
import { HomeVitrineTicker } from '@/components/home/HomeVitrineTicker'
import { AffiliateNotice } from '@/components/ui/AffiliateNotice'
import { TrackedAffiliateLink } from '@/components/ui/TrackedAffiliateLink'

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
        isHidden: false,
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
        const STORE_LABELS: Record<string, string> = { shopee: 'Shopee', amazon: 'Amazon', mercadolivre: 'Mercado Livre', magalu: 'Magalu', shein: 'Shein' }
        const featured = products.slice(0, 4)

        return (
            <section className="w-full overflow-hidden rounded-xl border border-border bg-surface">
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Achados</span>
                    </div>
                    <Link href="/loja" className="text-[10px] font-bold text-accent hover:underline flex items-center gap-0.5">
                        Ver tudo <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                <AffiliateNotice compact className="border-x-0 border-t-0" />

                <div className="grid grid-cols-2 gap-px bg-border/40">
                    {featured.map((p) => (
                        <TrackedAffiliateLink
                            key={p.id}
                            productId={p.id}
                            href={p.affiliateUrl}
                            placement="related_store"
                            className="group relative aspect-square overflow-hidden bg-surface"
                        >
                            <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-end">
                                <p className="w-full px-1.5 pb-1.5 text-[9px] font-semibold text-white leading-tight line-clamp-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
                                    {p.name}
                                </p>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                {STORE_LABELS[p.store] ?? p.store}
                            </div>
                            {p.badge && (
                                <div className="absolute top-1 right-1 bg-accent text-white text-[7px] font-black px-1.5 py-0.5 rounded-full leading-none">
                                    {p.badge}
                                </div>
                            )}
                        </TrackedAffiliateLink>
                    ))}
                </div>

                <Link
                    href="/loja"
                    className="flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-black text-accent hover:bg-accent hover:text-white transition-colors border-t border-border/60"
                >
                    <Sparkles className="h-3 w-3" />
                    Explorar todos os produtos
                </Link>
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
                <AffiliateNotice compact className="border-x-0 border-t-0" />
                <div className="px-3 py-3">
                    <HomeVitrineTicker products={products} placement="related_store" />
                </div>
            </div>
        </section>
    )
}
