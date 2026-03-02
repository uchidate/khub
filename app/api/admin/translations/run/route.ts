import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { getArtistTranslationService } from '@/lib/services/artist-translation-service'
import { getGroupTranslationService } from '@/lib/services/group-translation-service'

export const dynamic = 'force-dynamic'

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

        return NextResponse.json({ error: 'entityType inválido. Use "artist" ou "group".' }, { status: 400 })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
