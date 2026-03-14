/**
 * TMDB Production Discovery Service
 *
 * Automatically discovers and adds Korean dramas and movies from TMDB
 * - Popular K-dramas
 * - Trending Korean content
 * - Highly rated Korean productions
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import { ProductionAgeRatingService } from './production-age-rating-service'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'

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
  networks?: Array<{ id: number; name: string; origin_country: string }>
  production_countries?: Array<{ iso_3166_1: string; name: string }>
  origin_country?: string[]
  videos?: {
    results: Array<{
      key: string
      site: string
      type: string
      official?: boolean
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

export interface PeriodPreviewItem {
  tmdbId: number
  tmdbType: 'tv' | 'movie'
  name: string
  originalName: string | null
  date: string | null
  posterUrl: string | null
  voteAverage: number | null
  voteCount: number
}

export interface PeriodPreviewResult {
  results: PeriodPreviewItem[]
  total: number
  page: number
  totalPages: number
}

export interface DiscoveredProduction {
  tmdbId: number
  tmdbType: 'movie' | 'tv'
  type: string          // 'Drama' | 'Filme'
  titlePt: string
  titleKr: string | null
  synopsis: string
  synopsisSource: 'tmdb_pt' | 'tmdb_en' | 'ai' | 'manual'
  tagline: string | null
  imageUrl: string | null
  backdropUrl: string | null
  galleryUrls: string[]
  releaseDate: Date | null
  runtime: number | null
  voteAverage: number | null
  trailerUrl: string | null
  tags: string[]
  ageRating: string | null
  cast: Array<{
    tmdbId: number
    name: string
    character: string
  }>
  // TV-specific
  episodeCount: number | null
  seasonCount: number | null
  episodeRuntime: number | null
  network: string | null
  productionStatus: string | null
}

export class TMDBProductionDiscoveryService {
  private rateLimiter: RateLimiter
  private ageRatingService: ProductionAgeRatingService

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)
    this.ageRatingService = new ProductionAgeRatingService()
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

      const ageRating = await this.ageRatingService.fetchAgeRating(show.id, 'tv')
      discovered.push(this.mapTVToDiscoveredProduction(details, ageRating))
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

      const ageRating = await this.ageRatingService.fetchAgeRating(movie.id, 'movie')
      discovered.push(this.mapMovieToDiscoveredProduction(details, ageRating))
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
   * Get TV show details with credits.
   * language='pt-BR' gives the localized title and synopsis when available.
   */
  private async getTVDetails(tmdbId: number, language = 'pt-BR'): Promise<TMDBProductionDetails | null> {
    try {
      const url = `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}&append_to_response=videos,credits`
      const response = await fetch(url)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error(`Failed to fetch TV details for ${tmdbId}:`, error)
      return null
    }
  }

  /**
   * Get movie details with credits.
   * language='pt-BR' gives the localized title and synopsis when available.
   */
  private async getMovieDetails(tmdbId: number, language = 'pt-BR'): Promise<TMDBProductionDetails | null> {
    try {
      const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=${language}&append_to_response=videos,credits`
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
  private mapTVToDiscoveredProduction(details: TMDBProductionDetails, ageRating: string | null = null, synopsisSource: DiscoveredProduction['synopsisSource'] = 'tmdb_pt'): DiscoveredProduction {
    const title = details.name || details.original_name || 'Unknown Title'
    const koreanTitle = details.original_language === 'ko' ? (details.original_name || null) : null

    // Extract trailer (prefer official)
    const youtubeTrailer = details.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
    ) || details.videos?.results?.find(
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
      type: 'K-Drama',
      titlePt: title,
      titleKr: koreanTitle,
      synopsis: details.overview || '',
      synopsisSource,
      tagline: details.tagline || null,
      imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
      galleryUrls,
      releaseDate: details.first_air_date ? new Date(details.first_air_date) : null,
      runtime: details.episode_run_time?.[0] || null,
      voteAverage: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
      trailerUrl,
      tags,
      ageRating,
      cast,
      episodeCount: details.number_of_episodes ?? null,
      seasonCount: details.number_of_seasons ?? null,
      episodeRuntime: details.episode_run_time?.[0] ?? null,
      network: details.networks?.[0]?.name ?? null,
      productionStatus: details.status || null,
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
  private mapMovieToDiscoveredProduction(details: TMDBProductionDetails, ageRating: string | null = null, synopsisSource: DiscoveredProduction['synopsisSource'] = 'tmdb_pt'): DiscoveredProduction {
    const title = details.title || details.original_title || 'Unknown Title'
    const koreanTitle = details.original_language === 'ko' ? (details.original_title || null) : null

    // Extract trailer (prefer official)
    const youtubeTrailer = details.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser') && v.official
    ) || details.videos?.results?.find(
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
      type: 'Filme',
      titlePt: title,
      titleKr: koreanTitle,
      synopsis: details.overview || '',
      synopsisSource,
      tagline: details.tagline || null,
      imageUrl: details.poster_path ? `${TMDB_IMAGE_BASE}${details.poster_path}` : null,
      backdropUrl: details.backdrop_path ? `${TMDB_IMAGE_BASE}${details.backdrop_path}` : null,
      galleryUrls,
      releaseDate: details.release_date ? new Date(details.release_date) : null,
      runtime: details.runtime || null,
      voteAverage: details.vote_average ? Math.round(details.vote_average * 10) / 10 : null,
      trailerUrl,
      tags,
      ageRating,
      cast,
      episodeCount: null,
      seasonCount: null,
      episodeRuntime: null,
      network: null,
      productionStatus: null,
    }
  }

  /**
   * Preview productions from TMDB by year/month — lightweight, no full detail fetch.
   * Used for the "Importar por Período" admin panel.
   */
  async previewByPeriod(params: {
    type: 'tv' | 'movie'
    year: number
    month?: number  // 1–12; undefined = full year
    page?: number   // 1-based TMDB page
    sortBy?: string // default: 'popularity.desc'
  }): Promise<PeriodPreviewResult> {
    const { type, year, month, page = 1, sortBy = 'popularity.desc' } = params

    const pad = (n: number) => String(n).padStart(2, '0')
    const dateFrom = month
      ? `${year}-${pad(month)}-01`
      : `${year}-01-01`
    const dateTo = month
      ? `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`
      : `${year}-12-31`

    const dateParam = type === 'tv'
      ? `first_air_date.gte=${dateFrom}&first_air_date.lte=${dateTo}`
      : `release_date.gte=${dateFrom}&release_date.lte=${dateTo}`

    const url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&with_original_language=ko&sort_by=${sortBy}&include_adult=false&${dateParam}&page=${page}`

    await this.rateLimiter.acquire()
    const response = await fetch(url)
    if (!response.ok) {
      console.error(`TMDB discover failed: ${response.status}`)
      return { results: [], total: 0, page, totalPages: 0 }
    }

    const data = await response.json()
    const results: PeriodPreviewItem[] = (data.results || []).map((item: TMDBProduction) => ({
      tmdbId: item.id,
      tmdbType: type,
      name: (type === 'tv' ? item.name : item.title) || item.original_name || item.original_title || '',
      originalName: item.original_language === 'ko'
        ? (item.original_name || item.original_title || null)
        : null,
      date: (type === 'tv' ? item.first_air_date : item.release_date) || null,
      posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : null,
      voteAverage: item.vote_average ? Math.round(item.vote_average * 10) / 10 : null,
      voteCount: item.vote_count,
    }))

    return {
      results,
      total: data.total_results || 0,
      page: data.page || page,
      totalPages: Math.min(data.total_pages || 0, 20), // TMDB caps at 500, cap at 20 for sanity
    }
  }

  /**
   * Fetch full production data for a specific TMDB ID + type.
   * Fetches with language=pt-BR first; if synopsis is empty, falls back to en-US.
   * Sets synopsisSource: 'tmdb_pt' | 'tmdb_en' based on what was found.
   */
  async getFullProductionData(tmdbId: number, type: 'tv' | 'movie'): Promise<DiscoveredProduction | null> {
    const details = type === 'tv'
      ? await this.getTVDetails(tmdbId, 'pt-BR')
      : await this.getMovieDetails(tmdbId, 'pt-BR')

    if (!details) return null

    // TMDB does not fall back synopsis to en-US — fetch separately when empty
    let synopsisSource: 'tmdb_pt' | 'tmdb_en' = 'tmdb_pt'
    if (!details.overview) {
      const enDetails = type === 'tv'
        ? await this.getTVDetails(tmdbId, 'en-US')
        : await this.getMovieDetails(tmdbId, 'en-US')
      if (enDetails?.overview) {
        details.overview = enDetails.overview
        synopsisSource = 'tmdb_en'
      }
    }

    const ageRating = await this.ageRatingService.fetchAgeRating(tmdbId, type)

    return type === 'tv'
      ? this.mapTVToDiscoveredProduction(details, ageRating, synopsisSource)
      : this.mapMovieToDiscoveredProduction(details, ageRating, synopsisSource)
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
