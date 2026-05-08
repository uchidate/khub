import { ShoppingBag } from 'lucide-react'
import prisma from '@/lib/prisma'
import { LojaClient } from '@/components/ui/LojaClient'

export const dynamic = 'force-dynamic'

async function getProducts() {
    return prisma.storeProduct.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { position: 'asc' }, { createdAt: 'desc' }],
        select: {
            id: true, name: true, price: true, originalPrice: true,
            imageUrl: true, affiliateUrl: true, store: true, category: true,
            badge: true, rating: true, soldCount: true, tags: true,
        },
    }).catch(() => [])
}

export default async function LojaPage() {
    const products = await getProducts()
    const hasProducts = products.length > 0

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500/10 via-background to-background border-b border-border/40">
                <div className="max-w-6xl mx-auto px-4 py-10">
                    <div className="flex items-center gap-3 mb-3">
                        <ShoppingBag className="w-7 h-7 text-orange-500" />
                        <h1 className="text-2xl font-black text-foreground">Vitrine HallyuHub</h1>
                        <span className="text-xs font-bold bg-orange-500 text-white px-2.5 py-1 rounded-full">Afiliado</span>
                    </div>
                    <p className="text-sm text-muted max-w-xl">
                        Selecionamos os melhores produtos de K-Pop, K-Drama e K-Beauty. Comprando pelos nossos links você apoia o HallyuHub sem pagar nada a mais.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {!hasProducts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted gap-3">
                        <ShoppingBag className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Em breve — produtos selecionados chegando!</p>
                    </div>
                ) : (
                    <LojaClient products={products} />
                )}
            </div>
        </div>
    )
}
