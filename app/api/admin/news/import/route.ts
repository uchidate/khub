/**
 * POST /api/admin/news/import
 *
 * Importa artigos históricos de uma fonte por intervalo de datas.
 * Estratégia dupla com fallback automático:
 *   1ª. WordPress REST API (/wp-json/wp/v2/posts?after=&before=) — mais rápida
 *   2ª. Scraping de páginas de listagem paginadas (/page/N/) — sempre disponível
 *
 * Query params:
 *   source:   nome da fonte (obrigatório)
 *   dateFrom: YYYY-MM-DD — filtra publishedAt >= dateFrom (obrigatório)
 *   dateTo:   YYYY-MM-DD — filtra publishedAt <= dateTo (default: hoje)
 *   limit:    máximo de artigos a importar por lote (default: 200, max: 200)
 *   offset:   pular N artigos descobertos (default: 0) — paginação em múltiplos lotes
 *   stream:   '1' — SSE com progresso em tempo real
 *
 * GET /api/admin/news/import?source=<source>&dateFrom=...&dateTo=...
 *   Retorna { available: number } — contagem de artigos na fonte no período.
 *   available = -1 indica que ambas as estratégias falharam.
 *
 * SSE events (quando stream=1):
 *   { type: 'start',    total: number, strategy: 'api'|'listing' }
 *   { type: 'item',     current, total, title, url, result: 'imported'|'exists'|'error' }
 *   { type: 'done',     imported, skipped, errors }
 *   { type: 'error',    message }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { normalizeSourceUrl } from '@/lib/utils/url'
import {
    WP_API_BASES,
    DiscoveredArticle,
    discoverViaWPAPI,
    importOne,
    decodeHtmlEntities,
    type ImportResult,
} from '@/lib/services/news-import-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ─── Listing fallback config ──────────────────────────────────────────────────

/** URL das páginas de listagem por fonte — fallback quando WP API está indisponível */
const LISTING_URLS: Record<string, (page: number) => string> = {
    Soompi:         (p) => p <= 1 ? 'https://www.soompi.com/'               : `https://www.soompi.com/page/${p}/`,
    Koreaboo:       (p) => p <= 1 ? 'https://www.koreaboo.com/news/'        : `https://www.koreaboo.com/news/page/${p}/`,
    Dramabeans:     (p) => p <= 1 ? 'https://dramabeans.com/'               : `https://dramabeans.com/page/${p}/`,
    'Asian Junkie': (p) => p <= 1 ? 'https://www.asianjunkie.com/'          : `https://www.asianjunkie.com/page/${p}/`,
    HelloKpop:      (p) => p <= 1 ? 'https://www.hellokpop.com/'            : `https://www.hellokpop.com/page/${p}/`,
    Kpopmap:        (p) => p <= 1 ? 'https://kpopmap.com/'                  : `https://kpopmap.com/page/${p}/`,
}

type DiscoveryStrategy = 'api' | 'listing'

// ─── Strategy 2: Paginated listing scraper (fallback) ────────────────────────

/**
 * Extrai artigos de uma página de listagem WordPress.
 * Funciona com qualquer tema WP que use <article> + <time datetime="..."> padrão.
 */
function extractArticlesFromListingPage(html: string): DiscoveredArticle[] {
    const results: DiscoveredArticle[] = []

    // Cada <article> é um post na listagem
    const articleBlockRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi
    let block: RegExpExecArray | null

    while ((block = articleBlockRegex.exec(html)) !== null) {
        const content = block[1]

        // Data: <time datetime="2025-01-15T10:00:00+00:00">
        const timeMatch = content.match(/<time[^>]*\bdatetime\s*=\s*["']([^"']+)["']/)
        if (!timeMatch) continue
        const date = new Date(timeMatch[1])
        if (isNaN(date.getTime())) continue

        // URL + título: link dentro de <h1>–<h6> (título do artigo)
        const headingLinkMatch = content.match(
            /<h[1-6][^>]*>[\s\S]*?<a[^>]*\bhref\s*=\s*["']([^"'#?]+)["'][^>]*>([\s\S]*?)<\/a>/i
        )
        if (!headingLinkMatch) continue

        const url   = headingLinkMatch[1].trim()
        const title = headingLinkMatch[2].replace(/<[^>]+>/g, '').trim()

        if (!url.startsWith('http')) continue

        results.push({ url, date, title })
    }

    return results
}

async function discoverViaListing(
    source: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
    offset = 0,
): Promise<DiscoveredArticle[]> {
    const pageUrl = LISTING_URLS[source]
    if (!pageUrl) throw new Error('Listing URL not configured for source')

    // Collect offset + limit articles to support pagination
    const needed = offset + limit
    const collected: DiscoveredArticle[] = []
    let page = 1
    const MAX_PAGES = 500  // safety cap (~10000 articles)

    while (collected.length < needed && page <= MAX_PAGES) {
        const url = pageUrl(page)
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
            signal: AbortSignal.timeout(12000),
        })

        if (!res.ok) break

        const html = await res.text()
        const articles = extractArticlesFromListingPage(html)

        if (articles.length === 0) break  // sem mais artigos

        for (const article of articles) {
            if (article.date > dateTo) continue      // ainda mais novo que dateTo — pular
            if (article.date < dateFrom) continue    // mais antigo que dateFrom — pular
            collected.push(article)
        }

        // Se todos os artigos desta página são mais antigos que dateFrom, parar
        if (articles.every(a => a.date < dateFrom)) break

        page++
    }

    return collected.slice(offset, offset + limit)
}

