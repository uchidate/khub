import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import fs from 'fs'
import path from 'path'

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
    // Produção: ler de env vars
    if (process.env.ML_ACCESS_TOKEN && process.env.ML_USER_ID) {
        return { access_token: process.env.ML_ACCESS_TOKEN, user_id: Number(process.env.ML_USER_ID) }
    }
    // Dev: ler do arquivo local
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

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50)

    if (!q) return NextResponse.json({ error: 'Parâmetro q obrigatório' }, { status: 400 })

    const token = getToken()
    if (!token) return NextResponse.json({ error: 'Token ML não encontrado. Execute scripts/mercadolivre/auth.py' }, { status: 503 })

    const res = await fetch(
        `${ML_API}/products/search?site_id=MLB&q=${encodeURIComponent(q)}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token.access_token}` } }
    )

    if (!res.ok) {
        return NextResponse.json({ error: `ML API erro ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const userId = String(token.user_id)

    const results = (data.results as Record<string, unknown>[])
        .filter(r => {
            const title = (r.name as string || '').toLowerCase()
            return KPOP_KEYWORDS.some(k => title.includes(k))
        })
        .map(r => {
            const pid = (r.catalog_product_id as string) || (r.id as string)
            const title = r.name as string
            let img = (r.thumbnail as string) || ''
            img = img.replace(/-[A-Z]\.jpg/, '-O.jpg').replace('http://', 'https://')
            const buyBox = r.buy_box_winner as Record<string, unknown> | undefined
            const price = buyBox?.price
                ? `R$ ${Number(buyBox.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                : null
            const rating = (r.rating as Record<string, unknown>)?.average as number | undefined
            const reviewCount = (r.rating as Record<string, unknown>)?.total_ratings as number | undefined
            return {
                id:           pid,
                name:         title,
                imageUrl:     img,
                affiliateUrl: `https://www.mercadolivre.com.br/p/${pid}?affId=${userId}`,
                category:     detectCategory(title),
                store:        'mercadolivre',
                price,
                rating:       rating ? Math.round(rating * 10) / 10 : null,
                reviewCount:  reviewCount ?? null,
            }
        })

    return NextResponse.json({ results, total: data.paging?.total ?? 0 })
}
