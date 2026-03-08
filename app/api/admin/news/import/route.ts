/**
 * POST /api/admin/news/import
 *
 * Importa artigos históricos de uma fonte usando a WordPress REST API.
 * Descobre artigos por intervalo de data e salva os que ainda não existem no banco.
 *
 * Query params:
 *   source:   nome da fonte (obrigatório) — ex: 'Soompi'
 *   dateFrom: ISO date string — filtra publishedAt >= dateFrom (ex: 2025-01-01)
 *   dateTo:   ISO date string — filtra publishedAt <= dateTo   (ex: 2025-12-31)
 *   limit:    máximo de artigos a importar (default: 200, max: 500)
 *   stream:   '1' — retorna SSE com progresso em tempo real
 *
 * GET /api/admin/news/import?source=<source>&dateFrom=...&dateTo=...
 *   Retorna contagem de artigos disponíveis na fonte no período (via WP API).
 *
 * SSE events (quando stream=1):
 *   { type: 'start',    total: number }
 *   { type: 'item',     current, total, title, url, result: 'imported'|'exists'|'error' }
 *   { type: 'done',     imported, skipped, errors }
 *   { type: 'error',    message }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getRSSNewsService, classifyContentType, estimateReadingTime } from '@/lib/services/rss-news-service'
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service'
import { getNewsNotificationService } from '@/lib/services/news-notification-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// ─── WP REST API config ───────────────────────────────────────────────────────

const WP_API_BASES: Record<string, string> = {
    Soompi:         'https://www.soompi.com/wp-json/wp/v2',
    Koreaboo:       'https://www.koreaboo.com/wp-json/wp/v2',
    Dramabeans:     'https://dramabeans.com/wp-json/wp/v2',
    'Asian Junkie': 'https://www.asianjunkie.com/wp-json/wp/v2',
    HelloKpop:      'https://www.hellokpop.com/wp-json/wp/v2',
    Kpopmap:        'https://kpopmap.com/wp-json/wp/v2',
}

interface WPPost {
    id: number
    date: string       // ISO 8601 (local TZ of site)
    date_gmt: string   // UTC
    title: { rendered: string }
    link: string
    excerpt?: { rendered: string }
}

// ─── WP API helpers ───────────────────────────────────────────────────────────

async function fetchWPPostsPage(
    base: string,
    after: string,
    before: string,
    page: number,
    perPage = 100,
): Promise<{ posts: WPPost[]; total: number }> {
    const params = new URLSearchParams({
        after,
        before,
        per_page: String(perPage),
        page: String(page),
        orderby: 'date',
        order: 'desc',
        _fields: 'id,date,date_gmt,title,link',
        status: 'publish',
    })

    const url = `${base}/posts?${params}`
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
        signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
        throw new Error(`WP API HTTP ${res.status} — ${url}`)
    }

    const total = parseInt(res.headers.get('X-WP-Total') || '0')
    const posts: WPPost[] = await res.json()
    return { posts, total }
}

/** Coleta TODOS os posts no intervalo via paginação WP REST API */
async function discoverArticles(
    source: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
): Promise<WPPost[]> {
    const base = WP_API_BASES[source]
    if (!base) throw new Error(`Fonte não suportada para importação: ${source}`)

    const after = new Date(dateFrom.getTime() - 1000).toISOString()   // 1s antes para incluir dateFrom
    const before = new Date(dateTo.getTime() + 1000).toISOString()    // 1s depois para incluir dateTo

    const collected: WPPost[] = []
    let page = 1

    while (collected.length < limit) {
        const { posts, total } = await fetchWPPostsPage(base, after, before, page)

        if (posts.length === 0) break
        collected.push(...posts)

        // Se já temos o total ou coletamos tudo, parar
        if (collected.length >= total || collected.length >= limit) break

        page++
    }

    return collected.slice(0, limit)
}

/** Retorna contagem de posts disponíveis na WP API no período */
async function countAvailable(source: string, dateFrom: Date, dateTo: Date): Promise<number> {
    const base = WP_API_BASES[source]
    if (!base) return 0

    const after = new Date(dateFrom.getTime() - 1000).toISOString()
    const before = new Date(dateTo.getTime() + 1000).toISOString()

    try {
        const { total } = await fetchWPPostsPage(base, after, before, 1, 1)
        return total
    } catch {
        return 0
    }
}