// ─── Discovery orchestrator ───────────────────────────────────────────────────

async function discoverArticles(
    source: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
    offset = 0,
): Promise<{ articles: DiscoveredArticle[]; strategy: DiscoveryStrategy }> {
    try {
        const articles = await discoverViaWPAPI(source, dateFrom, dateTo, limit, offset)
        return { articles, strategy: 'api' }
    } catch (err) {
        console.warn(`[import] WP API falhou para ${source}, usando listing scraper:`, err)
    }

    const articles = await discoverViaListing(source, dateFrom, dateTo, limit, offset)
    return { articles, strategy: 'listing' }
}

async function countAvailable(
    source: string,
    dateFrom: Date,
    dateTo: Date,
): Promise<number> {
    // Tenta WP API — retorna total preciso
    const base = WP_API_BASES[source]
    if (base) {
        try {
            const after  = new Date(dateFrom.getTime() - 1000).toISOString()
            const before = new Date(dateTo.getTime()   + 1000).toISOString()
            const params = new URLSearchParams({
                after, before, per_page: '1', page: '1',
                _fields: 'id', status: 'publish',
            })
            const res = await fetch(`${base}/posts?${params}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
                signal: AbortSignal.timeout(10000),
            })
            if (res.ok) {
                return parseInt(res.headers.get('X-WP-Total') || '0')
            }
        } catch {
            // fall through to listing scraper
        }
    }

    // Fallback: listing scraper (escaneia até o máximo de 5 páginas para estimativa)
    const pageUrl = LISTING_URLS[source]
    if (!pageUrl) return -1

    let count = 0
    for (let page = 1; page <= 50; page++) {
        try {
            const res = await fetch(pageUrl(page), {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
                signal: AbortSignal.timeout(10000),
            })
            if (!res.ok) break

            const articles = extractArticlesFromListingPage(await res.text())
            if (articles.length === 0) break

            for (const a of articles) {
                if (a.date >= dateFrom && a.date <= dateTo) count++
            }

            // Se todos os artigos desta página são mais antigos que dateFrom, parar
            if (articles.every(a => a.date < dateFrom)) break
        } catch {
            break
        }
    }

    return count > 0 ? count : -1
}


// ─── SSE streaming ────────────────────────────────────────────────────────────

const STREAM_IMPORT_DELAY_MS = 1500 // delay fixo entre fetches para evitar rate limiting

function streamImport(
    articles: DiscoveredArticle[],
    source: string,
    strategy: DiscoveryStrategy,
): Response {
    const delayMs = STREAM_IMPORT_DELAY_MS
    const encoder = new TextEncoder()
    const send = (ctrl: ReadableStreamDefaultController, data: object) =>
        ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

    const stream = new ReadableStream({
        async start(controller) {
            let imported = 0, skipped = 0, errors = 0
            try {
                send(controller, { type: 'start', total: articles.length, strategy })

                for (let i = 0; i < articles.length; i++) {
                    const article = articles[i]
                    let result: 'imported' | 'exists' | 'error' = 'error'
                    try {
                        result = await importOne(article, source)
                        if (result === 'imported') imported++
                        else if (result === 'exists') skipped++
                        else errors++
                    } catch {
                        errors++
                    }
                    send(controller, {
                        type: 'item',
                        current: i + 1,
                        total: articles.length,
                        title: article.title,
                        url: article.url,
                        result,
                    })

                    // Rate-limiting delay — só aplica quando houve fetch real ao Soompi
                    if (delayMs > 0 && result !== 'exists' && i < articles.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delayMs))
                    }
                }

                send(controller, { type: 'done', imported, skipped, errors })
            } catch (err) {
                send(controller, { type: 'error', message: String(err) })
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    if (!source || (!WP_API_BASES[source] && !LISTING_URLS[source])) {
        return NextResponse.json({ error: 'source inválido ou não suportado' }, { status: 400 })
    }

    const dateFromStr = searchParams.get('dateFrom')
    if (!dateFromStr) {
        return NextResponse.json({ error: 'dateFrom obrigatório' }, { status: 400 })
    }

    const dateFrom  = new Date(dateFromStr)
    const dateTo    = searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')! + 'T23:59:59Z')
        : new Date()
    const limit     = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '200')))
    const offset    = Math.max(0, parseInt(searchParams.get('offset') || '0'))
    const streaming = searchParams.get('stream') === '1'

    const { articles, strategy } = await discoverArticles(source, dateFrom, dateTo, limit, offset)

    if (streaming) return streamImport(articles, source, strategy)

    // Non-streaming fallback
    let imported = 0, skipped = 0, errors = 0
    for (const article of articles) {
        try {
            const r = await importOne(article, source)
            if (r === 'imported') imported++
            else if (r === 'exists') skipped++
            else errors++
        } catch {
            errors++
        }
    }

    return NextResponse.json({ ok: true, processed: articles.length, imported, skipped, errors, strategy })
}

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    if (!source) return NextResponse.json({ error: 'source obrigatório' }, { status: 400 })

    const dateFromStr = searchParams.get('dateFrom')
    if (!dateFromStr) return NextResponse.json({ available: 0 })

    const dateFrom = new Date(dateFromStr)
    const dateTo   = searchParams.get('dateTo')
        ? new Date(searchParams.get('dateTo')! + 'T23:59:59Z')
        : new Date()

    const available = await countAvailable(source, dateFrom, dateTo)
    return NextResponse.json({ source, available })
}
