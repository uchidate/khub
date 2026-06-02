/**
 * POST /api/cron/sync-ml
 *
 * Sincronização automática de produtos do Mercado Livre:
 * 1. Renova o token OAuth se necessário
 * 2. Busca produtos K-Pop/K-Beauty por queries rotativas
 * 3. Filtra por relevância, qualidade de imagem e nota mínima
 * 4. Importa produtos novos (sem duplicatas)
 * 5. Desativa produtos que sumiram do ML (isHidden)
 *
 * Frequência recomendada: a cada 5h (antes do token expirar em 6h)
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { StoreProductRepository } from '@/lib/repositories/StoreProductRepository'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ML_API = 'https://api.mercadolibre.com'
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'

// Queries estáticas: categorias que não dependem de grupos específicos
const STATIC_QUERIES: Array<{ q: string; category: string }> = [
    { q: 'album kpop',        category: 'kpop_album' },
    { q: 'album k-pop',       category: 'kpop_album' },
    { q: 'kpop album original', category: 'kpop_album' },
    { q: 'kpop merch',        category: 'outros' },
    { q: 'lightstick kpop',   category: 'lightstick' },
    { q: 'photocard kpop',    category: 'photocard' },
    { q: 'poster kpop',       category: 'outros' },
    { q: 'chaveiro kpop',     category: 'acessorios' },
    { q: 'camiseta kpop',     category: 'clothing' },
    { q: 'moletom kpop',      category: 'clothing' },
    { q: 'buldak',            category: 'alimenta' },
    { q: 'shin ramyun',       category: 'alimenta' },
    { q: 'doce coreano',      category: 'alimenta' },
    { q: 'pepero',            category: 'alimenta' },
    { q: 'choco pie coreano', category: 'alimenta' },
    { q: 'chapagetti',        category: 'alimenta' },
    { q: 'tteokbokki',        category: 'alimenta' },
    { q: 'ramen coreano',     category: 'alimenta' },
    { q: 'skincare coreano',  category: 'kbeauty'  },
    { q: 'protetor solar coreano', category: 'kbeauty' },
    { q: 'cosmetico coreano', category: 'kbeauty'  },
    { q: 'serum coreano',     category: 'kbeauty'  },
    { q: 'toner coreano',     category: 'kbeauty'  },
    { q: 'snail mucin coreano', category: 'kbeauty' },
]

// Queries dinâmicas: geradas dos top grupos por trendingScore do banco
async function buildDynamicQueries(): Promise<Array<{ q: string; category: string }>> {
    const topGroups = await prisma.musicalGroup.findMany({
        where: { isHidden: false },
        select: { name: true, trendingScore: true },
        orderBy: { trendingScore: 'desc' },
        take: 50,
    })
    return topGroups.flatMap(g => {
        const name = g.name.toLowerCase()
        return [
            { q: `photocard kpop ${name}`, category: 'photocard'  },
            { q: `album kpop ${name}`,     category: 'kpop_album' },
            { q: `lightstick kpop ${name}`, category: 'lightstick' },
        ]
    })
}

const MAX_PER_QUERY = 40
const MAX_TOTAL_ACTIVE = 500
const QUERIES_PER_RUN = 20
const SEARCH_LIMIT = 50
const SEARCH_PAGES_PER_QUERY = 2
const MAX_CANDIDATES_PER_PAGE = 15
const RUN_TIME_BUDGET_MS = 85_000

const GROUP_TAGS = [
    'blackpink', 'bts', 'twice', 'stray kids', 'aespa', 'ive', 'newjeans',
    'seventeen', 'le sserafim', 'enhypen', 'txt', 'nct', 'ateez', 'exo',
    'shinee', 'got7', 'red velvet', 'mamamoo', 'itzy', 'nmixx', 'babymonster',
    'zerobaseone', 'bigbang', 'super junior', 'the boyz', 'sf9', 'monsta x',
    'iu', 'gidle', 'g-idle',
]

const NEGATIVE_TITLE_PATTERNS = [
    /\b(pdf|digital|arquivo|download|ebook|e-book)\b/i,
    /\b(usad[oa]|avaria|defeito|quebrad[oa])\b/i,
    /\b(capa|case|pel[ií]cula)\s+(de\s+)?(celular|iphone|samsung)\b/i,
    /\bcurso|apostila\b/i,
]

const RELEVANT_TITLE_PATTERNS = [
    /\bk-?pop\b/i,
    /\balbum|mini album|single album|lightstick|photocard|photo card|poster|chaveiro|keychain\b/i,
    /\bcorean[ao]|k-?beauty|skincare|serum|toner|essence|snail|protetor solar\b/i,
    /\bbuldak|ramen|ramyun|tteokbokki|pepero|chapagetti|choco pie\b/i,
    ...GROUP_TAGS.map(tag => new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')),
]

function extractArtistTags(title: string): string[] {
    const t = title.toLowerCase()
    return GROUP_TAGS.filter(g => t.includes(g))
}

function detectCategory(title: string, defaultCategory: string): string {
    const t = title.toLowerCase()
    if (['album', 'mini album', 'single album', 'full album'].some(w => t.includes(w))) return 'kpop_album'
    if (t.includes('lightstick')) return 'lightstick'
    if (t.includes('photocard')) return 'photocard'
    if (['skincare', 'serum', 'toner', 'essence', 'creme facial', 'mascara facial', 'cosmetico'].some(w => t.includes(w))) return 'kbeauty'
    if (['ramen', 'ramyun', 'buldak', 'tteokbokki', 'pepero', 'doce', 'snack', 'macarrao', 'chapagetti'].some(w => t.includes(w))) return 'alimenta'
    if (['camiseta', 'moletom', 'hoodie'].some(w => t.includes(w))) return 'clothing'
    return defaultCategory
}

function isRelevantProductTitle(title: string): boolean {
    if (!title || NEGATIVE_TITLE_PATTERNS.some(pattern => pattern.test(title))) return false
    return RELEVANT_TITLE_PATTERNS.some(pattern => pattern.test(title))
}

function hasTimeLeft(startedAt: number, bufferMs = 15_000): boolean {
    return Date.now() - startedAt < RUN_TIME_BUDGET_MS - bufferMs
}

async function refreshToken(settings: { mlRefreshToken: string | null }): Promise<{
    access_token: string; refresh_token: string; user_id: number; expires_in: number
} | null> {
    const appId = process.env.ML_APP_ID
    const secretKey = process.env.ML_SECRET_KEY
    const refreshToken = settings.mlRefreshToken

    if (!appId || !secretKey || !refreshToken) return null

    const resp = await fetch(ML_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: appId,
            client_secret: secretKey,
            refresh_token: refreshToken,
        }),
    })

    if (!resp.ok) return null
    return resp.json()
}

async function getValidToken(): Promise<{ access_token: string; user_id: string } | null> {
    const settings = await prisma.systemSettings.findUnique({
        where: { id: 'singleton' },
        select: { mlAccessToken: true, mlRefreshToken: true, mlTokenExpiresAt: true, mlUserId: true },
    })

    if (!settings) return null

    // Token ainda válido (com margem de 10min)
    if (
        settings.mlAccessToken &&
        settings.mlTokenExpiresAt &&
        settings.mlTokenExpiresAt > new Date(Date.now() + 10 * 60 * 1000)
    ) {
        return { access_token: settings.mlAccessToken, user_id: settings.mlUserId ?? '' }
    }

    // Renovar via refresh_token
    const newToken = await refreshToken(settings)
    if (!newToken) return null

    const expiresAt = new Date(Date.now() + newToken.expires_in * 1000)
    await prisma.systemSettings.upsert({
        where: { id: 'singleton' },
        create: {
            id: 'singleton',
            mlAccessToken: newToken.access_token,
            mlRefreshToken: newToken.refresh_token,
            mlTokenExpiresAt: expiresAt,
            mlUserId: String(newToken.user_id),
            homeSecondaryPostIds: [],
            homeSidebarPostIds: [],
            homeCarouselPostIds: [],
        },
        update: {
            mlAccessToken: newToken.access_token,
            mlRefreshToken: newToken.refresh_token,
            mlTokenExpiresAt: expiresAt,
            mlUserId: String(newToken.user_id),
        },
    })

    return { access_token: newToken.access_token, user_id: String(newToken.user_id) }
}

type CatalogProduct = {
    id: string
    name: string
    imageUrl: string
    affiliateUrl: string
    price: string | null
}

function makeAffiliateUrl(pid: string, userId: string): string {
    const affiliateId = process.env.ML_AFFILIATE_ID || process.env.ML_AFFILIATE_CID || userId
    const param = process.env.ML_AFFILIATE_PARAM || 'affId'
    return `https://www.mercadolivre.com.br/p/${pid}?${param}=${affiliateId}`
}

function makeAffiliateUrlFromPermalink(permalink: string, userId: string): string {
    const affiliateId = process.env.ML_AFFILIATE_ID || process.env.ML_AFFILIATE_CID || userId
    const param = process.env.ML_AFFILIATE_PARAM || 'affId'
    try {
        const url = new URL(permalink)
        url.searchParams.set(param, affiliateId)
        return url.toString()
    } catch {
        return permalink
    }
}

function normalizeImageUrl(url: string): string {
    return url.replace('http://', 'https://').replace(/-[A-Z]\.jpg/, '-O.jpg')
}

function fmtPrice(price: number): string {
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

async function checkStock(pid: string, token: string): Promise<{ hasStock: boolean; price: string | null }> {
    const itemRes = await fetch(`${ML_API}/items/${pid}`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null)
    if (itemRes?.ok) {
        const item: Record<string, unknown> = await itemRes.json()
        const status = String(item.status ?? '')
        const availableQuantity = typeof item.available_quantity === 'number' ? item.available_quantity : 0
        const price = typeof item.price === 'number' ? fmtPrice(item.price) : null
        return { hasStock: status === 'active' && availableQuantity > 0, price }
    }

    const res = await fetch(`${ML_API}/products/${pid}/items?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null)
    if (!res?.ok) return { hasStock: false, price: null }
    const data: { results?: Array<Record<string, unknown>> } = await res.json()
    const items = data.results ?? []
    if (items.length === 0) return { hasStock: false, price: null }
    const price = typeof items[0].price === 'number' ? fmtPrice(items[0].price) : null
    return { hasStock: true, price }
}

async function searchCatalogProducts(
    q: string,
    token: string,
    userId: string,
    limit = SEARCH_LIMIT,
    offset = 0,
    maxResults = MAX_PER_QUERY,
    skipIds: Set<string> = new Set()
): Promise<CatalogProduct[]> {
    const params = new URLSearchParams({ site_id: 'MLB', q, limit: String(limit), status: 'active' })
    if (offset > 0) params.set('offset', String(offset))
    const res = await fetch(`${ML_API}/products/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []
    const results: Array<Record<string, unknown>> = (await res.json()).results ?? []

    const products: CatalogProduct[] = []
    let checkedCandidates = 0

    for (const r of results) {
        if (products.length >= maxResults) break
        if (checkedCandidates >= MAX_CANDIDATES_PER_PAGE) break
        const pid = String(r.catalog_product_id || r.id || '')
        if (!pid) continue
        if (skipIds.has(pid)) continue

        const name = String(r.name ?? '')
        if (!isRelevantProductTitle(name)) continue
        checkedCandidates++

        // Valida estoque e detalhes em paralelo para manter o cron abaixo do timeout.
        const [stock, detail] = await Promise.all([
            checkStock(pid, token),
            fetch(`${ML_API}/products/${pid}`, {
                headers: { Authorization: `Bearer ${token}` },
            }).then(d => d.ok ? d.json() : null).catch(() => null),
        ])
        if (!stock.hasStock) continue
        if (!detail || detail.status !== 'active') continue

        const pics: Array<{ url?: string }> = detail.pictures ?? []
        const rawImg = pics[0]?.url ?? ''
        const imageUrl = normalizeImageUrl(rawImg)
        if (!imageUrl) continue

        products.push({
            id: pid,
            name,
            imageUrl,
            affiliateUrl: makeAffiliateUrl(pid, userId),
            price: stock.price,
        })
    }

    return products
}

async function searchMarketplaceItems(
    q: string,
    token: string,
    userId: string,
    limit = SEARCH_LIMIT,
    offset = 0,
    maxResults = MAX_PER_QUERY,
    skipIds: Set<string> = new Set()
): Promise<CatalogProduct[]> {
    const params = new URLSearchParams({ q, limit: String(limit), offset: String(offset) })
    const res = await fetch(`${ML_API}/sites/MLB/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return []

    const results: Array<Record<string, unknown>> = (await res.json()).results ?? []
    const products: CatalogProduct[] = []

    for (const r of results) {
        if (products.length >= maxResults) break

        const id = String(r.id ?? '')
        if (!id || skipIds.has(id)) continue

        const name = String(r.title ?? '')
        if (!isRelevantProductTitle(name)) continue

        const availableQuantity = typeof r.available_quantity === 'number' ? r.available_quantity : 0
        if (availableQuantity <= 0) continue

        const imageUrl = normalizeImageUrl(String(r.thumbnail ?? ''))
        if (!imageUrl) continue

        const permalink = String(r.permalink ?? '')
        const price = typeof r.price === 'number' ? fmtPrice(r.price) : null

        products.push({
            id,
            name,
            imageUrl,
            affiliateUrl: permalink ? makeAffiliateUrlFromPermalink(permalink, userId) : makeAffiliateUrl(id, userId),
            price,
        })
    }

    return products
}

function auth(req: NextRequest): boolean {
    const secret = process.env.CRON_SECRET
    if (!secret) return false
    const provided = req.headers.get('authorization')?.replace('Bearer ', '') ?? req.nextUrl.searchParams.get('token') ?? ''
    try {
        return timingSafeEqual(Buffer.from(secret), Buffer.from(provided))
    } catch {
        return false
    }
}

export async function POST(req: NextRequest) {
    if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const startedAt = Date.now()
    try {

    const token = await getValidToken()
    if (!token) {
        return NextResponse.json({ error: 'Token ML indisponível. Configure ML_APP_ID, ML_SECRET_KEY e mlRefreshToken no banco.' }, { status: 503 })
    }

    // ── FASE 1: Verificar estoque dos produtos existentes ────────────────────
    // A cada execução, verifica uma amostra de 20 produtos ML existentes.
    // Se não tiver mais estoque, oculta. Se tiver, atualiza preço.
    const existingProducts = await prisma.storeProduct.findMany({
        where: { store: 'mercadolivre', isHidden: false, externalId: { not: null } },
        select: { id: true, externalId: true, price: true },
        orderBy: { updatedAt: 'asc' }, // os menos recentemente verificados primeiro
        take: 20,
    })

    let deactivated = 0
    let priceUpdated = 0
    for (const p of existingProducts) {
        if (!p.externalId) continue
        const { hasStock, price } = await checkStock(p.externalId, token.access_token)
        if (!hasStock) {
            await prisma.storeProduct.update({
                where: { id: p.id },
                data: { isHidden: true, isActive: false },
            })
            deactivated++
        } else if (price && price !== p.price) {
            await prisma.storeProduct.update({
                where: { id: p.id },
                data: { price, updatedAt: new Date() },
            })
            priceUpdated++
        } else {
            // Toca updatedAt para rodar em lote sem re-verificar sempre os mesmos
            await prisma.storeProduct.update({ where: { id: p.id }, data: { updatedAt: new Date() } })
        }
        await new Promise(r => setTimeout(r, 300))
    }

    // ── FASE 2: Importar novos produtos ──────────────────────────────────────
    const activeCount = await prisma.storeProduct.count({ where: { isActive: true, isHidden: false } })
    const slotsAvailable = MAX_TOTAL_ACTIVE - activeCount

    const existing = await prisma.storeProduct.findMany({
        where: { store: 'mercadolivre' },
        select: { id: true, externalId: true },
    })
    const existingIds = new Set(existing.map(p => p.externalId).filter((id): id is string => Boolean(id)))

    const imported: string[] = []
    const skipped: string[] = []
    let searchedPages = 0
    let duplicateCandidates = 0
    let totalImported = 0
    let stoppedEarly = false

    // Constrói lista de queries: dinâmicas (baseadas em trendingScore) + estáticas
    const dynamicQueries = await buildDynamicQueries()
    const allQueries = [...dynamicQueries, ...STATIC_QUERIES]

    // Rotação: cada run processa uma fatia diferente
    const querySlices = Math.ceil(allQueries.length / QUERIES_PER_RUN)
    const manualRunSeed = Math.floor(Date.now() / (1000 * 60 * 10)) + Math.floor(activeCount / 40)
    const sliceStart = (manualRunSeed % querySlices) * QUERIES_PER_RUN
    const queriesToRun = allQueries.slice(sliceStart, sliceStart + QUERIES_PER_RUN)

    // Offset rotativo para descobrir produtos além dos top-20 de cada query
    const cycleCount = Math.floor(manualRunSeed / querySlices)
    const searchOffset = (cycleCount * SEARCH_LIMIT) % 250

    for (const { q, category } of queriesToRun) {
        if (slotsAvailable - totalImported <= 0) break
        if (!hasTimeLeft(startedAt)) {
            stoppedEarly = true
            break
        }

        // Busca páginas rotativas e para cedo quando já há candidatos suficientes.
        const queryResults: CatalogProduct[] = []
        for (let page = 0; page < SEARCH_PAGES_PER_QUERY && queryResults.length < MAX_PER_QUERY; page++) {
            if (!hasTimeLeft(startedAt)) {
                stoppedEarly = true
                break
            }
            const pageOffset = searchOffset + page * SEARCH_LIMIT
            const marketplaceResults = await searchMarketplaceItems(
                q,
                token.access_token,
                token.user_id,
                SEARCH_LIMIT,
                pageOffset,
                MAX_PER_QUERY - queryResults.length,
                existingIds,
            )
            queryResults.push(...marketplaceResults)

            const remaining = MAX_PER_QUERY - queryResults.length
            const catalogResults = remaining > 0
                ? await searchCatalogProducts(
                    q,
                    token.access_token,
                    token.user_id,
                    SEARCH_LIMIT,
                    pageOffset,
                    remaining,
                    existingIds,
                )
                : []
            searchedPages++
            queryResults.push(...catalogResults)
            await new Promise(r => setTimeout(r, 350))
        }
        const qualified = queryResults.slice(0, MAX_PER_QUERY)

        for (const r of qualified) {
            if (existingIds.has(r.id)) {
                duplicateCandidates++
                // Atualiza preço e URL do produto existente
                await prisma.storeProduct.updateMany({
                    where: { store: 'mercadolivre', externalId: r.id },
                    data: {
                        name: r.name,
                        imageUrl: r.imageUrl,
                        affiliateUrl: r.affiliateUrl,
                        price: r.price,
                        isHidden: false,
                        isActive: true,
                    },
                })
                continue
            }

            if (totalImported >= slotsAvailable) break

            const finalCategory = detectCategory(r.name, category)
            const productTags = extractArtistTags(r.name)

            const created = await prisma.storeProduct.create({
                data: {
                    name: r.name,
                    imageUrl: r.imageUrl,
                    affiliateUrl: r.affiliateUrl,
                    store: 'mercadolivre',
                    category: finalCategory,
                    externalId: r.id,
                    isActive: true,
                    isHidden: false,
                    position: 9999,
                    price: r.price,
                    tags: productTags,
                },
            })

            // Auto-link: associar produto a artistas/grupos cujo nome aparece no título
            if (productTags.length > 0) {
                const [matchingArtists, matchingGroups] = await Promise.all([
                    prisma.artist.findMany({
                        where: {
                            isHidden: false,
                            OR: productTags.flatMap(tag => [
                                { nameRomanized: { contains: tag, mode: 'insensitive' as const } },
                                { nameHangul: { contains: tag, mode: 'insensitive' as const } },
                            ]),
                        },
                        select: { id: true },
                        take: 3,
                    }),
                    prisma.musicalGroup.findMany({
                        where: {
                            isHidden: false,
                            OR: productTags.flatMap(tag => [
                                { name: { contains: tag, mode: 'insensitive' as const } },
                                { nameHangul: { contains: tag, mode: 'insensitive' as const } },
                            ]),
                        },
                        select: { id: true },
                        take: 3,
                    }),
                ])
                await Promise.all([
                    ...matchingArtists.map(a =>
                        StoreProductRepository.upsertLink(created.id, 'artist', a.id, 0.8, 'auto')
                    ),
                    ...matchingGroups.map(g =>
                        StoreProductRepository.upsertLink(created.id, 'group', g.id, 0.8, 'auto')
                    ),
                ])
            }

            existingIds.add(r.id)
            imported.push(r.name)
            totalImported++
        }

        for (const r of queryResults.filter(r => existingIds.has(r.id))) {
            skipped.push(r.id)
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 900))
    }

    // ── FASE 3: Posição por cliques ───────────────────────────────────────────
    // Produtos com mais cliques ganham posição menor (aparecem primeiro na vitrine)
    const clickedProducts = await prisma.storeProduct.findMany({
        where: { isActive: true, isHidden: false, clickCount: { gt: 0 } },
        select: { id: true, clickCount: true },
        orderBy: { clickCount: 'desc' },
    })
    for (let i = 0; i < clickedProducts.length; i++) {
        await prisma.storeProduct.update({
            where: { id: clickedProducts[i].id },
            data: { position: i },
        })
    }

    // ── FASE 4: Deduplicação ──────────────────────────────────────────────────
    // Remove duplicatas com nome muito similar (mesmo prefixo de 45 chars),
    // mantendo o com mais cliques ou o mais barato
    const dupeGroups = await prisma.$queryRaw<Array<{ prefix: string; ids: string[] }>>`
        SELECT LEFT(name, 45) as prefix, ARRAY_AGG(id ORDER BY "clickCount" DESC, price ASC NULLS LAST) as ids
        FROM "StoreProduct"
        WHERE "isHidden" = false AND store = 'mercadolivre'
        GROUP BY LEFT(name, 45)
        HAVING COUNT(*) > 1
    `
    let deduped = 0
    for (const group of dupeGroups) {
        const [, ...toRemove] = group.ids  // mantém o primeiro (mais clicado/barato)
        if (toRemove.length > 0) {
            await prisma.storeProductLink.deleteMany({ where: { productId: { in: toRemove } } })
            await prisma.storeProduct.deleteMany({ where: { id: { in: toRemove } } })
            deduped += toRemove.length
        }
    }

    const activeTotal = activeCount + imported.length

    return NextResponse.json({
        ok: true,
        message: `ML sync: imported=${imported.length}, activeTotal=${activeTotal}`,
        imported: imported.length,
        deactivated,
        priceUpdated,
        deduped,
        searchedPages,
        duplicateCandidates,
        searchOffset,
        dynamicQueries: dynamicQueries.length,
        stoppedEarly,
        activeTotal,
    })
    } catch (e) {
        console.error('[sync-ml] error:', e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
