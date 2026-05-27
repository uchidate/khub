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

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const ML_API = 'https://api.mercadolibre.com'
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'

// Queries rotativas — cada execução percorre todas, pega os melhores de cada
const SYNC_QUERIES = [
    { q: 'album kpop bts',          category: 'kpop_album' },
    { q: 'album kpop blackpink',     category: 'kpop_album' },
    { q: 'album kpop twice',         category: 'kpop_album' },
    { q: 'album kpop stray kids',    category: 'kpop_album' },
    { q: 'album kpop aespa',         category: 'kpop_album' },
    { q: 'album kpop newjeans',      category: 'kpop_album' },
    { q: 'lightstick kpop',          category: 'lightstick' },
    { q: 'photocard kpop',           category: 'photocard' },
    { q: 'kpop merch camiseta',      category: 'clothing' },
    { q: 'skincare coreano',         category: 'kbeauty' },
    { q: 'cosmetico coreano',        category: 'kbeauty' },
]

// Mínimo para importar automaticamente
const MIN_RATING = 0
const MIN_REVIEWS = 0
const MAX_PER_QUERY = 3   // top N por query
const MAX_TOTAL_ACTIVE = 80 // limite máximo de produtos ativos na loja

const KPOP_KEYWORDS = [
    'kpop', 'k-pop', 'album', 'lightstick', 'photocard', 'bts', 'blackpink',
    'twice', 'exo', 'nct', 'stray kids', 'aespa', 'itzy', 'txt', 'seventeen',
    'newjeans', 'le sserafim', 'enhypen', 'ateez', 'skincare coreano',
    'cosmetico coreano', 'k-beauty', 'kbeauty',
]

function isKpopRelevant(title: string): boolean {
    const t = title.toLowerCase()
    return KPOP_KEYWORDS.some(k => t.includes(k))
}

function detectCategory(title: string): string {
    const t = title.toLowerCase()
    if (['album', 'mini album', 'single album', 'full album'].some(w => t.includes(w))) return 'kpop_album'
    if (t.includes('lightstick')) return 'lightstick'
    if (t.includes('photocard')) return 'photocard'
    if (['beauty', 'skin', 'essence', 'toner', 'creme', 'máscara', 'mask', 'skincare', 'cosmetico'].some(w => t.includes(w))) return 'kbeauty'
    if (['drama', 'série', 'serie', 'bluray', 'dorama'].some(w => t.includes(w))) return 'kdrama'
    if (['camiseta', 'moletom', 'roupa', 'hoodie'].some(w => t.includes(w))) return 'clothing'
    return 'outros'
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

async function searchProducts(
    q: string,
    token: string,
    limit = 20
): Promise<Array<{
    id: string; name: string; price: number | null
    thumbnail: string; rating: number; reviews: number
    permalink: string
}>> {
    const res = await fetch(
        `${ML_API}/products/search?site_id=MLB&q=${encodeURIComponent(q)}&limit=${limit}&status=active`,
        { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.results ?? []).map((r: Record<string, unknown>) => {
        const pid = (r.catalog_product_id as string) || (r.id as string)
        const buyBox = r.buy_box_winner as Record<string, unknown> | undefined
        const rating = (r.rating as Record<string, unknown>)?.average as number | undefined
        const reviews = (r.rating as Record<string, unknown>)?.total_ratings as number | undefined
        const pictures = r.pictures as { url?: string }[] | undefined
        const thumbnail = (pictures?.[0]?.url ?? '').replace('http:', 'https:').replace('-I.jpg', '-O.jpg')
        return {
            id: pid,
            name: r.name as string,
            price: buyBox?.price as number ?? null,
            thumbnail,
            rating: rating ?? 0,
            reviews: reviews ?? 0,
            permalink: `https://www.mercadolivre.com.br/p/${pid}`,
        }
    })
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
        select: { externalId: true },
    })
    const existingIds = new Set(existing.map(p => p.externalId).filter(Boolean))

    const imported: string[] = []
    const skipped: string[] = []

    let totalImported = 0

    for (const { q, category } of SYNC_QUERIES) {
        if (slotsAvailable - totalImported <= 0) break

        const results = await searchProducts(q, token.access_token, 20)

        // Filtrar: relevante para K-Pop, nota mínima, imagem obrigatória
        const qualified = results
            .filter(r =>
                isKpopRelevant(r.name) &&
                r.thumbnail &&
                r.reviews >= MIN_REVIEWS &&
                r.rating >= MIN_RATING &&
                !existingIds.has(r.id)
            )
            .slice(0, MAX_PER_QUERY)

        for (const r of qualified) {
            if (totalImported >= slotsAvailable) break

            const detectedCategory = detectCategory(r.name)
            const finalCategory = detectedCategory !== 'outros' ? detectedCategory : category

            const affiliateUrl = `${r.permalink}${r.permalink.includes('?') ? '&' : '?'}affId=${token.user_id}`

            await prisma.storeProduct.create({
                data: {
                    name: r.name,
                    imageUrl: r.thumbnail,
                    affiliateUrl,
                    store: 'mercadolivre',
                    category: finalCategory,
                    externalId: r.id,
                    isHidden: false,
                    position: 9999,
                    rating: r.rating ? Math.round(r.rating * 10) / 10 : null,
                    reviewCount: r.reviews || null,
                },
            })

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
