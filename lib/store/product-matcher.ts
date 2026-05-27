/**
 * Motor de matching de produtos da loja para entidades do site.
 *
 * Camadas de scoring (aplicadas em ordem, resultado é merge por pontuação):
 *   1. Links explícitos (StoreProductLink)  — score 0.6–1.0 (conforme campo score)
 *   2. Name match (nome do artista/grupo no título do produto) — score 0.7
 *   3. Tag match (tags do produto contêm termos da entidade)   — score 0.5
 *   4. Category fallback (baseado no tipo de entidade)          — score 0.2
 *
 * A camada 1 tem prioridade absoluta se preencher o limite.
 * As demais são combinadas e deduplicadas por id.
 */

import { StoreProductRepository, type EntityType, type StoreProductRow } from '@/lib/repositories/StoreProductRepository'

// Categorias de fallback por tipo de conteúdo
const CATEGORY_MAP: Record<string, string[]> = {
    kpop:       ['kpop_album', 'lightstick', 'photocard', 'clothing'],
    kbeauty:    ['kbeauty'],
    kdrama:     ['kdrama', 'kpop_album'],
    kfilm:      ['kdrama', 'kpop_album'],
    default:    ['kpop_album', 'lightstick', 'photocard', 'kbeauty'],
}

export interface MatchInput {
    entityType: EntityType
    entityId: string
    // Nomes para busca textual (nameRomanized, nameHangul, aliases, etc.)
    names: string[]
    // Tipo de conteúdo para determinar categorias de fallback
    contentType?: 'kpop' | 'kbeauty' | 'kdrama' | 'kfilm' | 'default'
    limit?: number
}

export interface MatchedProduct extends StoreProductRow {
    matchScore: number
    matchSource: 'link' | 'name' | 'tag' | 'fallback'
}

export async function matchProductsForEntity({
    entityType,
    entityId,
    names,
    contentType = 'default',
    limit = 6,
}: MatchInput): Promise<MatchedProduct[]> {
    const collected = new Map<string, MatchedProduct>()

    const add = (product: StoreProductRow, score: number, source: MatchedProduct['matchSource']) => {
        if (collected.has(product.id)) return // já tem com score >= (camadas aplicadas em ordem decrescente)
        collected.set(product.id, { ...product, matchScore: score, matchSource: source })
    }

    // Camada 1 — links explícitos
    const linked = await StoreProductRepository.findByLink({ entityType, entityId, limit })
    for (const p of linked) add(p, 1.0, 'link')

    if (collected.size >= limit) return ranked(collected, limit)

    const seenIds = [...collected.keys()]
    const cleanNames = names.map(n => n.toLowerCase().trim()).filter(Boolean)

    // Camada 2 — name match
    const byName = await StoreProductRepository.findByNameMatch(cleanNames, seenIds, limit * 3)
    for (const p of byName) add(p, 0.7, 'name')

    if (collected.size >= limit) return ranked(collected, limit)

    // Camada 3 — tag match
    const byTag = await StoreProductRepository.findByTags(cleanNames, [...collected.keys()], limit * 3)
    for (const p of byTag) add(p, 0.5, 'tag')

    if (collected.size >= limit) return ranked(collected, limit)

    // Camada 4 — fallback por categoria
    const categories = CATEGORY_MAP[contentType] ?? CATEGORY_MAP.default
    const fallback = await StoreProductRepository.findByCategories({
        categories,
        excludeIds: [...collected.keys()],
        limit: limit - collected.size,
    })
    // Fallback: rotacionar por hora para não mostrar sempre os mesmos
    const hour = Math.floor(Date.now() / (1000 * 60 * 60))
    const offset = fallback.length > 0 ? hour % fallback.length : 0
    const rotated = [...fallback.slice(offset), ...fallback.slice(0, offset)]
    for (const p of rotated) add(p, 0.2, 'fallback')

    return ranked(collected, limit)
}

function ranked(map: Map<string, MatchedProduct>, limit: number): MatchedProduct[] {
    return [...map.values()]
        .sort((a, b) => {
            if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
            if (b.featured !== a.featured) return Number(b.featured) - Number(a.featured)
            return a.position - b.position
        })
        .slice(0, limit)
}

// Inferir contentType de um artista/grupo a partir dos dados disponíveis
export function inferContentType(
    roles: string[],
    productions: { type?: string }[] = [],
): MatchInput['contentType'] {
    const roleStr = roles.join(' ').toLowerCase()
    const prodTypes = productions.map(p => p.type?.toLowerCase() ?? '').join(' ')

    if (roleStr.includes('actor') || roleStr.includes('actress') || prodTypes.includes('drama') || prodTypes.includes('movie')) {
        return 'kdrama'
    }
    if (roleStr.includes('singer') || roleStr.includes('idol') || roleStr.includes('rapper') || roleStr.includes('dancer')) {
        return 'kpop'
    }
    return 'default'
}

// Inferir contentType de uma produção
export function inferProductionContentType(type: string): MatchInput['contentType'] {
    const t = type.toLowerCase()
    if (t.includes('movie') || t.includes('film')) return 'kfilm'
    if (t.includes('drama') || t.includes('serie') || t.includes('show')) return 'kdrama'
    return 'kdrama'
}
