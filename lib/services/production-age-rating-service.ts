/**
 * Production Age Rating Service
 *
 * Busca a classificação etária (DJCTQ) do TMDB para produções brasileiras.
 *
 * - Filmes: GET /movie/{id}/release_dates → certification do país BR
 * - Séries: GET /tv/{id}/content_ratings  → rating do país BR
 *
 * Mapeamento TMDB BR → ageRating interno:
 *   'L', '10', '12', '14', '16', '18' → valores idênticos ao DJCTQ
 *   Qualquer outro valor ou ausência → null (sem classificação)
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const VALID_RATINGS = new Set(['L', '10', '12', '14', '16', '18'])

interface ReleaseDateEntry {
  certification: string
  release_date: string
  type: number
}

interface ReleaseDatesResponse {
  results: Array<{
    iso_3166_1: string
    release_dates: ReleaseDateEntry[]
  }>
}

interface ContentRatingsResponse {
  results: Array<{
    iso_3166_1: string
    rating: string
  }>
}

export class ProductionAgeRatingService {
  private rateLimiter: RateLimiter

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)
  }

  /**
   * Busca a classificação etária BR no TMDB para um tmdbId + tmdbType.
   * Retorna null se não encontrada ou se o valor não for um rating DJCTQ válido.
   */
  async fetchAgeRating(tmdbId: number | string, tmdbType: 'movie' | 'tv'): Promise<string | null> {
    await this.rateLimiter.acquire()

    try {
      if (tmdbType === 'movie') {
        const url = `${TMDB_BASE_URL}/movie/${tmdbId}/release_dates?api_key=${TMDB_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return null

        const data: ReleaseDateEntry & ReleaseDatesResponse = await res.json()
        const br = (data as unknown as ReleaseDatesResponse).results?.find(
          (r) => r.iso_3166_1 === 'BR'
        )
        if (!br) return null

        // Pegar a certification mais restritiva (type 3 = theatrical release)
        const cert = br.release_dates.find((d) => d.type === 3)?.certification
          ?? br.release_dates[0]?.certification
        return cert && VALID_RATINGS.has(cert) ? cert : null
      } else {
        const url = `${TMDB_BASE_URL}/tv/${tmdbId}/content_ratings?api_key=${TMDB_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return null

        const data: ContentRatingsResponse = await res.json()
        const br = data.results?.find((r) => r.iso_3166_1 === 'BR')
        if (!br) return null

        return br.rating && VALID_RATINGS.has(br.rating) ? br.rating : null
      }
    } catch {
      return null
    }
  }

  /**
   * Sincroniza a classificação etária de uma produção específica.
   * Só atualiza se a produção tiver tmdbId e ageRating estiver null.
   */
  async syncProductionAgeRating(productionId: string): Promise<{
    updated: boolean
    ageRating: string | null
    reason?: string
  }> {
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      select: { id: true, tmdbId: true, tmdbType: true, ageRating: true, titlePt: true },
    })

    if (!production) return { updated: false, ageRating: null, reason: 'not_found' }
    if (!production.tmdbId || !production.tmdbType) {
      return { updated: false, ageRating: null, reason: 'no_tmdb_id' }
    }
    if (production.ageRating) {
      return { updated: false, ageRating: production.ageRating, reason: 'already_set' }
    }

    const ageRating = await this.fetchAgeRating(
      production.tmdbId,
      production.tmdbType as 'movie' | 'tv'
    )

    if (!ageRating) {
      return { updated: false, ageRating: null, reason: 'not_found_on_tmdb' }
    }

    await prisma.production.update({
      where: { id: productionId },
      data: { ageRating },
    })

    return { updated: true, ageRating }
  }

  /**
   * Sincroniza a classificação de produções que têm tmdbId mas não têm ageRating.
   */
  async syncPendingAgeRatings(limit: number = 20): Promise<{
    processed: number
    updated: number
    notFound: number
  }> {
    const productions = await prisma.production.findMany({
      where: { ageRating: null, tmdbId: { not: null } },
      select: { id: true, titlePt: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let updated = 0
    let notFound = 0

    for (const production of productions) {
      const result = await this.syncProductionAgeRating(production.id)
      if (result.updated) {
        updated++
        console.log(`✅ [AgeRating] "${production.titlePt}" → ${result.ageRating}`)
      } else {
        notFound++
        console.log(`ℹ️  [AgeRating] "${production.titlePt}" → ${result.reason}`)
      }
    }

    return { processed: productions.length, updated, notFound }
  }
}

let instance: ProductionAgeRatingService | null = null

export function getProductionAgeRatingService(): ProductionAgeRatingService {
  if (!instance) {
    instance = new ProductionAgeRatingService()
  }
  return instance
}
