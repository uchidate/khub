/**
 * Streaming Show Service
 *
 * Busca e persiste o catálogo de shows populares nos streamings.
 * Separado do StreamingTrendSignal (artist-centric) — este serviço é show-centric.
 *
 * Fontes (TMDB):
 *   - trending_global: /trending/tv/day  → top 20 shows globais hoje (filtra Korean)
 *   - netflix_br:      /discover/tv?with_watch_providers=8  → K-dramas na Netflix
 *   - disney_br:       /discover/tv?with_watch_providers=337
 *   - prime_br:        /discover/tv?with_watch_providers=119
 *   - apple_br:        /discover/tv?with_watch_providers=350
 *
 * Para cada show: busca detalhes completos (/tv/{id}) → poster, ano, nota, isKorean.
 * Cruza tmdbId com Production.tmdbId do banco para gerar link interno.
 */

import prisma from '@/lib/prisma'
import { RateLimiter, RateLimiterPresets } from '@/lib/utils/rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { STREAMING_CONFIG, STREAMING_TAB_ORDER } from '@/lib/config/streaming-platforms'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

// Top N shows por plataforma (10 para platforms, até 20 para trending_global)
const TOP_N_PLATFORM = 10
const TOP_N_TRENDING = 20

// TTL: 2 dias (cron roda diariamente, buffer de segurança)
const SHOW_TTL_MS = 2 * 24 * 60 * 60 * 1000

const log = createLogger('STREAMING-SHOW-SERVICE')

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface TMDBShow {
    id: number
    name: string
    poster_path: string | null
    first_air_date?: string
    vote_average?: number
    original_language?: string
}

interface EnrichedShow {
    tmdbId: string
    showTitle: string
    posterUrl: string | null
    year: number | null
    voteAverage: number | null
    isKorean: boolean
}

export interface ShowSyncResult {
    source: string
    fetched: number
    upserted: number
    error?: string
}

// ─── TMDB fetch com rate limiter ──────────────────────────────────────────────

const rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)

async function tmdbFetch<T>(path: string): Promise<T> {
    await rateLimiter.acquire()
    const sep = path.includes('?') ? '&' : '?'
    const url = `${TMDB_BASE_URL}${path}${sep}api_key=${TMDB_API_KEY}`
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`)
    return res.json() as Promise<T>
}

// ─── Fetch por fonte ───────────────────────────────────────────────────────────

async function fetchShowsForSource(source: string): Promise<TMDBShow[]> {
    if (source === 'trending_global') {
        // Top 20 shows globais de hoje (todos os idiomas — filtramos Korean depois)
        const data = await tmdbFetch<{ results: TMDBShow[] }>('/trending/tv/day')
        return data.results.slice(0, TOP_N_TRENDING)
    }

    const cfg = STREAMING_CONFIG[source]
    const providerId = cfg?.tmdbProviderId
    if (!providerId) return []

    // K-dramas populares na plataforma (filtro de idioma + provider)
    const params = new URLSearchParams({
        with_original_language: 'ko',
        sort_by: 'popularity.desc',
        include_adult: 'false',
        with_watch_providers: String(providerId),
        watch_region: 'BR',
    })
    const data = await tmdbFetch<{ results: TMDBShow[] }>(`/discover/tv?${params}`)
    return data.results
        .filter(s => s.original_language === 'ko')
        .slice(0, TOP_N_PLATFORM)
}

// ─── Enriquecimento: detalhes por show ────────────────────────────────────────

async function enrichShow(show: TMDBShow): Promise<EnrichedShow> {
    try {
        const detail = await tmdbFetch<{
            poster_path: string | null
            first_air_date?: string
            vote_average?: number
            original_language?: string
        }>(`/tv/${show.id}`)

        const year = detail.first_air_date
            ? new Date(detail.first_air_date).getFullYear()
            : null

        return {
            tmdbId: String(show.id),
            showTitle: show.name,
            posterUrl: detail.poster_path ? `${TMDB_IMAGE_BASE}${detail.poster_path}` : null,
            year: isNaN(year as number) ? null : year,
            voteAverage: detail.vote_average ?? null,
            isKorean: detail.original_language === 'ko',
        }
    } catch {
        // Fallback: usa dados básicos do listing
        const year = show.first_air_date
            ? new Date(show.first_air_date).getFullYear()
            : null
        return {
            tmdbId: String(show.id),
            showTitle: show.name,
            posterUrl: show.poster_path ? `${TMDB_IMAGE_BASE}${show.poster_path}` : null,
            year: isNaN(year as number) ? null : year,
            voteAverage: show.vote_average ?? null,
            isKorean: show.original_language === 'ko',
        }
    }
}

// ─── Match com Production interna ─────────────────────────────────────────────

async function matchProductions(tmdbIds: string[]): Promise<Map<string, string>> {
    if (tmdbIds.length === 0) return new Map()
    const matched = await prisma.production.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { id: true, tmdbId: true },
    })
    return new Map(matched.filter(p => p.tmdbId).map(p => [p.tmdbId!, p.id]))
}

// ─── Persistência ─────────────────────────────────────────────────────────────

async function persist(source: string, shows: Array<EnrichedShow & { productionId?: string }>): Promise<number> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + SHOW_TTL_MS)

    // Full refresh por source
    await prisma.streamingShow.deleteMany({ where: { source } })

    if (shows.length === 0) return 0

    await prisma.streamingShow.createMany({
        data: shows.map((show, i) => ({
            source,
            rank: i + 1,
            showTitle: show.showTitle,
            tmdbId: show.tmdbId,
            posterUrl: show.posterUrl,
            year: show.year,
            voteAverage: show.voteAverage,
            isKorean: show.isKorean,
            productionId: show.productionId ?? null,
            fetchedAt: now,
            expiresAt,
        })),
        skipDuplicates: true,
    })

    return shows.length
}

// ─── Sincronização principal ──────────────────────────────────────────────────

export async function syncStreamingShows(): Promise<ShowSyncResult[]> {
    if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY não configurado')

    const results: ShowSyncResult[] = []
    const sources = STREAMING_TAB_ORDER

    for (const source of sources) {
        const result: ShowSyncResult = { source, fetched: 0, upserted: 0 }

        try {
            log.info(`Fetching shows for ${source}`)
            const raw = await fetchShowsForSource(source)
            result.fetched = raw.length

            if (raw.length === 0) {
                results.push(result)
                continue
            }

            // Enriquecer com detalhes TMDB
            const enriched: EnrichedShow[] = []
            for (const show of raw) {
                enriched.push(await enrichShow(show))
            }

            // Para trending_global: filtrar apenas K-dramas
            const filtered = source === 'trending_global'
                ? enriched.filter(s => s.isKorean)
                : enriched

            if (filtered.length === 0) {
                results.push(result)
                continue
            }

            // Cruzar com Productions do banco
            const tmdbIds = filtered.map(s => s.tmdbId)
            const productionMap = await matchProductions(tmdbIds)

            const withProductions = filtered.map(s => ({
                ...s,
                productionId: productionMap.get(s.tmdbId),
            }))

            result.upserted = await persist(source, withProductions)
            log.info(`${source}: ${result.fetched} fetched, ${filtered.length} Korean, ${result.upserted} saved`)
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            result.error = msg
            log.error(`${source} failed: ${msg}`)
        }

        results.push(result)
    }

    return results
}
