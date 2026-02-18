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
})

/**
 * POST /api/admin/artists/merge
 * Merges all relations from deleteId into keepId, then deletes deleteId.
 */
export async function POST(request: NextRequest) {
    try {
        const { error } = await requireAdmin()
        if (error) return error

        const body = await request.json()
        const { keepId, deleteId } = mergeSchema.parse(body)

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

            // 7. Preencher campos faltantes no keeper com dados do deleter
            const fillData: Record<string, unknown> = {}
            if (!keeper.nameHangul && deleter.nameHangul) fillData.nameHangul = deleter.nameHangul
            if (!keeper.primaryImageUrl && deleter.primaryImageUrl) fillData.primaryImageUrl = deleter.primaryImageUrl
            if (!keeper.bio && deleter.bio) fillData.bio = deleter.bio
            if (!keeper.mbid && deleter.mbid) fillData.mbid = deleter.mbid
            if (!keeper.tmdbId && deleter.tmdbId) fillData.tmdbId = deleter.tmdbId
            if (!keeper.agencyId && deleter.agencyId) fillData.agencyId = deleter.agencyId
            if (!keeper.birthDate && deleter.birthDate) fillData.birthDate = deleter.birthDate
            if (!keeper.birthName && deleter.birthName) fillData.birthName = deleter.birthName
            if (!keeper.height && deleter.height) fillData.height = deleter.height
            if (!keeper.bloodType && deleter.bloodType) fillData.bloodType = deleter.bloodType
            // Somar métricas
            fillData.viewCount = keeper.viewCount + deleter.viewCount
            fillData.favoriteCount = keeper.favoriteCount + deleter.favoriteCount
            // Mesclar stageNames
            if (deleter.stageNames?.length) {
                const merged = Array.from(new Set([...keeper.stageNames, ...deleter.stageNames]))
                fillData.stageNames = merged
            }
            await tx.artist.update({ where: { id: keepId }, data: fillData })

            // 8. Deletar o duplicado
            await tx.artist.delete({ where: { id: deleteId } })
        }, { timeout: 30000 })

        log.info('Artists merged', { keepId, deleteId, keepName: keeper.nameRomanized, deleteName: deleter.nameRomanized })

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
