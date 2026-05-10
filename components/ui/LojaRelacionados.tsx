import Link from 'next/link'
import { ShoppingBag, ArrowRight } from 'lucide-react'
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

export async function LojaRelacionados({ tags, excludeId }: Props) {
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

    return (
        <section className="mt-6">
            <div className="flex items-stretch rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
                {/* Label esquerda — vertical */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 bg-orange-500 self-stretch">
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        Shopping
                    </span>
                </div>

                {/* Ticker */}
                <div className="flex-1 min-w-0 py-3 px-2">
                    <HomeVitrineTicker products={products} />
                </div>

                {/* CTA direita — vertical */}
                <Link
                    href="/loja"
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-3 border-l border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400 group-hover:text-orange-500 transition-colors" style={{ writingMode: 'vertical-rl' }}>
                        Ver tudo
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                </Link>
            </div>
        </section>
    )
}
