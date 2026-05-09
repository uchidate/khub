import Link from 'next/link'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { ShoppingBag } from 'lucide-react'
import prisma from '@/lib/prisma'

interface Props {
    tags: string[]        // ex: ['bts', 'kpop']
    title?: string        // ex: "Produtos BTS"
    excludeId?: string
}

export async function LojaRelacionados({ tags, title = 'Produtos relacionados', excludeId }: Props) {
    if (!tags.length) return null

    const products = await prisma.storeProduct.findMany({
        where: {
            isActive: true,
            tags: { hasSome: tags.map(t => t.toLowerCase()) },
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        orderBy: [{ featured: 'desc' }, { position: 'asc' }],
        take: 4,
        select: {
            id: true, name: true, price: true, originalPrice: true,
            imageUrl: true, affiliateUrl: true, store: true, category: true,
            badge: true, rating: true, soldCount: true,
        },
    }).catch(() => [])

    if (!products.length) return null

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-500" />
                    <h2 className="text-sm font-bold text-foreground">{title}</h2>
                    <span className="text-[10px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded-full">Afiliado</span>
                </div>
                <Link href="/loja" className="text-xs text-muted hover:text-orange-500 transition-colors">
                    Ver loja →
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {products.map(p => (
                    <ShopeeCard
                        key={p.id}
                        {...p}
                        rating={p.rating ?? undefined}
                        originalPrice={p.originalPrice ?? undefined}
                        badge={p.badge ?? undefined}
                        soldCount={p.soldCount ?? undefined}
                    />
                ))}
            </div>
        </section>
    )
}
