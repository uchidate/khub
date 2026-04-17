import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { onCronError } from '@/lib/utils/cron-logger'
import { acquireCronLock, releaseCronLock } from '@/lib/services/cron-lock-service'
import { getTMDBProductionDiscoveryService } from '@/lib/services/tmdb-production-discovery-service'
import { getProductionCastService } from '@/lib/services/production-cast-service'
import prisma from '@/lib/prisma'

/**
 * Cron Job - Import Korean Productions from TMDB
 *
 * Importa produções coreanas (K-Dramas + Filmes) de um intervalo de anos.
 * Verifica duplicatas antes de inserir. Sync de elenco imediato após criação.
 *
 * POST /api/cron/import-productions
 *   ?start_year=2025  (default: ano atual)
 *   ?end_year=2025    (default: ano atual)
 *   ?types=tv,movie   (default: tv,movie)
 *   ?dry_run=true     (default: false)
 */
export async function POST(request: NextRequest) {
    const requestId = `cron-import-productions-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

    const log = {
        info: (message: string, context?: Record<string, unknown>) => {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                service: 'CRON_IMPORT_PRODUCTIONS',
                message,
                requestId,
                ...context,
            }))
        },
        error: (message: string, context?: Record<string, unknown>) => {
            console.error(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                service: 'CRON_IMPORT_PRODUCTIONS',
                message,
                requestId,
                ...context,
            }))
        },
    }

    // Auth
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET

    if (!expectedToken) {
        log.error('CRON_SECRET not configured')
        return NextResponse.json({ success: false, error: 'Cron secret not configured' }, { status: 500 })
    }

    const tokenValid = authToken !== null
        && authToken.length === expectedToken.length
        && timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))

    if (!tokenValid) {
        log.error('Unauthorized access attempt')
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const params = request.nextUrl.searchParams
    const currentYear = new Date().getFullYear()
    const startYear = parseInt(params.get('start_year') || String(currentYear))
    const endYear   = parseInt(params.get('end_year')   || String(currentYear))
    const typesRaw  = params.get('types') || 'tv,movie'
    const dryRun    = params.get('dry_run') === 'true'
    const types     = typesRaw.split(',').filter(t => ['tv', 'movie'].includes(t)) as Array<'tv' | 'movie'>

    if (types.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid types. Use tv, movie or tv,movie' }, { status: 400 })
    }

    // Lock — evita importações paralelas
    const lockId = await acquireCronLock('cron-import-productions')
    if (!lockId) {
        return NextResponse.json({
            success: false,
            skipped: true,
            reason: 'already_running',
            message: 'Import de produções já está em execução.',
        }, { status: 409 })
    }

    log.info('Starting production import in background', { startYear, endYear, types, dryRun })

    runImport({ startYear, endYear, types, dryRun, lockId, log })
        .catch(onCronError(log, 'cron-import-productions', 'Unhandled error in production import'))

    return NextResponse.json({
        status: 'accepted',
        message: 'Production import started in background',
        requestId,
        params: { startYear, endYear, types, dryRun },
        timestamp: new Date().toISOString(),
    }, { status: 202 })
}

async function runImport({
    startYear, endYear, types, dryRun, lockId, log,
}: {
    startYear: number
    endYear: number
    types: Array<'tv' | 'movie'>
    dryRun: boolean
    lockId: string
    log: { info: (msg: string, ctx?: Record<string, unknown>) => void; error: (msg: string, ctx?: Record<string, unknown>) => void }
}) {
    const startTime = Date.now()
    const svc = getTMDBProductionDiscoveryService()
    const castSvc = getProductionCastService()

    let totalCreated   = 0
    let totalSkipped   = 0
    let totalErrors    = 0
    let totalInspected = 0

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    try {
        log.info('Import started', { startYear, endYear, types, dryRun })

        for (const type of types) {
            for (let year = startYear; year <= endYear; year++) {
                log.info(`Processing ${year} — ${type}`)

                let page = 1
                let totalPages = 1

                do {
                    await sleep(500) // TMDB rate limit

                    const preview = await svc.previewByPeriod({ type, year, page, sortBy: 'popularity.desc' })
                    totalPages = preview.totalPages

                    if (preview.results.length === 0) break

                    const tmdbIds = preview.results.map(r => String(r.tmdbId))
                    const existing = await prisma.production.findMany({
                        where: { tmdbId: { in: tmdbIds } },
                        select: { tmdbId: true },
                    })
                    const existingSet = new Set(existing.map(p => p.tmdbId!))
                    const newItems = preview.results.filter(r => !existingSet.has(String(r.tmdbId)))

                    totalInspected += preview.results.length
                    totalSkipped   += preview.results.length - newItems.length

                    if (dryRun) {
                        log.info(`DRY RUN page ${page}/${totalPages}`, {
                            total: preview.results.length, new: newItems.length, year, type,
                        })
                        page++
                        continue
                    }

                    for (const item of newItems) {
                        try {
                            const prod = await svc.getFullProductionData(item.tmdbId, type)
                            if (!prod) { totalErrors++; continue }

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

                            try {
                                await castSvc.syncProductionCast(newProd.id)
                            } catch {
                                // Cast sync failed — will be retried by cast-sync cron
                            }

                            totalCreated++
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err)
                            if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
                                totalSkipped++
                            } else {
                                log.error(`Failed to import tmdbId ${item.tmdbId}`, { error: msg })
                                totalErrors++
                            }
                        }
                    }

                    page++
                } while (page <= totalPages)
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000)
        log.info('Import completed', { totalInspected, totalCreated, totalSkipped, totalErrors, duration_s: duration })
    } finally {
        await releaseCronLock('cron-import-productions', lockId)
        await prisma.$disconnect()
    }
}

export async function GET() {
    return NextResponse.json({
        error: 'Method not allowed. Use POST.',
        hint: 'POST /api/cron/import-productions?start_year=2025&end_year=2025&types=tv,movie',
    }, { status: 405 })
}
