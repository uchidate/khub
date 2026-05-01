/**
 * POST /api/cron/import-streaming-unmatched
 *
 * Importa do TMDB as produções que aparecem no top N dos streamings
 * mas ainda não existem na base (productionId IS NULL em streaming_show).
 *
 * Após importar, re-cruza o tmdbId para linkar o streaming_show.
 * Produções criadas ficam isHidden=true para revisão editorial.
 *
 * Frequência sugerida: 1x por dia, logo após fetch-streaming-shows.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createLogger } from '@/lib/utils/logger'
import { onCronError } from '@/lib/utils/cron-logger'
import { getUnmatchedStreamingTmdbIds } from '@/lib/services/streaming-show-service'
import { getTMDBProductionDiscoveryService } from '@/lib/services/tmdb-production-discovery-service'
import { getProductionCastService } from '@/lib/services/production-cast-service'
import prisma from '@/lib/prisma'

export const maxDuration = 120

const log = createLogger('CRON-IMPORT-STREAMING-UNMATCHED')

function verifyToken(request: NextRequest): boolean {
    const authToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!expectedToken || !authToken) return false
    if (authToken.length !== expectedToken.length) return false
    try {
        return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
    } catch {
        return false
    }
}

async function run(topN: number) {
    const tmdbIds = await getUnmatchedStreamingTmdbIds(topN)
    if (tmdbIds.length === 0) {
        log.info('No unmatched streaming shows found')
        return { imported: 0, linked: 0, skipped: 0, errors: 0 }
    }

    log.info(`Found ${tmdbIds.length} unmatched streaming shows`, { tmdbIds })

    const svc = getTMDBProductionDiscoveryService()
    const castSvc = getProductionCastService()

    let imported = 0, linked = 0, skipped = 0, errors = 0

    for (const tmdbId of tmdbIds) {
        try {
            // Verifica se já existe no banco pelo tmdbId
            const existing = await prisma.production.findFirst({
                where: { tmdbId },
                select: { id: true },
            })

            let productionId: string

            if (existing) {
                productionId = existing.id
                skipped++
            } else {
                const prod = await svc.getFullProductionData(Number(tmdbId), 'tv')
                if (!prod) { errors++; continue }

                const releaseYear = prod.releaseDate ? prod.releaseDate.getUTCFullYear() : null
                const hasPtSynopsis = !!prod.synopsis && prod.synopsisSource === 'tmdb_pt'

                const newProd = await prisma.production.create({
                    data: {
                        titlePt:           prod.titlePt,
                        titleKr:           prod.titleKr,
                        type:              prod.type,
                        year:              releaseYear,
                        synopsis:          prod.synopsis || null,
                        synopsisSource:    prod.synopsis ? prod.synopsisSource : null,
                        tagline:           prod.tagline,
                        imageUrl:          prod.imageUrl,
                        backdropUrl:       prod.backdropUrl,
                        galleryUrls:       prod.galleryUrls,
                        releaseDate:       prod.releaseDate,
                        runtime:           prod.tmdbType === 'movie' ? prod.runtime : null,
                        episodeRuntime:    prod.tmdbType === 'tv' ? (prod.episodeRuntime ?? prod.runtime) : null,
                        voteAverage:       prod.voteAverage,
                        trailerUrl:        prod.trailerUrl,
                        tags:              prod.tags,
                        ageRating:         prod.ageRating,
                        tmdbId:            String(prod.tmdbId),
                        tmdbType:          prod.tmdbType,
                        episodeCount:      prod.episodeCount,
                        seasonCount:       prod.seasonCount,
                        network:           prod.network,
                        productionStatus:  prod.productionStatus,
                        translationStatus: hasPtSynopsis ? 'completed' : 'pending',
                        translatedAt:      hasPtSynopsis ? new Date() : null,
                        needsCuration:     true,
                        isHidden:          true,
                    },
                })

                productionId = newProd.id
                imported++
                log.info(`Imported: ${prod.titlePt} (tmdbId=${tmdbId})`)

                try {
                    await castSvc.syncProductionCast(productionId)
                } catch {
                    // cast sync não-bloqueante
                }
            }

            // Re-linka todos os streaming_show com este tmdbId
            const updated = await prisma.streamingShow.updateMany({
                where: { tmdbId, productionId: null },
                data: { productionId },
            })
            linked += updated.count

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
                skipped++
            } else {
                log.error(`Failed for tmdbId ${tmdbId}`, { error: msg })
                errors++
            }
        }
    }

    return { imported, linked, skipped, errors }
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const topN = Math.min(Number(request.nextUrl.searchParams.get('topN') ?? 10), 20)
    const requestId = `import-streaming-unmatched-${Date.now()}`
    log.info('Starting import of unmatched streaming shows', { requestId, topN })

    run(topN)
        .then(r => log.info('Import completed', { requestId, ...r }))
        .catch(onCronError(log, 'import-streaming-unmatched', 'Import failed'))

    return NextResponse.json({ success: true, status: 'accepted', requestId }, { status: 202 })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
