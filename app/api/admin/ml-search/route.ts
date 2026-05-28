import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'
import {
    buildMercadoLivreAffiliateUrl,
    resolveActiveMercadoLivreOffer,
    type MlCatalogResult,
} from '@/lib/store/mercadolivre'

export const dynamic = 'force-dynamic'

const ML_API = 'https://api.mercadolibre.com'
const TOKEN_PATH = path.join(process.cwd(), 'scripts/mercadolivre/token.json')

const KPOP_KEYWORDS = [
    'kpop', 'k-pop', 'album', 'lightstick', 'photocard',
    'bts', 'blackpink', 'twice', 'exo', 'nct', 'stray kids',
    'aespa', 'itzy', 'txt', 'seventeen', 'got7', 'ive',
    'newjeans', 'le sserafim', 'enhypen', 'ateez', 'monsta x',
    'super junior', 'shinee', 'bigbang', 'red velvet', 'mamamoo',
]

function getToken(): { access_token: string; user_id: number } | null {
    if (process.env.ML_ACCESS_TOKEN && process.env.ML_USER_ID) {
        return { access_token: process.env.ML_ACCESS_TOKEN, user_id: Number(process.env.ML_USER_ID) }
    }
    try {
        return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
    } catch {
        return null
    }
}

function detectCategory(title: string): string {
    const t = title.toLowerCase()
    if (['album', 'mini album', 'single album', 'full album'].some(w => t.includes(w))) return 'kpop_album'
    if (t.includes('lightstick')) return 'lightstick'
    if (['beauty', 'skin', 'essence', 'toner', 'creme', 'mask'].some(w => t.includes(w))) return 'kbeauty'
    if (['drama', 'série', 'serie', 'bluray', 'dorama'].some(w => t.includes(w))) return 'kdrama'
    if (t.includes('photocard')) return 'photocard'
    if (['camiseta', 'moletom', 'roupa', 'hoodie'].some(w => t.includes(w))) return 'clothing'
    return 'outros'
}

async function getOgImage(pid: string): Promise<string> {
    try {
        const pageRes = await fetch(`https://www.mercadolivre.com.br/p/${pid}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' },
            signal: AbortSignal.timeout(4000),
        })
        const html = await pageRes.text()
        const match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
                   ?? html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/)
        return match?.[1] ?? ''
    } catch {
        return ''
    }
}

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!q) return NextResponse.json({ error: 'Parâmetro q obrigatório' }, { status: 400 })

    const token = getToken()
    if (!token) return NextResponse.json({ error: 'Token ML não encontrado. Execute scripts/mercadolivre/auth.py' }, { status: 503 })

    const [res, existingProducts] = await Promise.all([
        fetch(
            `${ML_API}/products/search?site_id=MLB&q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&status=active`,
            { headers: { Authorization: `Bearer ${token.access_token}` } }
        ),
        prisma.storeProduct.findMany({
            where: { store: 'mercadolivre' },
            select: { affiliateUrl: true, externalId: true },
        }),
    ])

    if (!res.ok) {
        return NextResponse.json({ error: `ML API erro ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const userId = String(token.user_id)

    // Build set of already-imported ML product IDs (extracted from affiliateUrl)
    const importedIds = new Set(
        existingProducts
            .flatMap(p => [p.externalId, p.affiliateUrl.match(/\/p\/(MLB[^?]+)/)?.[1]])
            .filter(Boolean)
    )

    const filtered = (data.results as Record<string, unknown>[])
        .filter(r => {
            const title = (r.name as string || '').toLowerCase()
            return KPOP_KEYWORDS.some(k => title.includes(k))
        })

    const resolved = await Promise.all(
        filtered.map(async r => {
            const pid = (r.catalog_product_id as string) || (r.id as string)
            const title = r.name as string
            const pictures = r.pictures as { url?: string }[] | undefined
            const apiImg = pictures?.[0]?.url ?? ''
            const offer = await resolveActiveMercadoLivreOffer(r as MlCatalogResult, token)
            if (!offer) return null

            const imageUrl = offer.imageUrl || apiImg || await getOgImage(pid)
            const price = offer.price
                ? `R$ ${offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : null
            const rating = (r.rating as Record<string, unknown>)?.average as number | undefined
            const reviewCount = (r.rating as Record<string, unknown>)?.total_ratings as number | undefined
            return {
                id:           offer.catalogProductId,
                itemId:       offer.itemId,
                name:         title,
                imageUrl,
                affiliateUrl: buildMercadoLivreAffiliateUrl(offer.permalink, {
                    productId: offer.catalogProductId,
                    itemId: offer.itemId,
                    tokenUserId: userId,
                }),
                category:     detectCategory(title),
                store:        'mercadolivre',
                price,
                rating:       rating ? Math.round(rating * 10) / 10 : null,
                reviewCount:  reviewCount ?? null,
                soldCount:    offer.soldQuantity != null ? String(offer.soldQuantity) : null,
                alreadyImported: importedIds.has(pid) || importedIds.has(offer.catalogProductId),
            }
        })
    )
    const results = resolved.filter((item): item is NonNullable<typeof item> => Boolean(item))

    return NextResponse.json({
        results: results.filter(r => r.imageUrl),
        total: data.paging?.total ?? 0,
        offset,
    })
}
