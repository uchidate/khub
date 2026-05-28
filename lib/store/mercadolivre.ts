const ML_API = 'https://api.mercadolibre.com'

type MlFetch = typeof fetch

export type MercadoLivreToken = {
    access_token: string
    user_id?: string | number | null
}

export type MlCatalogResult = Record<string, unknown> & {
    id?: string
    catalog_product_id?: string
    name?: string
    pictures?: { url?: string }[]
    buy_box_winner?: Record<string, unknown>
    rating?: Record<string, unknown>
}

export type ActiveMlOffer = {
    itemId: string
    catalogProductId: string
    title: string
    price: number | null
    imageUrl: string
    permalink: string
    availableQuantity: number | null
    soldQuantity: number | null
}

function asNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

function normalizeImageUrl(value: string): string {
    return value.replace('http://', 'https://').replace('-I.jpg', '-O.jpg')
}

function firstImage(result: MlCatalogResult): string {
    const pictures = result.pictures
    return normalizeImageUrl(pictures?.[0]?.url ?? '')
}

function getCatalogProductId(result: MlCatalogResult): string {
    return asString(result.catalog_product_id) || asString(result.id)
}

function getAffiliateId(tokenUserId?: string | number | null): string {
    return (
        process.env.ML_AFFILIATE_ID ||
        process.env.ML_AFFILIATE_CID ||
        process.env.ML_USER_ID ||
        (tokenUserId != null ? String(tokenUserId) : '')
    )
}

export function buildMercadoLivreAffiliateUrl(
    permalink: string,
    options: { productId?: string; itemId?: string; tokenUserId?: string | number | null } = {}
): string {
    const affiliateId = getAffiliateId(options.tokenUserId)
    const template = process.env.ML_AFFILIATE_URL_TEMPLATE

    if (template) {
        return template
            .replaceAll('{url}', encodeURIComponent(permalink))
            .replaceAll('{permalink}', permalink)
            .replaceAll('{productId}', options.productId ?? '')
            .replaceAll('{itemId}', options.itemId ?? '')
            .replaceAll('{affiliateId}', affiliateId)
    }

    if (!affiliateId) return permalink

    const url = new URL(permalink)
    const param = process.env.ML_AFFILIATE_PARAM || 'affId'
    url.searchParams.set(param, affiliateId)
    return url.toString()
}

export function isOfficialMercadoLivreAffiliateUrl(value: string): boolean {
    try {
        const url = new URL(value)
        const host = url.hostname.replace(/^www\./, '')

        if (host === 'meli.la') return true
        if (host !== 'mercadolivre.com.br') return false

        const path = url.pathname.toLowerCase()
        return (
            path.startsWith('/social/') &&
            Boolean(url.searchParams.get('matt_word')) &&
            Boolean(url.searchParams.get('ref'))
        )
    } catch {
        return false
    }
}

async function fetchItem(itemId: string, accessToken: string, fetcher: MlFetch): Promise<Record<string, unknown> | null> {
    const res = await fetcher(`${ML_API}/items/${itemId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return res.json()
}

function itemToActiveOffer(
    item: Record<string, unknown>,
    catalogProductId: string,
    fallbackTitle: string,
    fallbackImageUrl: string
): ActiveMlOffer | null {
    const status = asString(item.status)
    const buyingMode = asString(item.buying_mode)
    const permalink = asString(item.permalink)
    const itemId = asString(item.id)
    const availableQuantity = asNumber(item.available_quantity)

    if (!itemId || status !== 'active' || buyingMode !== 'buy_it_now' || !permalink) return null
    if (availableQuantity != null && availableQuantity <= 0) return null

    const pictures = item.pictures as { secure_url?: string; url?: string }[] | undefined
    const imageUrl = normalizeImageUrl(
        pictures?.[0]?.secure_url || pictures?.[0]?.url || asString(item.thumbnail) || fallbackImageUrl
    )

    return {
        itemId,
        catalogProductId,
        title: asString(item.title) || fallbackTitle,
        price: asNumber(item.price),
        imageUrl,
        permalink,
        availableQuantity,
        soldQuantity: asNumber(item.sold_quantity),
    }
}

function buyBoxToOffer(result: MlCatalogResult): ActiveMlOffer | null {
    const productId = getCatalogProductId(result)
    const buyBox = result.buy_box_winner
    if (!productId || !buyBox) return null

    const itemId = asString(buyBox.item_id) || asString(buyBox.id)
    const status = asString(buyBox.status)
    const permalink = asString(buyBox.permalink)
    const availableQuantity = asNumber(buyBox.available_quantity)

    if (!itemId || (status && status !== 'active') || !permalink) return null
    if (availableQuantity != null && availableQuantity <= 0) return null

    return {
        itemId,
        catalogProductId: productId,
        title: asString(result.name),
        price: asNumber(buyBox.price),
        imageUrl: firstImage(result),
        permalink,
        availableQuantity,
        soldQuantity: asNumber(buyBox.sold_quantity),
    }
}

async function fetchProductItemIds(productId: string, accessToken: string, fetcher: MlFetch): Promise<string[]> {
    const res = await fetcher(`${ML_API}/products/${productId}/items?limit=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return []

    const data = await res.json()
    const results = Array.isArray(data.results) ? data.results : []
    return results
        .map((item: unknown) => {
            if (typeof item === 'string') return item
            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>
                return asString(record.item_id) || asString(record.id)
            }
            return ''
        })
        .filter(Boolean)
}

export async function resolveActiveMercadoLivreOffer(
    result: MlCatalogResult,
    token: MercadoLivreToken,
    fetcher: MlFetch = fetch
): Promise<ActiveMlOffer | null> {
    const productId = getCatalogProductId(result)
    if (!productId) return null

    const buyBoxOffer = buyBoxToOffer(result)
    if (buyBoxOffer) {
        const item = await fetchItem(buyBoxOffer.itemId, token.access_token, fetcher)
        const active = itemToActiveOffer(item ?? {}, productId, buyBoxOffer.title, buyBoxOffer.imageUrl)
        if (active) return active
    }

    const itemIds = await fetchProductItemIds(productId, token.access_token, fetcher)
    for (const itemId of itemIds) {
        const item = await fetchItem(itemId, token.access_token, fetcher)
        const active = itemToActiveOffer(item ?? {}, productId, asString(result.name), firstImage(result))
        if (active) return active
    }

    return null
}
