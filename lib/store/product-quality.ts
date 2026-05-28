import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'

type ProductQualityInput = {
    id: string
    store: string
    externalId: string | null
    affiliateUrl: string
    price: string | null
    originalPrice: string | null
    rating: number | null
    reviewCount: number | null
    soldCount: string | null
    isActive: boolean
    isHidden: boolean
}

export function evaluateStoreProductQuality(product: ProductQualityInput): {
    score: number
    reasons: string[]
    riskFlags: string[]
    hasOfficialLink: boolean
} {
    const reasons: string[] = []
    const riskFlags: string[] = []
    let score = 0

    const hasOfficialLink = product.store !== 'mercadolivre' || isOfficialMercadoLivreAffiliateUrl(product.affiliateUrl)
    if (hasOfficialLink) {
        score += 30
        reasons.push('official_affiliate_link')
    } else {
        riskFlags.push('missing_official_affiliate_link')
    }

    if (product.isActive && !product.isHidden) {
        score += 20
        reasons.push('published')
    } else {
        riskFlags.push('draft_or_hidden')
    }

    if (product.price) {
        score += 10
        reasons.push('has_price')
    }

    if (product.rating != null && product.rating >= 4.3) {
        score += 10
        reasons.push('good_rating')
    }

    if (product.reviewCount != null && product.reviewCount >= 20) {
        score += 10
        reasons.push('review_volume')
    }

    if (product.externalId) {
        score += 10
        reasons.push('external_id_tracked')
    }

    return { score: Math.min(100, score), reasons, riskFlags, hasOfficialLink }
}

export async function captureStoreProductSnapshot(product: ProductQualityInput) {
    const quality = evaluateStoreProductQuality(product)
    await prisma.storeProductOfferSnapshot.create({
        data: {
            productId: product.id,
            store: product.store,
            externalId: product.externalId,
            price: product.price,
            originalPrice: product.originalPrice,
            rating: product.rating,
            reviewCount: product.reviewCount,
            soldCount: product.soldCount,
            isActive: product.isActive,
            isHidden: product.isHidden,
            hasOfficialLink: quality.hasOfficialLink,
            qualityScore: quality.score,
            qualityReasons: quality.reasons,
            riskFlags: quality.riskFlags,
        },
    }).catch(() => null)
}
