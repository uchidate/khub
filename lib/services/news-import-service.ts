/**
 * Serviço unificado de importação de notícias via WordPress REST API.
 *
 * Compartilhado entre:
 *   - /api/admin/news/import  (importação manual/histórica com SSE)
 *   - /api/cron/fetch-news    (cron automático dos últimos N dias)
 *
 * Usa WP API (date_gmt) como fonte authoritative para datas — elimina
 * a derivação de datas que ocorria com RSS pubDate.
 */

import { getRSSNewsService, classifyContentType, estimateReadingTime } from '@/lib/services/rss-news-service'
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service'
import { getNewsNotificationService } from '@/lib/services/news-notification-service'
import { normalizeSourceUrl } from '@/lib/utils/url'
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks'
import { cleanContentBySource } from '@/lib/utils/content-cleaner'
import prisma from '@/lib/prisma'

// ─── Source config ────────────────────────────────────────────────────────────

export const WP_API_BASES: Record<string, string> = {
    Soompi:         'https://www.soompi.com/wp-json/wp/v2',
    Koreaboo:       'https://www.koreaboo.com/wp-json/wp/v2',
    Dramabeans:     'https://dramabeans.com/wp-json/wp/v2',
    'Asian Junkie': 'https://www.asianjunkie.com/wp-json/wp/v2',
    HelloKpop:      'https://www.hellokpop.com/wp-json/wp/v2',
    Kpopmap:        'https://kpopmap.com/wp-json/wp/v2',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscoveredArticle {
    url:   string
    date:  Date
    title: string
}

export type ImportResult = 'imported' | 'exists' | 'error'

// ─── Utilities ────────────────────────────────────────────────────────────────

const HTML_ENTITY_MAP: Record<string, string> = {
    '&amp;':   '&',
    '&#038;':  '&',
    '&#039;':  "'",
    '&quot;':  '"',
    '&#034;':  '"',
    '&lt;':    '<',
    '&gt;':    '>',
    '&#8217;': '\u2019',
    '&#8216;': '\u2018',
    '&#8220;': '\u201C',
    '&#8221;': '\u201D',
}

/** Decodifica entidades HTML em passagem única — sem risco de double-unescaping. */
export function decodeHtmlEntities(str: string): string {
    return str.replace(/&(?:#?\w+);/g, match => HTML_ENTITY_MAP[match] ?? match)
}

/** Faz fetch com 1 retry automático em caso de conteúdo insuficiente (rate limiting) */
export async function fetchArticleWithRetry(
    url: string,
    source: string,
): Promise<{ content: string | null; imageUrl: string | null }> {
    const service = getRSSNewsService()
    const first = await service.fetchArticleData(url, source)
    if (first.content && first.content.length >= 100) {
        return { content: first.content ?? null, imageUrl: first.imageUrl ?? null }
    }
    await new Promise(r => setTimeout(r, 3000))
    const second = await service.fetchArticleData(url, source)
    return { content: second.content ?? null, imageUrl: second.imageUrl ?? null }
}

// ─── WP API discovery ─────────────────────────────────────────────────────────

/**
 * Descobre artigos via WordPress REST API para uma fonte no intervalo de datas.
 * Usa date_gmt como data authoritative — sem ambiguidade de fuso horário.
 */
export async function discoverViaWPAPI(
    source: string,
    dateFrom: Date,
    dateTo: Date,
    limit: number,
    offset = 0,
): Promise<DiscoveredArticle[]> {
    const base = WP_API_BASES[source]
    if (!base) throw new Error(`WP API não configurado para fonte: ${source}`)

    const after  = new Date(dateFrom.getTime() - 1000).toISOString()
    const before = new Date(dateTo.getTime()   + 1000).toISOString()

    const PER_PAGE = 100
    const startPage = Math.floor(offset / PER_PAGE) + 1
    const skipInFirstPage = offset % PER_PAGE

    const collected: DiscoveredArticle[] = []
    let page = startPage

    while (collected.length < limit) {
        const params = new URLSearchParams({
            after, before,
            per_page: String(PER_PAGE),
            page:     String(page),
            orderby:  'date',
            order:    'desc',
            _fields:  'id,date,date_gmt,title,link',
            status:   'publish',
        })

        const res = await fetch(`${base}/posts?${params}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HallyuHub/1.0)' },
            signal:  AbortSignal.timeout(12000),
        })

        if (!res.ok) throw new Error(`WP API HTTP ${res.status} para ${source}`)

        const apiTotal = parseInt(res.headers.get('X-WP-Total') || '0')
        const posts: Array<{ date: string; date_gmt: string; title: { rendered: string }; link: string }> = await res.json()

        if (posts.length === 0) break

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

// ─── Core import ──────────────────────────────────────────────────────────────

/**
 * Importa um único artigo.
 *
 * - Se já existe pelo sourceUrl canônico: corrige publishedAt se diferir > 1 dia
 *   da data authoritative do WP API (date_gmt), evitando acúmulo de datas erradas.
 * - Se não existe: faz fetch do conteúdo e cria o registro.
 */
export async function importOne(
    article: DiscoveredArticle,
    source: string,
): Promise<ImportResult> {
    const canonicalUrl = normalizeSourceUrl(article.url)

    const existing = await prisma.news.findFirst({
        where:  { sourceUrl: canonicalUrl },
        select: { id: true, publishedAt: true, source: true },
    })

    if (existing) {
        // Corrige campos incorretos deixados por bugs anteriores (source NULL, publishedAt errado)
        const fixes: Record<string, unknown> = {}
        const msDiff = Math.abs(existing.publishedAt.getTime() - article.date.getTime())
        if (msDiff > 86_400_000) fixes.publishedAt = article.date
        if (existing.source !== source) fixes.source = source
        if (Object.keys(fixes).length > 0) {
            await prisma.news.update({ where: { id: existing.id }, data: fixes })
        }
        return 'exists'
    }

    const { content: rawContent, imageUrl: rawImageUrl } = await fetchArticleWithRetry(article.url, source)
    if (!rawContent || rawContent.length < 100) return 'error'
    // Normalizar URLs de imagem para HTTPS (Dramabeans e outros servem HTTP)
    const imageUrl = rawImageUrl?.replace(/^http:\/\//i, 'https://') ?? null
    const content  = cleanContentBySource(rawContent, source)

    const readingTimeMin = estimateReadingTime(content)
    const contentType    = classifyContentType(article.title, content, source)
    const blocks         = markdownToBlocks(content)

    const news = await prisma.news.create({
        data: {
            title:           article.title,
            contentMd:       content,
            originalContent: rawContent,
            sourceUrl:       canonicalUrl,
            source,
            imageUrl:        imageUrl ?? null,
            publishedAt:     article.date,
            readingTimeMin,
            contentType,
            tags:            [],
            blocks:          blocks as object[],
            status:          'draft',
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
