/**
 * POST /api/admin/news/refetch-content?id=<newsId>
 *
 * Re-busca o conteúdo completo do artigo original (sourceUrl) e atualiza
 * originalContent no banco. Útil para notícias que foram salvas antes
 * da correção de preservação de imagens no htmlToMarkdown.
 *
 * Query params:
 *   id:    ID da notícia (obrigatório)
 *   mode:  'batch' — reprocessa notícias com conteúdo curto (opcional)
 *   limit: máximo para batch (default: 50, max: 200)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getRSSNewsService } from '@/lib/services/rss-news-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')
    const mode = searchParams.get('mode')

    if (mode === 'batch') {
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')))
        return runBatch(limit)
    }

    if (!newsId) {
        return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const news = await prisma.news.findUnique({
        where: { id: newsId },
        select: { id: true, title: true, sourceUrl: true },
    })

    if (!news) {
        return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })
    }

    const service = getRSSNewsService()
    const { content, imageUrl } = await service.fetchArticleData(news.sourceUrl)

    if (!content || content.length < 100) {
        return NextResponse.json({ ok: false, reason: 'Conteúdo insuficiente obtido da fonte' })
    }

    await prisma.news.update({
        where: { id: newsId },
        data: {
            originalContent: content,
            ...(imageUrl ? { imageUrl } : {}),
        },
    })

    return NextResponse.json({ ok: true, newsId, contentLength: content.length, imageUpdated: !!imageUrl })
}

async function runBatch(limit: number) {
    // Notícias sem imagens inline OU com conteúdo curto (provavelmente truncado)
    const allCandidates = await prisma.news.findMany({
        where: { sourceUrl: { not: '' } },
        orderBy: { publishedAt: 'desc' },
        take: limit * 4, // buscar mais para filtrar
        select: { id: true, sourceUrl: true, originalContent: true },
    })

    // Filtrar: sem "![" (sem imagens) OU conteúdo curto OU termina com "..."
    const news = allCandidates.filter(n => {
        const c = n.originalContent ?? ''
        return !c.includes('![') || c.length < 1500 || /(\.\.\.|…)\s*$/.test(c)
    }).slice(0, limit)

    const service = getRSSNewsService()
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const item of news) {
        try {
            const { content, imageUrl } = await service.fetchArticleData(item.sourceUrl)
            if (!content || content.length < 100) { skipped++; continue }

            await prisma.news.update({
                where: { id: item.id },
                data: {
                    originalContent: content,
                    ...(imageUrl ? { imageUrl } : {}),
                },
            })
            updated++
        } catch {
            errors++
        }
    }

    return NextResponse.json({ ok: true, processed: news.length, updated, skipped, errors })
}
