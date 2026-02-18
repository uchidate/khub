import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const log = createLogger('ADMIN-MERGE')

const mergeSchema = z.object({
    keepId: z.string().min(1),
    deleteId: z.string().min(1),
    // Optional field-level overrides from curator (choose A or B per field)
    fieldOverrides: z.object({
        nameRomanized: z.string().min(1).optional(),
        nameHangul: z.string().nullable().optional(),
        birthName: z.string().nullable().optional(),
        birthDate: z.string().nullable().optional(), // ISO date string
        height: z.string().nullable().optional(),
        bloodType: z.string().nullable().optional(),
        bio: z.string().nullable().optional(),
        primaryImageUrl: z.string().nullable().optional(),
        agencyId: z.string().nullable().optional(),
    }).optional(),
})

/**
 * POST /api/admin/artists/merge
 * Merges all relations from deleteId into keepId, then deletes deleteId.
 * Accepts optional fieldOverrides to allow field-level curation (choose A or B per field).
 */
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const body = await request.json()
        const { keepId, deleteId, fieldOverrides } = mergeSchema.parse(body)

        if (keepId === deleteId) {
            return NextResponse.json({ error: 'keepId e deleteId não podem ser iguais' }, { status: 400 })
        }

        const [keeper, deleter] = await Promise.all([
            prisma.artist.findUnique({ where: { id: keepId } }),
            prisma.artist.findUnique({ where: { id: deleteId } }),
        ])

        if (!keeper) return NextResponse.json({ error: 'Artista a manter não encontrado' }, { status: 404 })
        if (!deleter) return NextResponse.json({ error: 'Artista duplicado não encontrado' }, { status: 404 })

        await prisma.$transaction(async (tx) => {
            // 1. Favorite (unique [userId, artistId])
            const keepFavs = await tx.favorite.findMany({ where: { artistId: keepId }, select: { userId: true } })
            const keepFavUserIds = new Set(keepFavs.map(f => f.userId))
            await tx.favorite.updateMany({
                where: { artistId: deleteId, userId: { notIn: Array.from(keepFavUserIds) } },
                data: { artistId: keepId },
            })
            await tx.favorite.deleteMany({ where: { artistId: deleteId } })

            // 2. ArtistProduction (composite @@id [artistId, productionId] — cannot updateMany)
            const keepProds = await tx.artistProduction.findMany({ where: { artistId: keepId }, select: { productionId: true } })
            const keepProdIds = new Set(keepProds.map(p => p.productionId))
            const toTransfer = await tx.artistProduction.findMany({
                where: { artistId: deleteId, productionId: { notIn: Array.from(keepProdIds) } },
            })
            await tx.artistProduction.deleteMany({ where: { artistId: deleteId } })
            if (toTransfer.length > 0) {
                await tx.artistProduction.createMany({
                    data: toTransfer.map(p => ({ artistId: keepId, productionId: p.productionId, role: p.role })),
                })
            }

            // 3. ArtistGroupMembership (unique [artistId, groupId])
            const keepMemberships = await tx.artistGroupMembership.findMany({ where: { artistId: keepId }, select: { groupId: true } })
            const keepGroupIds = new Set(keepMemberships.map(m => m.groupId))
            await tx.artistGroupMembership.updateMany({
                where: { artistId: deleteId, groupId: { notIn: Array.from(keepGroupIds) } },
                data: { artistId: keepId },
            })
            await tx.artistGroupMembership.deleteMany({ where: { artistId: deleteId } })

            // 4. NewsArtist (unique [newsId, artistId])
            const keepNews = await tx.newsArtist.findMany({ where: { artistId: keepId }, select: { newsId: true } })
            const keepNewsIds = new Set(keepNews.map(n => n.newsId))
            await tx.newsArtist.updateMany({
                where: { artistId: deleteId, newsId: { notIn: Array.from(keepNewsIds) } },
                data: { artistId: keepId },
            })
            await tx.newsArtist.deleteMany({ where: { artistId: deleteId } })

            // 5. Album (sem unique constraint adicional)
            await tx.album.updateMany({ where: { artistId: deleteId }, data: { artistId: keepId } })

            // 6. Activity (entityId genérico)
            await tx.activity.updateMany({
                where: { entityType: 'ARTIST', entityId: deleteId },
                data: { entityId: keepId },
            })

            // 7. Build final data using fieldOverrides (curator choices) + fill missing fields
            const overrides = fieldOverrides ?? {}
            const fillData: Record<string, unknown> = {}

            // Apply explicit curator overrides first
            if (overrides.nameRomanized) fillData.nameRomanized = overrides.nameRomanized
            if ('nameHangul' in overrides) fillData.nameHangul = overrides.nameHangul
            if ('birthName' in overrides) fillData.birthName = overrides.birthName
            if ('birthDate' in overrides) fillData.birthDate = overrides.birthDate ? new Date(overrides.birthDate) : null
            if ('height' in overrides) fillData.height = overrides.height
            if ('bloodType' in overrides) fillData.bloodType = overrides.bloodType
            if ('bio' in overrides) fillData.bio = overrides.bio
            if ('primaryImageUrl' in overrides) fillData.primaryImageUrl = overrides.primaryImageUrl
            if ('agencyId' in overrides) fillData.agencyId = overrides.agencyId

            // Fill remaining missing scalar fields from deleter (only if not already overridden)
            if (!('nameHangul' in overrides) && !keeper.nameHangul && deleter.nameHangul) fillData.nameHangul = deleter.nameHangul
            if (!('primaryImageUrl' in overrides) && !keeper.primaryImageUrl && deleter.primaryImageUrl) fillData.primaryImageUrl = deleter.primaryImageUrl
            if (!('bio' in overrides) && !keeper.bio && deleter.bio) fillData.bio = deleter.bio
            if (!('agencyId' in overrides) && !keeper.agencyId && deleter.agencyId) fillData.agencyId = deleter.agencyId
            if (!('birthDate' in overrides) && !keeper.birthDate && deleter.birthDate) fillData.birthDate = deleter.birthDate
            if (!('birthName' in overrides) && !keeper.birthName && deleter.birthName) fillData.birthName = deleter.birthName
            if (!('height' in overrides) && !keeper.height && deleter.height) fillData.height = deleter.height
            if (!('bloodType' in overrides) && !keeper.bloodType && deleter.bloodType) fillData.bloodType = deleter.bloodType
            // Always transfer identifiers if keeper lacks them
            if (!keeper.mbid && deleter.mbid) fillData.mbid = deleter.mbid
            if (!keeper.tmdbId && deleter.tmdbId) fillData.tmdbId = deleter.tmdbId

            // Sum metrics
            fillData.viewCount = keeper.viewCount + deleter.viewCount
            fillData.favoriteCount = keeper.favoriteCount + deleter.favoriteCount

            // Merge stageNames — also add deleter.nameRomanized as alias to prevent re-creation by sync
            const allNames = new Set([...keeper.stageNames, ...deleter.stageNames, deleter.nameRomanized])
            fillData.stageNames = Array.from(allNames)

            // 8. Delete the duplicate FIRST — frees unique constraints (nameRomanized, tmdbId, mbid)
            //    so that the subsequent update of keepId can safely use those values without conflicts.
            await tx.artist.delete({ where: { id: deleteId } })

            // 9. Update keeper with chosen field values (now safe — no unique conflicts from deleted artist)
            await tx.artist.update({ where: { id: keepId }, data: fillData })
        }, { timeout: 30000 })

        log.info('Artists merged', { keepId, deleteId, keepName: keeper.nameRomanized, deleteName: deleter.nameRomanized, hasOverrides: !!fieldOverrides })

        return NextResponse.json({
            message: 'Artistas mesclados com sucesso',
            kept: { id: keepId, nameRomanized: keeper.nameRomanized },
            deleted: { nameRomanized: deleter.nameRomanized },
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Merge error', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao mesclar artistas' }, { status: 500 })
    }
}
