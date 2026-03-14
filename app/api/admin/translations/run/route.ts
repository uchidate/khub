import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { getArtistTranslationService } from '@/lib/services/artist-translation-service'
import { getGroupTranslationService } from '@/lib/services/group-translation-service'
import { getProductionTranslationService } from '@/lib/services/production-translation-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/translations/run?entityType=artist&limit=10
 *
 * Traduz um item por vez, emitindo eventos SSE com progresso em tempo real.
 * O próximo item só começa depois que o anterior termina (sem sobrecarga).
 */
export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType') ?? ''
    const limit = Math.min(300, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
    const hiddenParam = searchParams.get('hidden')
    const isHidden = hiddenParam === 'true' ? true : hiddenParam === 'false' ? false : undefined

    if (!['artist', 'group', 'production'].includes(entityType)) {
        return NextResponse.json({ error: 'entityType inválido. Use "artist", "group" ou "production".' }, { status: 400 })
    }

    const encoder = new TextEncoder()
    const send = (controller: ReadableStreamDefaultController, data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
    }

    const stream = new ReadableStream({
        async start(controller) {
            try {
                let result: { translated: number; failed: number; skipped: number }

                if (entityType === 'artist') {
                    const service = getArtistTranslationService(prisma)
                    result = await service.translatePendingArtists(limit, (p) => {
                        send(controller, { type: 'progress', ...p })
                    }, isHidden)
                } else if (entityType === 'production') {
                    const service = getProductionTranslationService(prisma)
                    result = await service.translatePendingProductions(limit, (p) => {
                        send(controller, { type: 'progress', ...p })
                    }, isHidden)
                } else {
                    const service = getGroupTranslationService(prisma)
                    result = await service.translatePendingGroups(limit, (p) => {
                        send(controller, { type: 'progress', ...p })
                    }, isHidden)
                }

                send(controller, { type: 'done', ...result })
            } catch (err) {
                send(controller, { type: 'error', message: getErrorMessage(err) })
            } finally {
                controller.close()
            }
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}

/**
 * POST /api/admin/translations/run
 *
 * Aciona tradução automática em batch para artistas ou grupos.
 * Body: { entityType: 'artist' | 'group', limit?: number }
 */
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await req.json()
        const entityType = body.entityType as string
        const limit = Math.min(50, Math.max(1, parseInt(body.limit ?? '10')))

        if (entityType === 'artist') {
            const service = getArtistTranslationService(prisma)
            const result = await service.translatePendingArtists(limit)
            return NextResponse.json({ ok: true, entityType, ...result })
        }

        if (entityType === 'group') {
            const service = getGroupTranslationService(prisma)
            const result = await service.translatePendingGroups(limit)
            return NextResponse.json({ ok: true, entityType, ...result })
        }

        if (entityType === 'production') {
            const service = getProductionTranslationService(prisma)
            const result = await service.translatePendingProductions(limit)
            return NextResponse.json({ ok: true, entityType, ...result })
        }

        return NextResponse.json({ error: 'entityType inválido. Use "artist", "group" ou "production".' }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
