/**
 * Streaming Signal Service
 *
 * Arquitetura de provider pattern para ingestão de sinais de trending
 * baseados em presença de artistas em conteúdo popular de streaming.
 *
 * Fluxo:
 *   1. Cada provider busca os shows do momento em uma fonte
 *   2. Para cada show, extrai o elenco e converte em StreamingSignal[]
 *   3. O cron fetch-streaming-signals usa todos os providers registrados
 *   4. Os signals são persistidos em StreamingTrendSignal (upsert)
 *   5. Ao final do cron, update-trending é executado automaticamente
 *
 * Providers:
 *   - TMDBTrendingProvider:      top K-dramas via /discover/tv (TMDB API)
 *   - InternalProductionProvider: top produções do nosso DB via ArtistProduction
 *
 * Para adicionar nova fonte: implementar StreamingSignalProvider e
 * registrar em getSignalProviders().
 */

import prisma from '@/lib/prisma'
import { RateLimiter, RateLimiterPresets } from '@/lib/utils/rate-limiter'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const TOP_N_SHOWS = 10
const MAX_CAST_PER_SHOW = 15
const SIGNAL_TTL_DAYS = 7

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StreamingSignal {
    /** TMDB person ID (providers externos) — mutuamente exclusivo com artistId */
    tmdbPersonId?: number
    /** ID interno do artista (InternalProductionProvider) — evita lookup extra */
    artistId?: string
    /** Nome do ator */
    personName: string
    /** Título do show */
    showTitle: string
    /** ID do show (TMDB ou internal productionId) */
    showTmdbId: string
    /** Posição no ranking (1–N) */
    rank: number
    /** Identificador da fonte */
    source: string
}

export interface StreamingSignalProvider {
    readonly name: string
    fetchSignals(): Promise<StreamingSignal[]>
}

export interface SignalIngestionResult {
    source: string
    signalsFetched: number
    artistsMatched: number
    upserted: number
    errors: string[]
}

// ─── Score por ranking ────────────────────────────────────────────────────────

export function rankToScore(rank: number): number {
    if (rank === 1) return 30
    if (rank === 2) return 25
    if (rank === 3) return 20
    if (rank <= 6) return 15
    return 10
}

// ─── TMDBTrendingProvider ─────────────────────────────────────────────────────

/**
 * Busca K-dramas populares via TMDB /discover/tv (filtra por original_language=ko).
 * Mais confiável que /trending/tv/week que não suporta filtro por idioma.
 */
