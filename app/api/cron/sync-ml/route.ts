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

// Queries rotativas — cada execução percorre todas, pega os melhores de cada
const SYNC_QUERIES = [
    // ── Álbuns por grupo ─────────────────────────────────────────────────────
    { q: 'album kpop bts',            category: 'kpop_album' },
    { q: 'album kpop blackpink',      category: 'kpop_album' },
    { q: 'album kpop twice',          category: 'kpop_album' },
    { q: 'album kpop stray kids',     category: 'kpop_album' },
    // ── Photocards — alta disponibilidade de estoque (6-7/10) ────────────────
    { q: 'photocard kpop blackpink',  category: 'photocard' },
    { q: 'photocard kpop bts',        category: 'photocard' },
    { q: 'photocard kpop stray kids', category: 'photocard' },
    { q: 'photocard kpop twice',      category: 'photocard' },
    { q: 'photocard kpop aespa',      category: 'photocard' },
    { q: 'photocard kpop newjeans',   category: 'photocard' },
    { q: 'photocard kpop ive',        category: 'photocard' },
    { q: 'photocard kpop seventeen',  category: 'photocard' },
    { q: 'photocard kpop enhypen',    category: 'photocard' },
    { q: 'photocard kpop le sserafim',category: 'photocard' },
    { q: 'photocard kpop txt',        category: 'photocard' },
    { q: 'photocard kpop ateez',      category: 'photocard' },
    { q: 'photocard kpop nct',        category: 'photocard' },
    { q: 'photocard kpop itzy',       category: 'photocard' },
    { q: 'photocard kpop gidle',      category: 'photocard' },
    // ── Comida Coreana — alta disponibilidade (5-7/10) ────────────────────────
    { q: 'buldak',                    category: 'alimenta' },
    { q: 'shin ramyun',               category: 'alimenta' },
    { q: 'doce coreano',              category: 'alimenta' },
    { q: 'pepero',                    category: 'alimenta' },
    { q: 'choco pie coreano',         category: 'alimenta' },
    { q: 'chapagetti',                category: 'alimenta' },
    { q: 'tteokbokki',                category: 'alimenta' },
    { q: 'snack coreano',             category: 'alimenta' },
    { q: 'ramen coreano',             category: 'alimenta' },
    // ── K-Beauty ──────────────────────────────────────────────────────────────
    { q: 'skincare coreano',          category: 'kbeauty' },
    { q: 'serum coreano',             category: 'kbeauty' },
    { q: 'toner coreano',             category: 'kbeauty' },
    // ── Álbuns — disponibilidade variável, mantém algumas queries ─────────────
    { q: 'album kpop blackpink',      category: 'kpop_album' },
    { q: 'album kpop bts',            category: 'kpop_album' },
    { q: 'album kpop stray kids',     category: 'kpop_album' },
    { q: 'album kpop twice',          category: 'kpop_album' },
    { q: 'album kpop newjeans',       category: 'kpop_album' },
    { q: 'album kpop aespa',          category: 'kpop_album' },
    { q: 'mini album kpop',           category: 'kpop_album' },
]

const MAX_PER_QUERY = 5
const MAX_TOTAL_ACTIVE = 500
const QUERIES_PER_RUN = 8

