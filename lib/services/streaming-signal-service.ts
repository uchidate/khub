/**
 * Streaming Signal Service
 *
 * Arquitetura de provider pattern para ingestão de sinais de trending
 * baseados em presença de artistas em conteúdo popular de streaming.
 *
 * Fluxo:
 *   1. Cada provider busca os shows do momento em uma fonte (TMDB, FlixPatrol, etc.)
 *   2. Para cada show, busca o elenco e converte em StreamingSignal[]
 *   3. O cron fetch-streaming-signals usa todos os providers registrados
 *   4. Os signals são persistidos em StreamingTrendSignal (upsert)
 *   5. O cron update-trending soma os scores ativos no trendingScore final
 *
 * Para adicionar uma nova fonte: implementar StreamingSignalProvider e
 * registrar em SIGNAL_PROVIDERS.
 */

import { RateLimiter, RateLimiterPresets } from '@/lib/utils/rate-limiter'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

// Número de shows do ranking a processar (top N)
const TOP_N_SHOWS = 10

// Máximo de atores por show (para evitar rate limit excessivo)
const MAX_CAST_PER_SHOW = 15

// Dias até um signal expirar
const SIGNAL_TTL_DAYS = 7

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface StreamingSignal {
    /** TMDB person ID do ator */
    tmdbPersonId: number
    /** Nome do ator conforme TMDB */
    personName: string
    /** Título do show onde aparece */
    showTitle: string
    /** TMDB ID do show */
    showTmdbId: number
    /** Posição no ranking (1–N) */
    rank: number
    /** Identificador da fonte */
    source: string
}

export interface StreamingSignalProvider {
    /** Identificador único da fonte, ex: "tmdb_trending" */
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

/**
 * Converte posição no ranking em pontuação de boost.
 * Rank 1 = boost máximo, rank 10 = boost mínimo.
 */
export function rankToScore(rank: number): number {
    if (rank === 1) return 30
    if (rank === 2) return 25
    if (rank === 3) return 20
    if (rank <= 6) return 15
    return 10
}

// ─── TMDBTrendingProvider ─────────────────────────────────────────────────────

/**
 * Provider que usa o endpoint /trending/tv/week do TMDB
 * filtrado por produções coreanas (original_language=ko).
 */
export class TMDBTrendingProvider implements StreamingSignalProvider {
    readonly name = 'tmdb_trending'
    private rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)

    private async fetch<T>(path: string): Promise<T> {
        await this.rateLimiter.acquire()
        const url = `${TMDB_BASE_URL}${path}${path.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`
        const res = await fetch(url, { next: { revalidate: 0 } })
        if (!res.ok) throw new Error(`TMDB ${path} → ${res.status}`)
        return res.json() as Promise<T>
    }

    async fetchSignals(): Promise<StreamingSignal[]> {
        if (!TMDB_API_KEY) throw new Error('TMDB_API_KEY não configurado')

        // 1. Top trending Korean TV shows da semana
        const trending = await this.fetch<{ results: Array<{ id: number; name: string; original_language: string }> }>(
            '/trending/tv/week?with_original_language=ko'
        )

        const koreanShows = trending.results
            .filter(s => s.original_language === 'ko')
            .slice(0, TOP_N_SHOWS)

        if (koreanShows.length === 0) return []

        const signals: StreamingSignal[] = []

        // 2. Para cada show, buscar aggregate_credits (agrupa personagens de todas as temporadas)
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
                        showTmdbId: show.id,
                        rank,
                        source: this.name,
                    })
                }
            } catch (err) {
                // Não bloqueia os outros shows se um falhar
                console.warn(`[TMDBTrendingProvider] Erro ao buscar créditos de show ${show.id}:`, err)
            }
        }

        return signals
    }
}

// ─── Providers registrados ────────────────────────────────────────────────────
// Para adicionar nova fonte: instanciar aqui e inserir no array.

export function getSignalProviders(): StreamingSignalProvider[] {
    return [
        new TMDBTrendingProvider(),
        // new FlixPatrolProvider(),  // futuro
        // new JustWatchProvider(),   // futuro
    ]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function signalExpiresAt(fetchedAt: Date = new Date()): Date {
    return new Date(fetchedAt.getTime() + SIGNAL_TTL_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Retorna o boost total de streaming para um artista
 * somando os scores dos seus signals ainda não expirados.
 * Usado pelo update-trending para compor o trendingScore final.
 */
export function computeStreamingBoost(signals: Array<{ score: number }>): number {
    return signals.reduce((sum, s) => sum + s.score, 0)
}