export class TMDBTrendingProvider implements StreamingSignalProvider {
    readonly name = 'tmdb_trending'
    private rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)

    private async fetch<T>(path: string): Promise<T> {
        await this.rateLimiter.acquire()
        const sep = path.includes('?') ? '&' : '?'
        const url = `${TMDB_BASE_URL}${path}${sep}api_key=${TMDB_API_KEY}`
        const res = await fetch(url, { next: { revalidate: 0 } })
        if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`)
        return res.json() as Promise<T>
    }

    async fetchSignals(): Promise<StreamingSignal[]> {
        if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY não configurado')

        // /discover/tv garante conteúdo coreano; /trending/tv/week ignora with_original_language
        const discover = await this.fetch<{
            results: Array<{ id: number; name: string; original_language: string }>
        }>('/discover/tv?with_original_language=ko&sort_by=popularity.desc&include_adult=false')

        const koreanShows = discover.results
            .filter(s => s.original_language === 'ko')
            .slice(0, TOP_N_SHOWS)

        if (koreanShows.length === 0) return []

        const signals: StreamingSignal[] = []

        for (let i = 0; i < koreanShows.length; i++) {
            const show = koreanShows[i]
            const rank = i + 1

            try {
                const credits = await this.fetch<{
                    cast: Array<{ id: number; name: string; order: number }>
                }>(`/tv/${show.id}/aggregate_credits`)

                const topCast = credits.cast
                    .sort((a, b) => a.order - b.order)
                    .slice(0, MAX_CAST_PER_SHOW)

                for (const member of topCast) {
                    signals.push({
                        tmdbPersonId: member.id,
                        personName: member.name,
                        showTitle: show.name,
                        showTmdbId: String(show.id),
                        rank,
                        source: this.name,
                    })
                }
            } catch (err) {
                console.warn(`[TMDBTrendingProvider] Erro ao buscar créditos de show ${show.id}:`, err)
            }
        }

        return signals
    }
}

// ─── InternalProductionProvider ───────────────────────────────────────────────

/**
 * Usa produções já cadastradas no banco (com elenco sincronizado via ArtistProduction).
 * Garante matches — artistas já estão no DB por definição.
 * Não requer chamadas externas.
 *
 * Critério: produções dos últimos 3 anos (recentes), com nota ≥ 7.0,
 * ordenadas por ano DESC para priorizar as mais recentes.
 * Se não houver produções recentes suficientes, complementa com as mais antigas.
 */
export class InternalProductionProvider implements StreamingSignalProvider {
    readonly name = 'internal_production'

    async fetchSignals(): Promise<StreamingSignal[]> {
        const threeYearsAgo = new Date().getFullYear() - 3

        // Prioridade 1: lançamentos recentes (últimos 3 anos) com nota ≥ 7.0
        const recent = await prisma.production.findMany({
            where: {
                flaggedAsNonKorean: false,
                voteAverage: { gte: 7.0 },
                year: { gte: threeYearsAgo },
                artists: { some: {} },
            },
            orderBy: [{ year: 'desc' }, { voteAverage: 'desc' }],
            take: TOP_N_SHOWS,
            select: { id: true, titlePt: true, year: true },
        })

        // Complementa com produções mais antigas se não atingir TOP_N_SHOWS
        let productionIds = recent.map(p => p.id)
        if (productionIds.length < TOP_N_SHOWS) {
            const older = await prisma.production.findMany({
                where: {
                    flaggedAsNonKorean: false,
                    voteAverage: { gte: 8.0 }, // exige nota mais alta para produções antigas
                    id: { notIn: productionIds },
                    artists: { some: {} },
                },
                orderBy: [{ voteAverage: 'desc' }],
                take: TOP_N_SHOWS - productionIds.length,
                select: { id: true },
            })
            productionIds = [...productionIds, ...older.map(p => p.id)]
        }

        const productions = await prisma.production.findMany({
            where: { id: { in: productionIds } },
            select: {
                id: true,
                titlePt: true,
                year: true,
                artists: {
                    orderBy: { castOrder: 'asc' },
                    take: MAX_CAST_PER_SHOW,
                    select: {
                        artistId: true,
                        castOrder: true,
                        artist: { select: { nameRomanized: true } },
                    },
                },
            },
        })

        // Reordena para manter a ordem original (recentes primeiro)
        productions.sort((a, b) => productionIds.indexOf(a.id) - productionIds.indexOf(b.id))

        const signals: StreamingSignal[] = []

        for (let i = 0; i < productions.length; i++) {
            const prod = productions[i]
            const rank = i + 1

            for (const cast of prod.artists) {
                signals.push({
                    artistId: cast.artistId,
                    personName: cast.artist.nameRomanized,
                    showTitle: prod.titlePt,
                    showTmdbId: `internal:${prod.id}`,
                    rank,
                    source: this.name,
                })
            }
        }

        return signals
    }
}

// ─── Providers registrados ────────────────────────────────────────────────────

export function getSignalProviders(): StreamingSignalProvider[] {
    return [
        new InternalProductionProvider(), // primeiro: sem API, resultados imediatos
        new TMDBTrendingProvider(),        // segundo: dados externos mais frescos
        // new FlixPatrolProvider(),        // futuro
    ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function signalExpiresAt(fetchedAt: Date = new Date()): Date {
    return new Date(fetchedAt.getTime() + SIGNAL_TTL_DAYS * 24 * 60 * 60 * 1000)
}

export function computeStreamingBoost(signals: Array<{ score: number }>): number {
    return signals.reduce((sum, s) => sum + s.score, 0)
}
