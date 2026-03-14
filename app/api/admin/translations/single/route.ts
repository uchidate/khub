import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { getArtistTranslationService } from '@/lib/services/artist-translation-service'
import { getGroupTranslationService } from '@/lib/services/group-translation-service'
import { getProductionTranslationService } from '@/lib/services/production-translation-service'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/translations/single
 * Body: { entityType: 'artist' | 'group' | 'production', id: string }
 *
 * Traduz um único item imediatamente.
 */
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const { entityType, id } = await req.json()

        if (!id || typeof id !== 'string') {
            return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
        }

        if (entityType === 'artist') {
            const service = getArtistTranslationService(prisma)
            const result = await service.translateSingle(id)
            return NextResponse.json(result)
        }

        if (entityType === 'group') {
            const service = getGroupTranslationService(prisma)
            const result = await service.translateSingle(id)
            return NextResponse.json(result)
        }

        if (entityType === 'production') {
            const service = getProductionTranslationService(prisma)
            const result = await service.translateSingle(id)
            return NextResponse.json(result)
        }

        return NextResponse.json({ error: 'entityType inválido. Use "artist", "group" ou "production".' }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
