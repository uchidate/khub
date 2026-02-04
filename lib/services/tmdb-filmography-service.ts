/**
 * TMDB Filmography Service
 *
 * Handles all interactions with TMDB API for fetching filmography data.
 * Features:
 * - Person search by romanized and Korean names
 * - Combined credits fetching (movies + TV shows)
 * - Rate limiting (40 req/10s as per TMDB limits)
 * - Retry logic with exponential backoff
 * - Response caching
 */

import {
  TMDBPerson,
  TMDBPersonSearchResult,
  TMDBPersonCombinedCredits,
  TMDBMovie,
  TMDBTVShow,
  TMDBProductionData,
  TMDBTranslations,
  TMDBWatchProviders,
} from '@/lib/types/tmdb'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// Rate limiting configuration
const MAX_TOKENS = 40
const REFILL_RATE = 4 // tokens per second
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000 // ms

// Cache configuration
const CACHE_TTL_PERSON_SEARCH = 24 * 60 * 60 * 1000 // 24 hours
const CACHE_TTL_PRODUCTION_DETAILS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CacheEntry<T> {
  data: T
  expires: number
}

export class RateLimitError extends Error {
  constructor(public retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`)
    this.name = 'RateLimitError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class TMDBFilmographyService {
  private tokens: number = MAX_TOKENS
  private lastRefill: number = Date.now()
  private cache = new Map<string, CacheEntry<any>>()

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private async refillTokens(): Promise<void> {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(MAX_TOKENS, this.tokens + elapsed * REFILL_RATE)
    this.lastRefill = now
  }

  private async acquireToken(count: number = 1): Promise<void> {
    await this.refillTokens()

    while (this.tokens < count) {
      const waitTime = ((count - this.tokens) / REFILL_RATE) * 1000
      await this.sleep(waitTime)
      await this.refillTokens()
    }

    this.tokens -= count
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ============================================================================
  // CACHING
  // ============================================================================

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && entry.expires > Date.now()) {
      return entry.data
    }
    this.cache.delete(key)
    return null
  }

  private setCached<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    })
  }

  // ============================================================================
  // HTTP REQUEST WITH RETRY
  // ============================================================================

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.acquireToken()

        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000
          throw new RateLimitError(retryAfter)
        }

        if (response.status === 404) {
          throw new NotFoundError(`Resource not found: ${url}`)
        }

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error

        if (error instanceof NotFoundError) {
          throw error // Don't retry on 404
        }

        if (error instanceof RateLimitError) {
          console.warn(`Rate limit hit, waiting ${error.retryAfter}ms...`)
          await this.sleep(error.retryAfter)
          continue
        }

        if (attempt < retries) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
          console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`)
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  // ============================================================================
  // PERSON SEARCH
  // ============================================================================

