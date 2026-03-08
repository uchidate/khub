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
import { getRSSNewsService, classifyContentType, estimateReadingTime } from '@/lib/services/rss-news-service'
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service'
import { getNewsNotificationService } from '@/lib/services/news-notification-service'
import { normalizeSourceUrl } from '@/lib/utils/url'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ─── Source configurations ────────────────────────────────────────────────────

/** Base da WP REST API por fonte */
const WP_API_BASES: Record<string, string> = {
    Soompi:         'https://www.soompi.com/wp-json/wp/v2',
    Koreaboo:       'https://www.koreaboo.com/wp-json/wp/v2',
    Dramabeans:     'https://dramabeans.com/wp-json/wp/v2',
    'Asian Junkie': 'https://www.asianjunkie.com/wp-json/wp/v2',
    HelloKpop:      'https://www.hellokpop.com/wp-json/wp/v2',
    Kpopmap:        'https://kpopmap.com/wp-json/wp/v2',
}

/** URL das páginas de listagem por fonte (paginação WordPress padrão /page/N/) */
const LISTING_URLS: Record<string, (page: number) => string> = {
    Soompi:         (p) => p <= 1 ? 'https://www.soompi.com/'               : `https://www.soompi.com/page/${p}/`,
    Koreaboo:       (p) => p <= 1 ? 'https://www.koreaboo.com/news/'        : `https://www.koreaboo.com/news/page/${p}/`,
    Dramabeans:     (p) => p <= 1 ? 'https://dramabeans.com/'               : `https://dramabeans.com/page/${p}/`,
    'Asian Junkie': (p) => p <= 1 ? 'https://www.asianjunkie.com/'          : `https://www.asianjunkie.com/page/${p}/`,
    HelloKpop:      (p) => p <= 1 ? 'https://www.hellokpop.com/'            : `https://www.hellokpop.com/page/${p}/`,
    Kpopmap:        (p) => p <= 1 ? 'https://kpopmap.com/'                  : `https://kpopmap.com/page/${p}/`,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscoveredArticle {
    url: string
    date: Date
    title: string
}

type DiscoveryStrategy = 'api' | 'listing'

// ─── Strategy 1: WordPress REST API ──────────────────────────────────────────

async function discoverViaWPAPI(
    source: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
    offset = 0,
): Promise<DiscoveredArticle[]> {
    const base = WP_API_BASES[source]
    if (!base) throw new Error('WP API not configured for source')

    const after  = new Date(dateFrom.getTime() - 1000).toISOString()
    const before = new Date(dateTo.getTime()   + 1000).toISOString()

    const PER_PAGE = 100
    // Jump directly to the WP page that contains the offset
    const startPage = Math.floor(offset / PER_PAGE) + 1
    const skipInFirstPage = offset % PER_PAGE

    const collected: DiscoveredArticle[] = []
    let page = startPage

    while (collected.length < limit) {
        const params = new URLSearchParams({
            after, before,
            per_page: String(PER_PAGE),
            page: String(page),
            orderby: 'date',
            order: 'desc',
            _fields: 'id,date,date_gmt,title,link',
            status: 'publish',
        })

        const res = await fetch(`${base}/posts?${params}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
            signal: AbortSignal.timeout(12000),
        })

        if (!res.ok) throw new Error(`WP API HTTP ${res.status}`)

        const apiTotal = parseInt(res.headers.get('X-WP-Total') || '0')
        const posts: Array<{ date: string; date_gmt: string; title: { rendered: string }; link: string }> = await res.json()

        if (posts.length === 0) break

        // In the first page fetched, skip articles already covered by offset
        const slice = page === startPage && skipInFirstPage > 0
            ? posts.slice(skipInFirstPage)
            : posts

        for (const p of slice) {
            if (collected.length >= limit) break
            collected.push({
                url:   p.link,
                date:  new Date(p.date_gmt || p.date),
                title: decodeHtmlEntities(p.title.rendered),
            })
        }

        if (collected.length >= limit || offset + collected.length >= apiTotal) break
        page++
    }

    return collected
}

// ─── Strategy 2: Paginated listing scraper ────────────────────────────────────

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

// ─── Utility ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&#039;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#8217;/g, '\u2019')
        .replace(/&#8216;/g, '\u2018')
        .replace(/&#8220;/g, '\u201C')
        .replace(/&#8221;/g, '\u201D')
}

// ─── Import single article ────────────────────────────────────────────────────

/** Faz fetch com 1 retry automático em caso de conteúdo insuficiente (rate limiting) */
async function fetchWithRetry(
    service: ReturnType<typeof getRSSNewsService>,
    url: string,
    source: string,
) {
    const first = await service.fetchArticleData(url, source)
    if (first.content && first.content.length >= 100) return first
    // Aguarda antes de tentar novamente — provável rate limiting
    await new Promise(r => setTimeout(r, 3000))
    return service.fetchArticleData(url, source)
}

async function importOne(
    article: DiscoveredArticle,
    source: string,
): Promise<'imported' | 'exists' | 'error'> {
    const canonicalUrl = normalizeSourceUrl(article.url)
    const existing = await prisma.news.findFirst({
        where: { sourceUrl: canonicalUrl },
        select: { id: true, publishedAt: true },
    })
    if (existing) {
        // Corrige publishedAt se diferir > 1 dia da data authoritative do WP API (date_gmt)
        // Isso corrije artigos que tiveram datas derivadas pelo cron RSS ao longo do tempo
        const msDiff = Math.abs(existing.publishedAt.getTime() - article.date.getTime())
        if (msDiff > 86_400_000) {
            await prisma.news.update({
                where: { id: existing.id },
                data: { publishedAt: article.date },
            })
        }
        return 'exists'
    }

    const service = getRSSNewsService()
    const { content, imageUrl } = await fetchWithRetry(service, article.url, source)

    if (!content || content.length < 100) return 'error'

    const readingTimeMin = estimateReadingTime(content)
    const contentType    = classifyContentType(article.title, content, source)

    const news = await prisma.news.create({
        data: {
            title: article.title,
            contentMd: content,
            originalContent: content,
            sourceUrl: canonicalUrl,
            source,
            imageUrl: imageUrl ?? null,
            publishedAt: article.date,
            readingTimeMin,
            contentType,
            tags: [],
        },
    })

    const extractionService = getNewsArtistExtractionService(prisma)
    const mentions = await extractionService.extractArtists(article.title, content)

    if (mentions.length > 0) {
        await prisma.newsArtist.createMany({
            data: mentions.map(m => ({ newsId: news.id, artistId: m.artistId })),
            skipDuplicates: true,
        })
        void getNewsNotificationService().notifyInAppForNews(news.id).catch(() => {})
    }

    return 'imported'
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