// ─── Import single article ────────────────────────────────────────────────────

async function importOne(post: WPPost, source: string): Promise<{
    result: 'imported' | 'exists' | 'error'
    title: string
    error?: string
}> {
    const title = post.title.rendered.replace(/&amp;/g, '&').replace(/&#039;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

    // Verificar se já existe
    const existing = await prisma.news.findFirst({
        where: { sourceUrl: post.link },
        select: { id: true },
    })
    if (existing) return { result: 'exists', title }

    // Buscar conteúdo completo
    const service = getRSSNewsService()
    const { content, imageUrl } = await service.fetchArticleData(post.link, source)

    if (!content || content.length < 100) {
        return { result: 'error', title, error: 'Conteúdo insuficiente' }
    }

    const publishedAt = new Date(post.date_gmt || post.date)
    const readingTimeMin = estimateReadingTime(content)
    const contentType = classifyContentType(title, content, source)

    const news = await prisma.news.create({
        data: {
            title,
            contentMd: content,
            originalContent: content,
            sourceUrl: post.link,
            source,
            imageUrl: imageUrl ?? null,
            publishedAt,
            readingTimeMin,
            contentType,
            tags: [],
        },
    })

    // Extrair artistas
    const extractionService = getNewsArtistExtractionService(prisma)
    const mentions = await extractionService.extractArtists(title, content)

    if (mentions.length > 0) {
        await prisma.newsArtist.createMany({
            data: mentions.map(m => ({ newsId: news.id, artistId: m.artistId })),
            skipDuplicates: true,
        })
        void getNewsNotificationService().notifyInAppForNews(news.id).catch(() => {})
    }

    return { result: 'imported', title }
}

// ─── SSE streaming ────────────────────────────────────────────────────────────

function streamImport(posts: WPPost[], source: string): Response {
    const encoder = new TextEncoder()

    const send = (controller: ReadableStreamDefaultController, data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    }

    const stream = new ReadableStream({
        async start(controller) {
            let imported = 0, skipped = 0, errors = 0

            try {
                send(controller, { type: 'start', total: posts.length })

                for (let i = 0; i < posts.length; i++) {
                    const post = posts[i]
                    let result: 'imported' | 'exists' | 'error' = 'error'

                    try {
                        const r = await importOne(post, source)
                        result = r.result
                        if (result === 'imported') imported++
                        else if (result === 'exists') skipped++
                        else errors++
                    } catch {
                        errors++
                    }

                    send(controller, {
                        type: 'item',
                        current: i + 1,
                        total: posts.length,
                        title: post.title.rendered,
                        url: post.link,
                        result,
                    })
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
    if (!source || !WP_API_BASES[source]) {
        return NextResponse.json({ error: 'source inválido ou não suportado' }, { status: 400 })
    }

    const dateFromStr = searchParams.get('dateFrom')
    const dateToStr = searchParams.get('dateTo')
    if (!dateFromStr) {
        return NextResponse.json({ error: 'dateFrom obrigatório' }, { status: 400 })
    }

    const dateFrom = new Date(dateFromStr)
    const dateTo = dateToStr ? new Date(dateToStr + 'T23:59:59Z') : new Date()
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200')))
    const streaming = searchParams.get('stream') === '1'

    const posts = await discoverArticles(source, dateFrom, dateTo, limit)

    if (streaming) {
        return streamImport(posts, source)
    }

    // Non-streaming fallback
    let imported = 0, skipped = 0, errors = 0
    for (const post of posts) {
        try {
            const r = await importOne(post, source)
            if (r.result === 'imported') imported++
            else if (r.result === 'exists') skipped++
            else errors++
        } catch {
            errors++
        }
    }

    return NextResponse.json({ ok: true, processed: posts.length, imported, skipped, errors })
}

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')
    if (!source) return NextResponse.json({ error: 'source obrigatório' }, { status: 400 })

    const dateFromStr = searchParams.get('dateFrom')
    const dateToStr = searchParams.get('dateTo')
    if (!dateFromStr) return NextResponse.json({ available: 0 })

    const dateFrom = new Date(dateFromStr)
    const dateTo = dateToStr ? new Date(dateToStr + 'T23:59:59Z') : new Date()

    const available = await countAvailable(source, dateFrom, dateTo)

    return NextResponse.json({ source, available })
}