  /**
   * Find a person on TMDB by name (tries both romanized and Korean names)
   */
  async findPersonByName(
    nameRomanized: string,
    nameHangul: string | null
  ): Promise<TMDBPerson | null> {
    const cacheKey = `person:${nameRomanized}:${nameHangul || ''}`
    const cached = this.getCached<TMDBPerson>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Try romanized name first
      let person = await this.searchPerson(nameRomanized)

      // If not found and we have Korean name, try that
      if (!person && nameHangul) {
        person = await this.searchPerson(nameHangul)
      }

      if (person) {
        this.setCached(cacheKey, person, CACHE_TTL_PERSON_SEARCH)
      }

      return person
    } catch (error) {
      if (error instanceof NotFoundError) {
        return null
      }
      throw error
    }
  }

  private async searchPerson(query: string): Promise<TMDBPerson | null> {
    const url = `${TMDB_BASE_URL}/search/person?query=${encodeURIComponent(query)}&language=ko-KR`

    const result = await this.fetchWithRetry<TMDBPersonSearchResult>(url)

    if (result.results.length === 0) {
      return null
    }

    // Return the most popular match
    return result.results.sort((a, b) => b.popularity - a.popularity)[0]
  }

  // ============================================================================
  // CREDITS
  // ============================================================================

  /**
   * Get all credits (movies + TV shows) for a person
   */
  async getPersonCredits(tmdbId: number): Promise<TMDBPersonCombinedCredits> {
    const cacheKey = `credits:${tmdbId}`
    const cached = this.getCached<TMDBPersonCombinedCredits>(cacheKey)
    if (cached) {
      return cached
    }

    const url = `${TMDB_BASE_URL}/person/${tmdbId}/combined_credits?language=ko-KR`
    const credits = await this.fetchWithRetry<TMDBPersonCombinedCredits>(url)

    this.setCached(cacheKey, credits, CACHE_TTL_PERSON_SEARCH)
    return credits
  }

  // ============================================================================
  // PRODUCTION DETAILS
  // ============================================================================

  /**
   * Get detailed information about a movie
   */
  async getMovieDetails(movieId: number): Promise<TMDBMovie> {
    const cacheKey = `movie:${movieId}`
    const cached = this.getCached<TMDBMovie>(cacheKey)
    if (cached) {
      return cached
    }

    const url = `${TMDB_BASE_URL}/movie/${movieId}?language=ko-KR`
    const movie = await this.fetchWithRetry<TMDBMovie>(url)

    this.setCached(cacheKey, movie, CACHE_TTL_PRODUCTION_DETAILS)
    return movie
  }

  /**
   * Get detailed information about a TV show
   */
  async getTVShowDetails(tvId: number): Promise<TMDBTVShow> {
    const cacheKey = `tv:${tvId}`
    const cached = this.getCached<TMDBTVShow>(cacheKey)
    if (cached) {
      return cached
    }

    const url = `${TMDB_BASE_URL}/tv/${tvId}?language=ko-KR`
    const tv = await this.fetchWithRetry<TMDBTVShow>(url)

    this.setCached(cacheKey, tv, CACHE_TTL_PRODUCTION_DETAILS)
    return tv
  }

  /**
   * Get translations for a movie (to get Portuguese title)
   */
  async getMovieTranslations(movieId: number): Promise<TMDBTranslations> {
    const url = `${TMDB_BASE_URL}/movie/${movieId}/translations`
    return await this.fetchWithRetry<TMDBTranslations>(url)
  }

  /**
   * Get translations for a TV show (to get Portuguese title)
   */
  async getTVShowTranslations(tvId: number): Promise<TMDBTranslations> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/translations`
    return await this.fetchWithRetry<TMDBTranslations>(url)
  }

  /**
   * Get watch providers for a movie
   */
  async getMovieWatchProviders(movieId: number): Promise<TMDBWatchProviders> {
    const url = `${TMDB_BASE_URL}/movie/${movieId}/watch/providers`
    return await this.fetchWithRetry<TMDBWatchProviders>(url)
  }

  /**
   * Get watch providers for a TV show
   */
  async getTVShowWatchProviders(tvId: number): Promise<TMDBWatchProviders> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/watch/providers`
    return await this.fetchWithRetry<TMDBWatchProviders>(url)
  }

  // ============================================================================
  // DATA TRANSFORMATION
  // ============================================================================

  /**
   * Transform TMDB credits into our TMDBProductionData format
   */
  async transformCreditsToProductions(
    credits: TMDBPersonCombinedCredits
  ): Promise<TMDBProductionData[]> {
    const productions: TMDBProductionData[] = []

    // Process cast credits
    for (const credit of credits.cast) {
      try {
        const production = await this.transformCreditToProduction(credit, credit.character || null)
        if (production) {
          productions.push(production)
        }
      } catch (error) {
        console.error(`Failed to transform credit ${credit.id}:`, error)
        // Continue with other credits
      }
    }

    // Process crew credits (directors, writers, etc.)
    for (const credit of credits.crew) {
      try {
        const production = await this.transformCreditToProduction(credit, credit.job || null)
        if (production) {
          productions.push(production)
        }
      } catch (error) {
        console.error(`Failed to transform credit ${credit.id}:`, error)
        // Continue with other credits
      }
    }

    return productions
  }

  private async transformCreditToProduction(
    credit: any,
    role: string | null
  ): Promise<TMDBProductionData | null> {
    const isMovie = 'title' in credit
    const id = credit.id
    const tmdbType = isMovie ? 'movie' : 'tv'

    try {
      if (isMovie) {
        // Handle movie
        const details = await this.getMovieDetails(id)
        const translations = await this.getMovieTranslations(id)
        const ptTranslation = translations.translations.find(t => t.iso_639_1 === 'pt')
        const titlePt = ptTranslation?.data?.title || details.title

        // Get streaming providers (Brazil only)
        let streamingPlatforms: string[] = []
        try {
          const watchProviders = await this.getMovieWatchProviders(id)
          const brProviders = watchProviders.results['BR']
          if (brProviders?.flatrate) {
            streamingPlatforms = brProviders.flatrate.map(p => p.provider_name)
          }
        } catch {
          // Watch providers might not be available, that's okay
        }

        const year = details.release_date ? new Date(details.release_date).getFullYear() : null

        return {
          tmdbId: id,
          tmdbType: 'movie',
          title: titlePt,
          titleKr: details.original_title,
          year,
          synopsis: details.overview || null,
          imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : null,
          releaseDate: details.release_date ? new Date(details.release_date) : null,
          runtime: details.runtime,
          voteAverage: details.vote_average,
          streamingPlatforms,
          role,
        }
      } else {
        // Handle TV show
        const details = await this.getTVShowDetails(id)
        const translations = await this.getTVShowTranslations(id)
        const ptTranslation = translations.translations.find(t => t.iso_639_1 === 'pt')
        const titlePt = ptTranslation?.data?.name || details.name

        // Get streaming providers (Brazil only)
        let streamingPlatforms: string[] = []
        try {
          const watchProviders = await this.getTVShowWatchProviders(id)
          const brProviders = watchProviders.results['BR']
          if (brProviders?.flatrate) {
            streamingPlatforms = brProviders.flatrate.map(p => p.provider_name)
          }
        } catch {
          // Watch providers might not be available, that's okay
        }

        const year = details.first_air_date ? new Date(details.first_air_date).getFullYear() : null

        return {
          tmdbId: id,
          tmdbType: 'tv',
          title: titlePt,
          titleKr: details.original_name,
          year,
          synopsis: details.overview || null,
          imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : null,
          releaseDate: details.first_air_date ? new Date(details.first_air_date) : null,
          runtime: details.episode_run_time[0] || null,
          voteAverage: details.vote_average,
          streamingPlatforms,
          role,
        }
      }
    } catch (error) {
      console.error(`Failed to get details for ${tmdbType} ${id}:`, error)
      return null
    }
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Clear the cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
let instance: TMDBFilmographyService | null = null

export function getTMDBFilmographyService(): TMDBFilmographyService {
  if (!instance) {
    instance = new TMDBFilmographyService()
  }
  return instance
}
