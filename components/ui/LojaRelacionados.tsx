import Link from 'next/link'
import { ShopeeCard } from '@/components/ui/ShopeeCard'
import { ShoppingBag } from 'lucide-react'
import prisma from '@/lib/prisma'

const FALLBACK_CATEGORIES = ['kpop_album', 'lightstick', 'photocard', 'acessorios', 'kbeauty', 'alimenta', 'clothing', 'kdrama', 'outros']

// Rotaciona a cada hora — compatível com ISR
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

export async function LojaRelacionados({ tags, title = 'Produtos relacionados', excludeId, compact = false }: Props) {
    if (!tags.length) return null

    const show = compact ? 3 : 4
    const base = {
        isActive: true,
        ...(excludeId ? { id: { not: excludeId } } : {}),
    }

    // Busca mais do que o necessário para poder rotacionar
    let pool = await prisma.storeProduct.findMany({
        where: { ...base, tags: { hasSome: tags.map(t => t.toLowerCase()) } },
        orderBy: [{ featured: 'desc' }, { position: 'asc' }],
        take: 12,
        select: {
            id: true, name: true, price: true, originalPrice: true,
            imageUrl: true, affiliateUrl: true, store: true, category: true,
            badge: true, rating: true, soldCount: true,
        },
    }).catch(() => [])

    // Fallback: todas as categorias
    if (!pool.length) {
        pool = await prisma.storeProduct.findMany({
            where: { ...base, category: { in: FALLBACK_CATEGORIES } },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }],
            take: 12,
            select: {
                id: true, name: true, price: true, originalPrice: true,
                imageUrl: true, affiliateUrl: true, store: true, category: true,
                badge: true, rating: true, soldCount: true,
            },
        }).catch(() => [])
    }

    if (!pool.length) return null

    const products = rotatedSlice(pool, show)

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
            {compact ? (
                <div className="flex flex-col gap-2">
                    {products.map(p => (
                        <ShopeeCard
                            key={p.id}
                            {...p}
                            compact
                            rating={p.rating ?? undefined}
                            badge={p.badge ?? undefined}
                            soldCount={p.soldCount ?? undefined}
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {products.map(p => (
                        <ShopeeCard
                            key={p.id}
                            {...p}
                            rating={p.rating ?? undefined}
                            badge={p.badge ?? undefined}
                            soldCount={p.soldCount ?? undefined}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
