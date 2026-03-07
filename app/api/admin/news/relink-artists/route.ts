/**
 * POST /api/admin/news/relink-artists?id=<newsId>
 *
 * Re-executa a extração de artistas para uma notícia específica.
 * Limpa os vínculos antigos e recria com o algoritmo atualizado.
 *
 * Apenas admins podem acionar. Resposta síncrona (não streaming).
 *
 * Query params:
 *   id:   ID da notícia (obrigatório)
 *   mode: 'batch' — processa lote de notícias sem artistas (optional)
 *   limit: número máximo para modo batch (default: 100, max: 500)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getNewsArtistExtractionService } from '@/lib/services/news-artist-extraction-service'
import { getNewsNotificationService } from '@/lib/services/news-notification-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')
    const mode = searchParams.get('mode')

    // ── Modo batch: processa notícias sem artistas ─────────────────────────────
    if (mode === 'batch') {
        const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')))
        return runBatch(limit)
    }

    // ── Modo individual: re-extrai artistas de uma notícia ─────────────────────
    if (!newsId) {
        return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const news = await prisma.news.findUnique({
        where: { id: newsId },
        select: { id: true, title: true, contentMd: true, originalContent: true },
    })

    if (!news) {
        return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })
    }

    const service = getNewsArtistExtractionService(prisma)
    const content = news.originalContent || news.contentMd
    const mentions = await service.extractArtists(news.title, content)

    // Remove vínculos antigos e recria
    await prisma.newsArtist.deleteMany({ where: { newsId } })

    if (mentions.length > 0) {
        await prisma.newsArtist.createMany({
            data: mentions.map(m => ({ newsId, artistId: m.artistId })),
            skipDuplicates: true,
        })
        // Disparar notificações IN_APP agora que os artistas estão vinculados
        void getNewsNotificationService().notifyInAppForNews(newsId).catch(() => {})
    }

    // Retorna notícia com artistas atualizados
    const updated = await prisma.news.findUnique({
        where: { id: newsId },
        include: {
            artists: {
                include: {
                    artist: {
                        select: { id: true, nameRomanized: true, primaryImageUrl: true },
                    },
                },
            },
        },
    })

    return NextResponse.json({
        ok: true,
        newsId,
        artistCount: mentions.length,
        artists: updated?.artists.map(a => ({ id: a.artistId, name: a.artist.nameRomanized })) ?? [],
    })
}

async function runBatch(limit: number) {
    const news = await prisma.news.findMany({
        where: { artists: { none: {} } },
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, contentMd: true, originalContent: true },
    })

    const service = getNewsArtistExtractionService(prisma)
    let linked = 0
    let skipped = 0
    let errors = 0

    for (const item of news) {
        try {
            const content = item.originalContent || item.contentMd
            const mentions = await service.extractArtists(item.title, content)
            if (mentions.length > 0) {
                await prisma.newsArtist.createMany({
                    data: mentions.map(m => ({ newsId: item.id, artistId: m.artistId })),
                    skipDuplicates: true,
                })
                linked += mentions.length
            } else {
                skipped++
            }
        } catch {
            errors++
        }
    }

    return NextResponse.json({
        ok: true,
        processed: news.length,
        linked,
        skipped,
        errors,
    })
}
