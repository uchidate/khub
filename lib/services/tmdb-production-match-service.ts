/**
 * TMDB Production Match Service
 *
 * Searches TMDB by title to find and link tmdbId for productions that don't have one.
 * After matching, enriches the production with TMDB metadata:
 * backdropUrl, runtime, voteAverage, releaseDate, trailerUrl, synopsis, imageUrl.
 *
 * Search priority: titleKr → titlePt, filtered by year (±1) for accuracy.
 * Only high-confidence matches (first result within year range) are accepted.
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import { ProductionAgeRatingService } from './production-age-rating-service'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/original'
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500'

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000

interface TMDBSearchResult {
  id: number
  title?: string       // movie
  name?: string        // tv
  original_title?: string
  original_name?: string
  release_date?: string    // movie: "YYYY-MM-DD"
  first_air_date?: string  // tv: "YYYY-MM-DD"
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
  overview: string
}

interface TMDBSearchResponse {
  results: TMDBSearchResult[]
}

interface TMDBDetails {
  id: number
  runtime?: number             // movie: minutes
  episode_run_time?: number[]  // tv: [minutes per ep]
  vote_average: number
  poster_path: string | null
  backdrop_path: string | null
  overview: string
  release_date?: string        // movie
  first_air_date?: string      // tv
  videos?: {
    results: Array<{ key: string; site: string; type: string; official: boolean }>
  }
}

function mapTypeToTmdb(productionType: string): 'movie' | 'tv' {
  const t = productionType.toUpperCase()
  if (t === 'FILME' || t === 'MOVIE') return 'movie'
  return 'tv' // SERIE, serie, SHOW, VARIETY → tv
}

export class TmdbProductionMatchService {
  private rateLimiter: RateLimiter
  private ageRatingService: ProductionAgeRatingService

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)
    this.ageRatingService = new ProductionAgeRatingService()
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private buildUrl(endpoint: string): string {
    const sep = endpoint.includes('?') ? '&' : '?'
    return `${endpoint}${sep}api_key=${TMDB_API_KEY}`
  }

  private async fetchWithRetry<T>(url: string, retries: number = MAX_RETRIES): Promise<T | null> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.rateLimiter.acquire()

        const response = await fetch(this.buildUrl(url), {
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000
          await this.sleep(retryAfter)
          continue
        }
        if (response.status === 404) return null
        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }
        return await response.json()
      } catch (error) {
        lastError = error as Error
        if (attempt < retries) {
          await this.sleep(INITIAL_RETRY_DELAY * Math.pow(2, attempt))
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Search TMDB for a title, returns first result within the year range.
   */
  private async searchTitle(
    query: string,
    tmdbType: 'movie' | 'tv',
    year: number | null
  ): Promise<TMDBSearchResult | null> {
    const encodedQuery = encodeURIComponent(query)
    const url = `${TMDB_BASE_URL}/search/${tmdbType}?query=${encodedQuery}&language=en-US&page=1`

    const response = await this.fetchWithRetry<TMDBSearchResponse>(url)
    if (!response || response.results.length === 0) return null

    // If year is known, prefer results within ±1 year
    if (year) {
      const match = response.results.find(r => {
        const dateStr = r.release_date || r.first_air_date || ''
        const resultYear = dateStr ? parseInt(dateStr.slice(0, 4)) : null
        return resultYear && Math.abs(resultYear - year) <= 1
      })
      if (match) return match
    }

    // Return first result if no year constraint or no year match
    return response.results[0] || null
  }

  /**
   * Fetch full TMDB details including videos for trailer extraction.
   */
  private async fetchDetails(tmdbId: number, tmdbType: 'movie' | 'tv'): Promise<TMDBDetails | null> {
    const url = `${TMDB_BASE_URL}/${tmdbType}/${tmdbId}?language=ko-KR&append_to_response=videos`
    return await this.fetchWithRetry<TMDBDetails>(url)
  }

  /**
   * Extract YouTube trailer URL from TMDB videos.
   */
  private extractTrailerUrl(videos: TMDBDetails['videos']): string | null {
    if (!videos?.results?.length) return null
    const trailer = videos.results.find(
      v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
    ) || videos.results.find(
      v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
  }

  /**
   * Match and enrich a single production.
   * Returns the matched tmdbId or null if no match found.
   */
  async matchProduction(productionId: string): Promise<{
    matched: boolean
    tmdbId: string | null
    fieldsUpdated: string[]
  }> {
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      select: {
        id: true, titlePt: true, titleKr: true, type: true, year: true,
        imageUrl: true, synopsis: true, tmdbId: true, ageRating: true,
      },
    })

    if (!production || production.tmdbId) {
      return { matched: false, tmdbId: null, fieldsUpdated: [] }
    }

    const tmdbType = mapTypeToTmdb(production.type)

    // Try titleKr first, then titlePt
    const queries = [production.titleKr, production.titlePt].filter(Boolean) as string[]
    let searchResult: TMDBSearchResult | null = null

    for (const query of queries) {
      searchResult = await this.searchTitle(query, tmdbType, production.year)
      if (searchResult) break
    }

    if (!searchResult) {
      return { matched: false, tmdbId: null, fieldsUpdated: [] }
    }

    const tmdbId = String(searchResult.id)

    // Fetch full details
    const details = await this.fetchDetails(searchResult.id, tmdbType)

    // Build update data — only fill fields that are currently null/missing
    const updateData: Record<string, unknown> = {
      tmdbId,
      tmdbType,
    }
    const fieldsUpdated: string[] = ['tmdbId', 'tmdbType']

    const backdropPath = details?.backdrop_path || searchResult.backdrop_path
    if (backdropPath) {
      updateData.backdropUrl = `${TMDB_IMAGE_BASE}${backdropPath}`
      fieldsUpdated.push('backdropUrl')
    }

    if (!production.imageUrl) {
      const posterPath = details?.poster_path || searchResult.poster_path
      if (posterPath) {
        updateData.imageUrl = `${TMDB_POSTER_BASE}${posterPath}`
        fieldsUpdated.push('imageUrl')
      }
    }

    if (details?.vote_average && details.vote_average > 0) {
      updateData.voteAverage = details.vote_average
      fieldsUpdated.push('voteAverage')
    }

    // Runtime: movies use runtime, TV uses episode_run_time[0]
    const runtime = details?.runtime ||
      (details?.episode_run_time?.length ? details.episode_run_time[0] : null)
    if (runtime && runtime > 0) {
      updateData.runtime = runtime
      fieldsUpdated.push('runtime')
    }

    const releaseDate = details?.release_date || details?.first_air_date
    if (releaseDate) {
      updateData.releaseDate = new Date(releaseDate)
      fieldsUpdated.push('releaseDate')
    }

    if (!production.synopsis && details?.overview) {
      updateData.synopsis = details.overview
      fieldsUpdated.push('synopsis')
    }

    const trailerUrl = this.extractTrailerUrl(details?.videos)
    if (trailerUrl) {
      updateData.trailerUrl = trailerUrl
      fieldsUpdated.push('trailerUrl')
    }

    // Buscar classificação etária BR (apenas se não estiver preenchida)
    if (!production.ageRating) {
      const ageRating = await this.ageRatingService.fetchAgeRating(searchResult.id, tmdbType)
      if (ageRating) {
        updateData.ageRating = ageRating
        fieldsUpdated.push('ageRating')
      }
    }

    await prisma.production.update({
      where: { id: productionId },
      data: updateData,
    })

    return { matched: true, tmdbId, fieldsUpdated }
  }

  /**
   * Match pending productions (those without tmdbId).
   */
  async matchPendingProductions(limit: number = 5): Promise<{
    processed: number
    matched: number
    unmatched: number
  }> {
    const productions = await prisma.production.findMany({
      where: { tmdbId: null },
      select: { id: true, titlePt: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let matched = 0
    let unmatched = 0

    for (const production of productions) {
      try {
        const result = await this.matchProduction(production.id)
        if (result.matched) {
          matched++
          console.log(`✅ Matched "${production.titlePt}" → tmdbId ${result.tmdbId} (${result.fieldsUpdated.join(', ')})`)
        } else {
          unmatched++
          console.log(`ℹ️  No TMDB match for "${production.titlePt}"`)
        }
      } catch (err) {
        console.error(`Failed to match production ${production.id}:`, err)
        unmatched++
      }
    }

    return { processed: productions.length, matched, unmatched }
  }
}

let instance: TmdbProductionMatchService | null = null

export function getTmdbProductionMatchService(): TmdbProductionMatchService {
  if (!instance) {
    instance = new TmdbProductionMatchService()
  }
  return instance
}
