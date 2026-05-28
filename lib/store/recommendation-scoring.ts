import prisma from '@/lib/prisma'
import { isOfficialMercadoLivreAffiliateUrl } from '@/lib/store/mercadolivre'

export type StoreRecommendationEntityType = 'artist' | 'group' | 'production' | 'blog_post' | 'agency' | 'calendar_event'

type ProductForScoring = {
    id: string
    name: string
    affiliateUrl: string
    store: string
    category: string
    rating: number | null
    reviewCount: number | null
    soldCount: string | null
    isActive: boolean
    isHidden: boolean
    tags: string[]
}

export type ScoreInput = {
    product: ProductForScoring
    entityType: StoreRecommendationEntityType
    entityId: string
    names: string[]
    preferredCategories?: string[]
    source?: 'auto' | 'manual' | 'imported_query'
}

export type ScoreResult = {
    score: number
    reasons: string[]
    riskFlags: string[]
    status: 'candidate' | 'approved' | 'rejected'
}

const NEGATIVE_PATTERNS = [
    ['not_original', /\b(n[aã]o\s+original|similar|r[eé]plica|inspirad[oa])\b/i],
    ['digital_file', /\b(pdf|arquivo digital|download|ebook|e-book)\b/i],
    ['used_or_defect', /\b(usad[oa]|defeito|avaria|quebrad[oa])\b/i],
    ['random_pack', /\b(aleat[oó]ri[oa]|random)\b/i],
] as const

const GENERIC_PATTERNS = [
    /\bk-?pop\b/i,
    /\bcorean[ao]\b/i,
    /\bdorama\b/i,
]

function normalize(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
}

function unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))]
}

function hasOfficialAffiliateLink(product: ProductForScoring): boolean {
    if (product.store !== 'mercadolivre') return Boolean(product.affiliateUrl)
    return isOfficialMercadoLivreAffiliateUrl(product.affiliateUrl)
}

export function scoreStoreProductForEntity({
    product,
    names,
    preferredCategories = [],
}: ScoreInput): ScoreResult {
    const reasons: string[] = []
    const riskFlags: string[] = []
    let score = 0

    const title = normalize(product.name)
    const normalizedNames = unique(names.map(normalize)).filter(name => name.length >= 2)
    const normalizedTags = product.tags.map(normalize)

    if (product.isActive && !product.isHidden) {
        score += 15
        reasons.push('active_visible_product')
    } else {
        score -= 100
        riskFlags.push('inactive_or_hidden')
    }

    if (hasOfficialAffiliateLink(product)) {
        score += 20
        reasons.push('official_affiliate_link')
    } else {
        score -= 50
        riskFlags.push('missing_official_affiliate_link')
    }

    for (const name of normalizedNames) {
        if (title === name) {
            score += 45
            reasons.push(`exact_title_match:${name}`)
            break
        }
        if (title.includes(name)) {
            score += name.length > 4 ? 35 : 20
            reasons.push(`title_match:${name}`)
            break
        }
    }

    const tagMatches = normalizedNames.filter(name => normalizedTags.includes(name))
    if (tagMatches.length > 0) {
        score += 25
        reasons.push(`tag_match:${tagMatches.slice(0, 3).join(',')}`)
    }

    if (preferredCategories.includes(product.category)) {
        score += 15
        reasons.push(`preferred_category:${product.category}`)
    }

    if (product.rating != null) {
        if (product.rating >= 4.7) {
            score += 10
            reasons.push('high_rating')
        } else if (product.rating >= 4.3) {
            score += 6
            reasons.push('good_rating')
        } else if (product.rating < 4) {
            score -= 8
            riskFlags.push('low_rating')
        }
    }

    if (product.reviewCount != null) {
        if (product.reviewCount >= 100) {
            score += 10
            reasons.push('high_review_count')
        } else if (product.reviewCount >= 20) {
            score += 5
            reasons.push('some_reviews')
        }
    }

    for (const [flag, pattern] of NEGATIVE_PATTERNS) {
        if (pattern.test(product.name)) {
            score -= 25
            riskFlags.push(flag)
        }
    }

    if (!normalizedNames.some(name => title.includes(name)) && GENERIC_PATTERNS.some(pattern => pattern.test(product.name))) {
        score -= 10
        riskFlags.push('generic_title_only')
    }

    const bounded = Math.max(0, Math.min(100, score))
    return {
        score: bounded,
        reasons: unique(reasons),
        riskFlags: unique(riskFlags),
        status: bounded >= 80 && riskFlags.length === 0 ? 'approved' : bounded >= 45 ? 'candidate' : 'rejected',
    }
}

export async function upsertStoreProductCandidate(input: ScoreInput): Promise<ScoreResult> {
    const result = scoreStoreProductForEntity(input)
    await prisma.storeProductCandidate.upsert({
        where: {
            productId_entityType_entityId: {
                productId: input.product.id,
                entityType: input.entityType,
                entityId: input.entityId,
            },
        },
        create: {
            productId: input.product.id,
            entityType: input.entityType,
            entityId: input.entityId,
            matchScore: result.score,
            matchReasons: result.reasons,
            riskFlags: result.riskFlags,
            status: result.status,
            source: input.source ?? 'auto',
        },
        update: {
            matchScore: result.score,
            matchReasons: result.reasons,
            riskFlags: result.riskFlags,
            status: result.status,
            source: input.source ?? 'auto',
        },
    })
    return result
}
