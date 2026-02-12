/**
 * TMDB Production Discovery Service
 *
 * Automatically discovers and adds Korean dramas and movies from TMDB
 * - Popular K-dramas
 * - Trending Korean content
 * - Highly rated Korean productions
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface TMDBProduction {
  id: number
  title?: string // movies
  name?: string // TV shows
  original_title?: string
  original_name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string // movies
  first_air_date?: string // TV shows
  vote_average: number
  vote_count: number
  popularity: number
  original_language: string
  genre_ids: number[]
}

interface TMDBProductionDetails extends TMDBProduction {
  genres: Array<{ id: number; name: string }>
  runtime?: number // movies
  episode_run_time?: number[] // TV shows
  number_of_seasons?: number
  number_of_episodes?: number
  status: string
  tagline: string
  homepage: string
  videos?: {
    results: Array<{
      key: string
      site: string
      type: string
    }>
  }
  credits?: {
    cast: Array<{
      id: number
      name: string
      character: string
      profile_path: string | null
    }>
  }
}

export interface DiscoveredProduction {
  tmdbId: number
  tmdbType: 'movie' | 'tv'
  titlePt: string
  titleKr: string | null
  synopsis: string
  imageUrl: string | null
  backdropUrl: string | null
  galleryUrls: string[]
  releaseDate: Date | null
  runtime: number | null
  voteAverage: number
  trailerUrl: string | null
  tags: string[]
  cast: Array<{
    tmdbId: number
    name: string
    character: string
  }>
}

export class TMDBProductionDiscoveryService {
  private rateLimiter: RateLimiter

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)
  }

  /**
   * Discover popular K-dramas
   */
  async discoverKDramas(count: number = 5): Promise<DiscoveredProduction[]> {
    console.log(`🔍 Discovering ${count} K-dramas from TMDB...`)

    const discovered: DiscoveredProduction[] = []
    const seenIds = new Set<number>()

    // Strategy 1: Popular Korean TV shows
    const popularTV = await this.getPopularKoreanTV(count * 2)

    for (const show of popularTV) {
      if (seenIds.has(show.id)) continue
      if (discovered.length >= count) break

      seenIds.add(show.id)

      await this.rateLimiter.acquire()
      const details = await this.getTVDetails(show.id)
      if (!details) continue

      discovered.push(this.mapTVToDiscoveredProduction(details))
    }

    console.log(`✅ Discovered ${discovered.length} K-dramas`)
    return discovered
  }

  /**
   * Discover popular Korean movies
   */
  async discoverKoreanMovies(count: number = 3): Promise<DiscoveredProduction[]> {
    console.log(`🔍 Discovering ${count} Korean movies from TMDB...`)

    const discovered: DiscoveredProduction[] = []
    const seenIds = new Set<number>()

    // Strategy: Popular Korean movies
    const popularMovies = await this.getPopularKoreanMovies(count * 2)

    for (const movie of popularMovies) {
      if (seenIds.has(movie.id)) continue
      if (discovered.length >= count) break

      seenIds.add(movie.id)

      await this.rateLimiter.acquire()
      const details = await this.getMovieDetails(movie.id)
      if (!details) continue

      discovered.push(this.mapMovieToDiscoveredProduction(details))
    }

    console.log(`✅ Discovered ${discovered.length} Korean movies`)
    return discovered
  }

  /**
   * Get popular Korean TV shows
   */
  private async getPopularKoreanTV(limit: number): Promise<TMDBProduction[]> {
    await this.rateLimiter.acquire()

    const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=popularity.desc&page=1`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch popular Korean TV:', response.statusText)
      return []
    }

    const data = await response.json()
    return (data.results || []).slice(0, limit)
  }

  /**
   * Get popular Korean movies
   */
  private async getPopularKoreanMovies(limit: number): Promise<TMDBProduction[]> {
    await this.rateLimiter.acquire()

    const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=popularity.desc&page=1`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('Failed to fetch popular Korean movies:', response.statusText)
      return []
    }

    const data = await response.json()
    return (data.results || []).slice(0, limit)
  }

  /**
   * Get TV show details with credits
   */
  private async getTVDetails(tmdbId: number): Promise<TMDBProductionDetails | null> {
    try {
      const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`

      const response = await fetch(url)
      if (!response.ok) return null

      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch TV details for ${tmdbId}:`, error)
      return null
    }
  }

  /**
   * Get movie details with credits
   */
  private async getMovieDetails(tmdbId: number): Promise<TMDBProductionDetails | null> {
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`

      const response = await fetch(url)
      if (!response.ok) return null

      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch movie details for ${tmdbId}:`, error)
      return null
    }
  }

  /**
   * Map TV show to DiscoveredProduction
   */
  private mapTVToDiscoveredProduction(details: TMDBProductionDetails): DiscoveredProduction {
    const title = details.name || details.original_name || 'Unknown Title'
    const koreanTitle = details.original_language === 'ko' ? (details.original_name || null) : null

    // Extract trailer
    const youtubeTrailer = details.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    const trailerUrl = youtubeTrailer ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}` : null

    // Extract cast (top 5)
    const cast = (details.credits?.cast || []).slice(0, 5).map((c) => ({
      tmdbId: c.id,
      name: c.name,
      character: c.character,
    }))

    // Generate tags
    const tags: string[] = ['K-Drama']
    if (details.genres) {
      tags.push(...details.genres.map((g) => g.name))
    }

    // Extract images
    const galleryUrls: string[] = []
    if (details.backdrop_path) {
      galleryUrls.push(`${TMDB_IMAGE_BASE}${details.backdrop_path}`)
    }

    return {
      tmdbId: details.id,
      tmdbType: 'tv',
      titlePt: title,
      titleKr: koreanTitle,
      synopsis: details.overview || 'Sem sinopse disponível.',
      imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
      galleryUrls,
      releaseDate: details.first_air_date ? new Date(details.first_air_date) : null,
      runtime: details.episode_run_time?.[0] || null,
      voteAverage: details.vote_average,
      trailerUrl,
      tags,
      cast,
    }
  }

  /**
   * Busca imagens de uma produção existente pelo tmdbId
   * Útil para corrigir produções sem imagem no banco
   */
  async fetchProductionImages(tmdbId: number, type: 'movie' | 'tv'): Promise<{
    imageUrl: string | null;
    backdropUrl: string | null;
  }> {
    const details = type === 'tv'
      ? await this.getTVDetails(tmdbId)
      : await this.getMovieDetails(tmdbId);

    if (!details) return { imageUrl: null, backdropUrl: null };

    return {
      imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
    };
  }

  /**
   * Map movie to DiscoveredProduction
   */
  private mapMovieToDiscoveredProduction(details: TMDBProductionDetails): DiscoveredProduction {
    const title = details.title || details.original_title || 'Unknown Title'
    const koreanTitle = details.original_language === 'ko' ? (details.original_title || null) : null

    // Extract trailer
    const youtubeTrailer = details.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )
    const trailerUrl = youtubeTrailer ? `https://www.youtube.com/watch?v=${youtubeTrailer.key}` : null

    // Extract cast (top 5)
    const cast = (details.credits?.cast || []).slice(0, 5).map((c) => ({
      tmdbId: c.id,
      name: c.name,
      character: c.character,
    }))

    // Generate tags
    const tags: string[] = ['Filme Coreano']
    if (details.genres) {
      tags.push(...details.genres.map((g) => g.name))
    }

    // Extract images
    const galleryUrls: string[] = []
    if (details.backdrop_path) {
      galleryUrls.push(`${TMDB_IMAGE_BASE}${details.backdrop_path}`)
    }

    return {
      tmdbId: details.id,
      tmdbType: 'movie',
      titlePt: title,
      titleKr: koreanTitle,
      synopsis: details.overview || 'Sem sinopse disponível.',
      imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
      galleryUrls,
      releaseDate: details.release_date ? new Date(details.release_date) : null,
      runtime: details.runtime || null,
      voteAverage: details.vote_average,
      trailerUrl,
      tags,
      cast,
    }
  }
}

/**
 * Singleton instance
 */
let instance: TMDBProductionDiscoveryService | null = null

export function getTMDBProductionDiscoveryService(): TMDBProductionDiscoveryService {
  if (!instance) {
    instance = new TMDBProductionDiscoveryService()
  }
  return instance
}
