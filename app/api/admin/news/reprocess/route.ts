/**
 * POST /api/admin/news/reprocess?id=<newsId>
 *
 * Reprocessa uma notícia completa seguindo o mesmo pipeline do fluxo normal:
 *   1. Re-busca conteúdo e imagem do artigo original (fetchArticleData)
 *   2. Atualiza originalContent, imageUrl, readingTimeMin e contentType
 *   3. Re-extrai artistas mencionados (apaga vínculos antigos, recria)
 *   4. Dispara notificações in-app
 *
 * Modes:
 *   Individual: POST ?id=<newsId>
 *   Batch:      POST ?mode=batch&source=<source>&limit=N&all=1[&stream=1]
 *
 * Query params:
 *   id:     ID da notícia (obrigatório no modo individual)
 *   mode:   'batch' — reprocessa lote
 *   source: filtra por fonte (ex: 'Koreaboo') — apenas no modo batch
 *   all:    '1' — reprocessa todos da fonte (não só candidatos)
 *   limit:  máximo para batch (default: 50, max: 200)
 *   offset: pular N itens (default: 0) — permite paginação em múltiplos lotes
 *   stream: '1' — retorna SSE com progresso em tempo real (batch only)
 *
 * GET /api/admin/news/reprocess?source=<source>
 *   Retorna a contagem de notícias disponíveis da fonte.
 *
 * SSE events (quando stream=1):
 *   { type: 'start',    total: number }
 *   { type: 'item',     current, total, title, result: 'updated'|'skipped'|'error', artistCount }
 *   { type: 'done',     updated, skipped, errors }
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReprocessResult {
    newsId: string
    contentUpdated: boolean
    imageUpdated: boolean
    artistCount: number
    notified: boolean
    error?: string
}

type BatchItem = { id: string; title: string; sourceUrl: string; source: string | null }

// ─── Core reprocess logic ─────────────────────────────────────────────────────

async function reprocessOne(news: BatchItem): Promise<ReprocessResult> {
    const result: ReprocessResult = {
        newsId: news.id,
        contentUpdated: false,
        imageUpdated: false,
        artistCount: 0,
        notified: false,
    }

    const service = getRSSNewsService()
    const { content, imageUrl } = await service.fetchArticleData(news.sourceUrl, news.source ?? undefined)

    if (!content || content.length < 100) {
        result.error = 'Conteúdo insuficiente'
        return result
    }

    const readingTimeMin = estimateReadingTime(content)
    const contentType = classifyContentType(news.title, content, news.source ?? undefined)

    await prisma.news.update({
        where: { id: news.id },
        data: {
            originalContent: content,
            contentMd: content,
            readingTimeMin,
            contentType,
            ...(imageUrl ? { imageUrl } : {}),
        },
    })

    result.contentUpdated = true
    result.imageUpdated = !!imageUrl

    const extractionService = getNewsArtistExtractionService(prisma)
    const mentions = await extractionService.extractArtists(news.title, content)

    await prisma.newsArtist.deleteMany({ where: { newsId: news.id } })

    if (mentions.length > 0) {
        await prisma.newsArtist.createMany({
            data: mentions.map(m => ({ newsId: news.id, artistId: m.artistId })),
            skipDuplicates: true,
        })
        result.artistCount = mentions.length
        void getNewsNotificationService().notifyInAppForNews(news.id).catch(() => {})
        result.notified = true
    }

    return result
}

// ─── Item selection ───────────────────────────────────────────────────────────

async function selectBatchItems(
    limit: number,
    source: string | undefined,
    forceAll: boolean,
    offset: number = 0,
): Promise<BatchItem[]> {
    const baseWhere = {
        sourceUrl: { not: '' },
        ...(source ? { source } : {}),
    }

    if (source && forceAll) {
        return prisma.news.findMany({
            where: baseWhere,
            orderBy: { publishedAt: 'desc' },
            skip: offset,
            take: limit,
            select: { id: true, title: true, sourceUrl: true, source: true },
        })
    }

    const candidates = await prisma.news.findMany({
        where: baseWhere,
        orderBy: { publishedAt: 'desc' },
        take: limit * 4,
        select: { id: true, title: true, sourceUrl: true, source: true, originalContent: true },
    })

    return candidates
        .filter(n => {
            const c = n.originalContent ?? ''
            return !c.includes('![') || c.length < 1500 || /(\.\.\.|…)\s*$/.test(c)
        })
        .slice(0, limit)
}

// ─── SSE streaming batch ──────────────────────────────────────────────────────

function streamBatch(items: BatchItem[]): Response {
    const encoder = new TextEncoder()

    const send = (controller: ReadableStreamDefaultController, data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    }

    const stream = new ReadableStream({
        async start(controller) {
            let updated = 0, skipped = 0, errors = 0

            try {
                send(controller, { type: 'start', total: items.length })

                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    let result: 'updated' | 'skipped' | 'error' = 'error'
                    let artistCount = 0

                    try {
                        const r = await reprocessOne(item)
                        if (r.error) {
                            result = 'skipped'
                            skipped++
                        } else if (r.contentUpdated) {
                            result = 'updated'
                            artistCount = r.artistCount
                            updated++
                        } else {
                            errors++
                        }
                    } catch {
                        errors++
                    }

                    send(controller, {
                        type: 'item',
                        current: i + 1,
                        total: items.length,
                        title: item.title,
                        newsId: item.id,
                        result,
                        artistCount,
                    })
                }

                send(controller, { type: 'done', updated, skipped, errors })
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
            'X-Accel-Buffering': 'no', // disable nginx proxy buffering
        },
    })
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')
    const mode = searchParams.get('mode')

    // ── Batch mode ───────────────────────────────────────────────────────────
    if (mode === 'batch') {
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
        const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
        const source = searchParams.get('source') || undefined
        const forceAll = searchParams.get('all') === '1'
        const streaming = searchParams.get('stream') === '1'

        const items = await selectBatchItems(limit, source, forceAll, offset)

        if (streaming) {
            return streamBatch(items)
        }

        // Non-streaming fallback (keeps backwards compat for API/cron use)
        let updated = 0, skipped = 0, errors = 0
        const errorIds: string[] = []

        for (const item of items) {
            try {
                const r = await reprocessOne(item)
                if (r.error) {
                    skipped++
                } else if (r.contentUpdated) {
                    updated++
                } else {
                    errors++
                    if (errorIds.length < 10) errorIds.push(item.id)
                }
            } catch {
                errors++
                if (errorIds.length < 10) errorIds.push(item.id)
            }
        }

        return NextResponse.json({ ok: true, processed: items.length, updated, skipped, errors, errorIds })
    }

    // ── Individual mode ──────────────────────────────────────────────────────
    if (!newsId) {
        return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const news = await prisma.news.findUnique({
        where: { id: newsId },
        select: { id: true, title: true, sourceUrl: true, source: true },
    })

    if (!news) {
        return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })
    }

    const result = await reprocessOne(news)

    if (result.error) {
        return NextResponse.json({ ok: false, reason: result.error })
    }

    const artists = await prisma.newsArtist.findMany({
        where: { newsId },
        include: { artist: { select: { id: true, nameRomanized: true } } },
    })

    return NextResponse.json({
        ok: true,
        newsId,
        contentUpdated: result.contentUpdated,
        imageUpdated: result.imageUpdated,
        artistCount: result.artistCount,
        notified: result.notified,
        artists: artists.map(a => ({ id: a.artistId, name: a.artist.nameRomanized })),
    })
}

// ─── GET: count articles for a source ────────────────────────────────────────

export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const source = new URL(request.url).searchParams.get('source')
    if (!source) {
        return NextResponse.json({ error: 'source obrigatório' }, { status: 400 })
    }

    const count = await prisma.news.count({
        where: { source, sourceUrl: { not: '' } },
    })

    return NextResponse.json({ source, count })
}
