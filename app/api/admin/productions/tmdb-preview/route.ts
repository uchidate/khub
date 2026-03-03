/**
 * GET /api/admin/productions/tmdb-preview?id=<productionId>
 *
 * Busca TODOS os dados do TMDB para pré-visualização no formulário de edição
 * (sem salvar no banco). Retorna títulos, sinopses, imagens, metadados e trailer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500'
const TMDB_IMG_ORIG = 'https://image.tmdb.org/t/p/original'
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

async function fetchTmdb(path: string): Promise<Record<string, unknown> | null> {
    const sep = path.includes('?') ? '&' : '?'
    const url = `${TMDB_BASE}${path}${sep}api_key=${TMDB_API_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    return res.json()
}

function mapType(type: string): string {
    return type.toUpperCase() === 'FILME' ? 'movie' : 'tv'
}

export async function GET(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

    const production = await prisma.production.findUnique({
        where: { id },
        select: { tmdbId: true, tmdbType: true, type: true },
    })

    if (!production) return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })
    if (!production.tmdbId) return NextResponse.json({ error: 'Produção sem TMDB ID' }, { status: 400 })

    const tmdbType = production.tmdbType || mapType(production.type)
    const endpoint = tmdbType === 'movie' ? 'movie' : 'tv'
    const isMovie = tmdbType === 'movie'

    const [pt, en, videos] = await Promise.all([
        fetchTmdb(`/${endpoint}/${production.tmdbId}?language=pt-BR`),
        fetchTmdb(`/${endpoint}/${production.tmdbId}?language=en-US`),
        fetchTmdb(`/${endpoint}/${production.tmdbId}/videos?language=en-US`),
    ])

    if (!pt && !en) {
        return NextResponse.json({ error: 'Falha ao buscar dados do TMDB' }, { status: 502 })
    }

    const base = pt ?? en ?? {}

    // Títulos: pt-BR não-coreano → en não-coreano → pt-BR coreano → en coreano
    const titlePtRaw = isMovie ? (pt?.title as string || null) : (pt?.name as string || null)
    const titleEnRaw = isMovie ? (en?.title as string || null) : (en?.name as string || null)
    const titlePt = (titlePtRaw && !KOREAN_REGEX.test(titlePtRaw) ? titlePtRaw : null)
        || (titleEnRaw && !KOREAN_REGEX.test(titleEnRaw) ? titleEnRaw : null)
        || titlePtRaw || titleEnRaw || null
    const titleEn = titleEnRaw || null

    // Imagens
    const posterPath = (base.poster_path as string) || null
    const backdropPath = (base.backdrop_path as string) || null
    const imageUrl = posterPath ? `${TMDB_IMG_W500}${posterPath}` : null
    const backdropUrl = backdropPath ? `${TMDB_IMG_ORIG}${backdropPath}` : null

    // Ano
    const dateStr = isMovie
        ? ((base.release_date as string) || null)
        : ((base.first_air_date as string) || null)
    const year = dateStr ? (parseInt(dateStr.slice(0, 4)) || null) : null

    // Tagline
    const taglinePt = (pt?.tagline as string) || null
    const taglineEn = (en?.tagline as string) || null

    // Nota TMDB
    const voteAverage = (base.vote_average as number) || null

    // Status de produção
    const productionStatus = (base.status as string) || null

    // Trailer YouTube
    let trailerUrl: string | null = null
    const videoResults = (videos?.results as Array<{ site: string; type: string; key: string }>) ?? []
    const trailer =
        videoResults.find(v => v.site === 'YouTube' && v.type === 'Trailer') ??
        videoResults.find(v => v.site === 'YouTube')
    if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`

    // Filme
    const runtime = isMovie ? ((base.runtime as number) || null) : null

    // Série
    const episodeCount = !isMovie ? ((base.number_of_episodes as number) ?? null) : null
    const seasonCount = !isMovie ? ((base.number_of_seasons as number) ?? null) : null
    const episodeRuntimes = !isMovie ? (base.episode_run_time as number[]) : null
    const episodeRuntime =
        Array.isArray(episodeRuntimes) && episodeRuntimes.length > 0
            ? episodeRuntimes[0]
            : null
    const networks = base.networks as Array<{ name: string }> | undefined
    const network = !isMovie ? (networks?.[0]?.name ?? null) : null

    return NextResponse.json({
        titlePt,
        titleEn,
        synopsisPt: (pt?.overview as string) || null,
        synopsisEn: (en?.overview as string) || null,
        taglinePt,
        taglineEn,
        imageUrl,
        backdropUrl,
        year,
        voteAverage,
        runtime,
        episodeCount,
        seasonCount,
        episodeRuntime,
        network,
        productionStatus,
        trailerUrl,
    })
}