const GROUP_TAGS = [
    'blackpink', 'bts', 'twice', 'stray kids', 'aespa', 'ive', 'newjeans',
    'seventeen', 'le sserafim', 'enhypen', 'txt', 'nct', 'ateez', 'exo',
    'shinee', 'got7', 'red velvet', 'mamamoo', 'itzy', 'nmixx', 'babymonster',
    'zerobaseone', 'bigbang', 'super junior', 'the boyz', 'sf9', 'monsta x',
    'iu', 'gidle', 'g-idle',
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

function normalizeImageUrl(url: string): string {
    return url.replace('http://', 'https://').replace(/-[A-Z]\.jpg/, '-O.jpg')
}

function fmtPrice(price: number): string {
    return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

async function searchCatalogProducts(
    q: string,
    token: string,
    userId: string,
    limit = 20
): Promise<CatalogProduct[]> {
    const res = await fetch(
        `${ML_API}/products/search?site_id=MLB&q=${encodeURIComponent(q)}&limit=${limit}&status=active`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return []
    const results: Array<Record<string, unknown>> = (await res.json()).results ?? []

    const products: CatalogProduct[] = []

    for (const r of results) {
        const pid = String(r.catalog_product_id || r.id || '')
        if (!pid) continue

        // 1. Valida estoque real: /products/{id}/items retorna sellers ativos
        const itemsRes = await fetch(`${ML_API}/products/${pid}/items?limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null)
        if (!itemsRes?.ok) continue
        const itemsData: { results?: Array<Record<string, unknown>> } = await itemsRes.json()
        const items = itemsData.results ?? []
        if (items.length === 0) continue  // sem vendedores ativos = sem estoque

        const price = typeof items[0].price === 'number' ? fmtPrice(items[0].price) : null

        // 2. Busca imagem do catálogo
        const detail = await fetch(`${ML_API}/products/${pid}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(d => d.ok ? d.json() : null).catch(() => null)
        if (!detail || detail.status !== 'active') continue

        const pics: Array<{ url?: string }> = detail.pictures ?? []
        const rawImg = pics[0]?.url ?? ''
        const imageUrl = normalizeImageUrl(rawImg)
        if (!imageUrl) continue

        products.push({
            id: pid,
            name: String(r.name ?? ''),
            imageUrl,
            affiliateUrl: makeAffiliateUrl(pid, userId),
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
    try {

    const token = await getValidToken()
    if (!token) {
        return NextResponse.json({ error: 'Token ML indisponível. Configure ML_APP_ID, ML_SECRET_KEY e mlRefreshToken no banco.' }, { status: 503 })
    }

    // Contagem atual de produtos ativos
    const activeCount = await prisma.storeProduct.count({ where: { isHidden: false } })
    const slotsAvailable = MAX_TOTAL_ACTIVE - activeCount

    // IDs já importados
    const existing = await prisma.storeProduct.findMany({
        where: { store: 'mercadolivre' },
        select: { id: true, externalId: true },
    })
    const existingIds = new Set(existing.map(p => p.externalId).filter(Boolean))

    const imported: string[] = []
    const skipped: string[] = []

    let totalImported = 0

    // Rotação: cada execução processa uma fatia de QUERIES_PER_RUN queries.
    // O índice de início é baseado na hora UTC atual, garantindo que ao longo
    // do dia todas as queries sejam executadas sem sobrecarregar a API do ML.
    const sliceStart = (Math.floor(Date.now() / (1000 * 60 * 60)) % Math.ceil(SYNC_QUERIES.length / QUERIES_PER_RUN)) * QUERIES_PER_RUN
    const queriesToRun = SYNC_QUERIES.slice(sliceStart, sliceStart + QUERIES_PER_RUN)

    for (const { q, category } of queriesToRun) {
        if (slotsAvailable - totalImported <= 0) break

        // Busca catálogos com estoque real validado via /items endpoint
        const results = await searchCatalogProducts(q, token.access_token, token.user_id, 20)
        const qualified = results.slice(0, MAX_PER_QUERY)

        for (const r of qualified) {
            if (existingIds.has(r.id)) {
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

        for (const r of results.filter(r => existingIds.has(r.id))) {
            skipped.push(r.id)
        }

        // Respeitar rate limit ML (10 req/s)
        await new Promise(r => setTimeout(r, 2000))
    }

    return NextResponse.json({
        ok: true,
        imported: imported.length,
        skipped: skipped.length,
        products: imported,
        activeTotal: activeCount + imported.length,
    })
    } catch (e) {
        console.error('[sync-ml] error:', e)
        return NextResponse.json({ error: String(e) }, { status: 500 })
    }
}
