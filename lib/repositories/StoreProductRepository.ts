import prisma from '@/lib/prisma'

export type StoreProductRow = {
    id: string
    name: string
    imageUrl: string
    affiliateUrl: string
    store: string
    category: string
    badge: string | null
    rating: number | null
    featured: boolean
    position: number
}

export type EntityType = 'artist' | 'group' | 'production'

export interface LinkedProductsOptions {
    entityType: EntityType
    entityId: string
    limit?: number
}

export interface FallbackProductsOptions {
    categories: string[]
    excludeIds?: string[]
    limit?: number
}

const productSelect = {
    id: true, name: true, imageUrl: true, affiliateUrl: true,
    store: true, category: true, badge: true, rating: true,
    featured: true, position: true,
    isActive: true, isHidden: true,
} as const

const ACTIVE_WHERE = { isActive: true, isHidden: false } as const

function toRow(p: { id: string; name: string; imageUrl: string; affiliateUrl: string; store: string; category: string; badge: string | null; rating: number | null; featured: boolean; position: number; isActive: boolean; isHidden: boolean }): StoreProductRow {
    return { id: p.id, name: p.name, imageUrl: p.imageUrl, affiliateUrl: p.affiliateUrl, store: p.store, category: p.category, badge: p.badge, rating: p.rating, featured: p.featured, position: p.position }
}

export class StoreProductRepository {
    // Produtos com link explícito para a entidade, ordenados por score desc
    static async findByLink({ entityType, entityId, limit = 8 }: LinkedProductsOptions): Promise<StoreProductRow[]> {
        const links = await prisma.storeProductLink.findMany({
            where: { entityType, entityId },
            orderBy: { score: 'desc' },
            take: limit,
            select: {
                score: true,
                product: { select: productSelect },
            },
        })

        return links
            .map(l => l.product)
            .filter(p => p.isActive && !p.isHidden)
            .map(toRow)
    }

    // Produtos cujos tags contêm algum dos termos fornecidos
    static async findByTags(tags: string[], excludeIds: string[] = [], limit = 20): Promise<StoreProductRow[]> {
        if (!tags.length) return []
        const rows = await prisma.storeProduct.findMany({
            where: {
                ...ACTIVE_WHERE,
                tags: { hasSome: tags.map(t => t.toLowerCase()) },
                ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
            },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
            take: limit,
            select: productSelect,
        })
        return rows.map(toRow)
    }

    // Produtos cujo name contém algum dos termos (case-insensitive)
    static async findByNameMatch(terms: string[], excludeIds: string[] = [], limit = 20): Promise<StoreProductRow[]> {
        if (!terms.length) return []
        const results = await Promise.all(
            terms.map(term =>
                prisma.storeProduct.findMany({
                    where: {
                        ...ACTIVE_WHERE,
                        name: { contains: term, mode: 'insensitive' },
                        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
                    },
                    orderBy: [{ featured: 'desc' }, { position: 'asc' }],
                    take: limit,
                    select: productSelect,
                })
            )
        )
        // Deduplicar mantendo ordem de relevância (primeiro termo tem prioridade)
        const seen = new Set<string>()
        return results.flat().filter(p => {
            if (seen.has(p.id)) return false
            seen.add(p.id)
            return true
        }).map(toRow)
    }

    // Fallback por categoria
    static async findByCategories({ categories, excludeIds = [], limit = 8 }: FallbackProductsOptions): Promise<StoreProductRow[]> {
        const rows = await prisma.storeProduct.findMany({
            where: {
                ...ACTIVE_WHERE,
                category: { in: categories },
                ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
            },
            orderBy: [{ featured: 'desc' }, { position: 'asc' }, { createdAt: 'desc' }],
            take: limit,
            select: productSelect,
        })
        return rows.map(toRow)
    }

    // Upsert de link (usado pelo admin e pelo sync automático)
    static async upsertLink(
        productId: string,
        entityType: EntityType,
        entityId: string,
        score = 1.0,
        source: 'manual' | 'auto' = 'manual',
    ) {
        return prisma.storeProductLink.upsert({
            where: { productId_entityType_entityId: { productId, entityType, entityId } },
            create: { productId, entityType, entityId, score, source },
            // Só sobrescreve score/source se não for downgrade de manual para auto
            update: source === 'manual'
                ? { score, source }
                : { score },
        })
    }

    static async deleteLink(productId: string, entityType: EntityType, entityId: string) {
        return prisma.storeProductLink.deleteMany({
            where: { productId, entityType, entityId },
        })
    }

    static async findLinksForEntity(entityType: EntityType, entityId: string) {
        return prisma.storeProductLink.findMany({
            where: { entityType, entityId },
            orderBy: { score: 'desc' },
            include: { product: { select: productSelect } },
        })
    }
}
