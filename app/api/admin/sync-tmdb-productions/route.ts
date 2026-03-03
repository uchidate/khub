/**
 * POST /api/admin/sync-tmdb-productions
 *
 * Sincroniza dados do TMDB para produções que já têm tmdbId.
 *
 * Parâmetros body:
 *   mode: 'empty_only' (padrão) | 'smart' | 'all'
 *     - empty_only: só atualiza campos nulos/vazios
 *     - smart: atualiza tudo exceto sinopse marcada como 'manual'
 *     - all: sobrescreve tudo, ignora qualquer estado atual
 *   limit: number — máximo de produções por lote (padrão 100, max 300)
 *   offset: number — pular N produções (paginação de lotes)
 *
 * Retorna stream de texto com progresso linha a linha.
 */

import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500'
const TMDB_IMG_ORIG = 'https://image.tmdb.org/t/p/original'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

async function fetchTmdb(path: string): Promise<Record<string, unknown> | null> {
    const sep = path.includes('?') ? '&' : '?'
    try {
        const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}`, {
            signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

function mapType(type: string): string {
    return type.toUpperCase() === 'FILME' ? 'movie' : 'tv'
}

export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    let mode: 'empty_only' | 'smart' | 'all' = 'empty_only'
    let limit = 100
    let offset = 0

    try {
        const body = await req.json()
        if (body?.mode === 'all') mode = 'all'
        else if (body?.mode === 'smart') mode = 'smart'
        if (body?.limit && typeof body.limit === 'number') {
            limit = Math.min(Math.max(body.limit, 1), 300)
        }
        if (body?.offset && typeof body.offset === 'number') {
            offset = Math.max(body.offset, 0)
        }
    } catch {
        // usa padrão
    }

    const baseWhere = {
        tmdbId: { not: null as null },
        isHidden: false,
        flaggedAsNonKorean: false,
    }

    const whereClause =
        mode === 'empty_only'
            ? {
                  ...baseWhere,
                  OR: [
                      { synopsis: null },
                      { imageUrl: null },
                      { year: null },
                      { tagline: null },
                      { trailerUrl: null },
                      { voteAverage: null },
                      { runtime: null },
                      { episodeCount: null },
                      { backdropUrl: null },
                  ],
              }
            : baseWhere

    const totalGlobal = await prisma.production.count({ where: whereClause })

    const productions = await prisma.production.findMany({
        where: whereClause,
        select: {
            id: true,
            titlePt: true,
            tmdbId: true,
            tmdbType: true,
            type: true,
            synopsis: true,
            synopsisSource: true,
            imageUrl: true,
            backdropUrl: true,
            tagline: true,
            year: true,
            voteAverage: true,
            runtime: true,
            episodeCount: true,
            seasonCount: true,
            episodeRuntime: true,
            network: true,
            productionStatus: true,
            trailerUrl: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
    })

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
        async start(controller) {
            const send = (line: string) => controller.enqueue(encoder.encode(line + '\n'))

            send(`TOTAL_GLOBAL:${totalGlobal}`)
            send(`TOTAL:${productions.length}`)

            let enriched = 0
            let complete = 0
            let noData = 0
            let errors = 0

            for (let i = 0; i < productions.length; i++) {
                const prod = productions[i]
                send(`PROGRESS:${i + 1}/${productions.length}:${prod.titlePt}`)

                try {
                    const tmdbType = prod.tmdbType || mapType(prod.type)
                    const endpoint = tmdbType === 'movie' ? 'movie' : 'tv'
                    const isMovie = tmdbType === 'movie'

                    const [pt, en, videos] = await Promise.all([
                        fetchTmdb(`/${endpoint}/${prod.tmdbId}?language=pt-BR`),
                        fetchTmdb(`/${endpoint}/${prod.tmdbId}?language=en-US`),
                        fetchTmdb(`/${endpoint}/${prod.tmdbId}/videos?language=en-US`),
                    ])

                    if (!pt && !en) {
                        send(`NO_DATA:${prod.titlePt}:${prod.id}`)
                        noData++
                        continue
                    }

                    const base = pt ?? en ?? {}
                    const updates: Record<string, unknown> = {}
                    const updatedFields: string[] = []

                    // Decide se pode atualizar um campo
                    const canUpdate = (isEmpty: boolean, isManualField = false) => {
                        if (mode === 'all') return true
                        if (mode === 'smart' && isManualField) return false
                        return isEmpty
                    }

                    // Título pt (nunca sobrescreve em smart/empty_only — só em all)
                    // Prioridade: pt-BR não-coreano → en não-coreano → pt-BR coreano → en coreano
                    const titlePtRaw = isMovie ? (pt?.title as string) : (pt?.name as string)
                    const titleEnRaw = isMovie ? (en?.title as string) : (en?.name as string)
                    const newTitle = (titlePtRaw && !KOREAN_REGEX.test(titlePtRaw) ? titlePtRaw : null)
                        || (titleEnRaw && !KOREAN_REGEX.test(titleEnRaw) ? titleEnRaw : null)
                        || titlePtRaw || titleEnRaw || null
                    if (newTitle && mode === 'all') {
                        updates.titlePt = newTitle
                        updatedFields.push('título')
                    }

                    // Tagline
                    const tagline = (pt?.tagline as string) || (en?.tagline as string) || null
                    if (tagline && canUpdate(!prod.tagline)) {
                        updates.tagline = tagline
                        updatedFields.push('tagline')
                    }

                    // Sinopse — smart respeita synopsisSource=manual
                    const synopsisPt = (pt?.overview as string) || null
                    const synopsisEn = (en?.overview as string) || null
                    const synopsisValue = synopsisPt || synopsisEn
                    if (synopsisValue && canUpdate(!prod.synopsis, prod.synopsisSource === 'manual')) {
                        updates.synopsis = synopsisValue
                        updates.synopsisSource = synopsisPt ? 'tmdb_pt' : 'tmdb_en'
                        updatedFields.push('sinopse')
                    }

                    // Poster
                    const posterPath = (base.poster_path as string) || null
                    if (posterPath && canUpdate(!prod.imageUrl)) {
                        updates.imageUrl = `${TMDB_IMG_W500}${posterPath}`
                        updatedFields.push('poster')
                    }

                    // Backdrop
                    const backdropPath = (base.backdrop_path as string) || null
                    if (backdropPath && canUpdate(!prod.backdropUrl)) {
                        updates.backdropUrl = `${TMDB_IMG_ORIG}${backdropPath}`
                        updatedFields.push('backdrop')
                    }

                    // Ano
                    const dateStr = isMovie
                        ? ((base.release_date as string) || null)
                        : ((base.first_air_date as string) || null)
                    const year = dateStr ? parseInt(dateStr.slice(0, 4)) || null : null
                    if (year && canUpdate(!prod.year)) {
                        updates.year = year
                        updatedFields.push('ano')
                    }

                    // Nota
                    const voteAverage = (base.vote_average as number) || null
                    if (voteAverage && canUpdate(!prod.voteAverage)) {
                        updates.voteAverage = voteAverage
                        updatedFields.push('nota')
                    }

                    // Status
                    const productionStatus = (base.status as string) || null
                    if (productionStatus && canUpdate(!prod.productionStatus)) {
                        updates.productionStatus = productionStatus
                        updatedFields.push('status')
                    }

                    // Trailer YouTube
                    const videoResults = (videos?.results as Array<{ site: string; type: string; key: string }>) ?? []
                    const trailer =
                        videoResults.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
                        videoResults.find(v => v.site === 'YouTube')
                    if (trailer && canUpdate(!prod.trailerUrl)) {
                        updates.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`
                        updatedFields.push('trailer')
                    }

                    // Campos específicos por tipo
                    if (isMovie) {
                        const runtime = (base.runtime as number) || null
                        if (runtime && canUpdate(!prod.runtime)) {
                            updates.runtime = runtime
                            updatedFields.push('duração')
                        }
                    } else {
                        const episodeCount = (base.number_of_episodes as number) ?? null
                        if (episodeCount && canUpdate(!prod.episodeCount)) {
                            updates.episodeCount = episodeCount
                            updatedFields.push('episódios')
                        }
                        const seasonCount = (base.number_of_seasons as number) ?? null
                        if (seasonCount && canUpdate(!prod.seasonCount)) {
                            updates.seasonCount = seasonCount
                            updatedFields.push('temporadas')
                        }
                        const episodeRuntimes = base.episode_run_time as number[] | undefined
                        const episodeRuntime =
                            Array.isArray(episodeRuntimes) && episodeRuntimes.length > 0
                                ? episodeRuntimes[0]
                                : null
                        if (episodeRuntime && canUpdate(!prod.episodeRuntime)) {
                            updates.episodeRuntime = episodeRuntime
                            updatedFields.push('dur/ep')
                        }
                        const networks = base.networks as Array<{ name: string }> | undefined
                        const network = networks?.[0]?.name ?? null
                        if (network && canUpdate(!prod.network)) {
                            updates.network = network
                            updatedFields.push('canal')
                        }
                    }

                    if (Object.keys(updates).length === 0) {
                        send(`COMPLETE:${prod.titlePt}`)
                        complete++
                        continue
                    }

                    await prisma.production.update({
                        where: { id: prod.id },
                        data: updates,
                    })

                    send(`ENRICHED:${prod.titlePt}:${updatedFields.join(',')}`)
                    enriched++
                } catch (e) {
                    send(`ERROR:${prod.titlePt}:${String(e)}`)
                    errors++
                }

                if (i < productions.length - 1) {
                    await new Promise(r => setTimeout(r, 300))
                }
            }

            send(`DONE:enriched=${enriched},complete=${complete},noData=${noData},errors=${errors}`)
            controller.close()
        },
    })

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
}
