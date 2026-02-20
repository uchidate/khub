/**
 * Production Age Rating Service
 *
 * Busca a classificação etária (DJCTQ) do TMDB para produções.
 * Prioridade: BR (DJCTQ) → fallback para KR (KMRB, mapeado para DJCTQ)
 *
 * - Filmes: GET /movie/{id}/release_dates → certification do país BR ou KR
 * - Séries: GET /tv/{id}/content_ratings  → rating do país BR ou KR
 *
 * Mapeamento BR (DJCTQ) — valores idênticos:
 *   'L', '10', '12', '14', '16', '18'
 *
 * Mapeamento KR (KMRB) → DJCTQ:
 *   'All'                  → 'L'   (todos os públicos)
 *   '12'                   → '12'
 *   '15'                   → '14'  (sem equivalente exato; DJCTQ 14 é o mais próximo)
 *   '18' / 'Restricted'   → '18'
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const VALID_RATINGS = new Set(['L', '10', '12', '14', '16', '18'])

/** Mapeamento KMRB (KR) → DJCTQ (BR) */
const KR_TO_DJCTQ: Record<string, string> = {
  'All':                   'L',
  '12':                    '12',
  '15':                    '14',
  '18':                    '18',
  'Restricted Screening':  '18',
  'Restricted':            '18',
}

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
   * Busca a classificação etária no TMDB para um tmdbId + tmdbType.
   * Tenta BR (DJCTQ) primeiro; se não encontrado, tenta KR (KMRB → mapeado para DJCTQ).
   * Retorna null se nenhuma classificação válida for encontrada.
   */
  async fetchAgeRating(tmdbId: number | string, tmdbType: 'movie' | 'tv'): Promise<string | null> {
    await this.rateLimiter.acquire()

    try {
      if (tmdbType === 'movie') {
        const url = `${TMDB_BASE_URL}/movie/${tmdbId}/release_dates?api_key=${TMDB_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return null

        const data = await res.json() as ReleaseDatesResponse

        // 1. Tentar BR (DJCTQ)
        const br = data.results?.find((r) => r.iso_3166_1 === 'BR')
        if (br) {
          const cert = br.release_dates.find((d) => d.type === 3)?.certification
            ?? br.release_dates[0]?.certification
          if (cert && VALID_RATINGS.has(cert)) return cert
        }

        // 2. Fallback: KR (KMRB → DJCTQ)
        const kr = data.results?.find((r) => r.iso_3166_1 === 'KR')
        if (kr) {
          const cert = kr.release_dates.find((d) => d.type === 3)?.certification
            ?? kr.release_dates[0]?.certification
          if (cert) {
            const mapped = KR_TO_DJCTQ[cert]
            if (mapped) return mapped
          }
        }

        return null
      } else {
        const url = `${TMDB_BASE_URL}/tv/${tmdbId}/content_ratings?api_key=${TMDB_API_KEY}`
        const res = await fetch(url)
        if (!res.ok) return null

        const data = await res.json() as ContentRatingsResponse

        // 1. Tentar BR (DJCTQ)
        const br = data.results?.find((r) => r.iso_3166_1 === 'BR')
        if (br?.rating && VALID_RATINGS.has(br.rating)) return br.rating

        // 2. Fallback: KR (KMRB → DJCTQ)
        const kr = data.results?.find((r) => r.iso_3166_1 === 'KR')
        if (kr?.rating) {
          const mapped = KR_TO_DJCTQ[kr.rating]
          if (mapped) return mapped
        }

        return null
      }
    } catch {
      return null
    }
  }

  /**
   * Sincroniza a classificação etária de uma produção específica.
   * Só atualiza se a produção tiver tmdbId e ageRating estiver null.
   * Sempre marca ageRatingSyncAt = now() para evitar reprocessamento imediato.
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

    // Sempre registra a tentativa — evita reprocessar produções sem dados no TMDB
    await prisma.production.update({
      where: { id: productionId },
      data: {
        ageRatingSyncAt: new Date(),
        ...(ageRating ? { ageRating } : {}),
      },
    })

    if (!ageRating) {
      return { updated: false, ageRating: null, reason: 'not_found_on_tmdb' }
    }

    return { updated: true, ageRating }
  }

  /**
   * Sincroniza a classificação de produções que têm tmdbId mas não têm ageRating.
   * Exclui produções já tentadas nos últimos `retryCooldownDays` dias
   * para evitar reprocessar sempre as mesmas sem dados no TMDB.
   */
  async syncPendingAgeRatings(limit: number = 20, retryCooldownDays = 7): Promise<{
    processed: number
    updated: number
    notFound: number
  }> {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - retryCooldownDays)

    const productions = await prisma.production.findMany({
      where: {
        ageRating: null,
        tmdbId: { not: null },
        // Incluir: nunca tentadas OU tentadas há mais de retryCooldownDays dias
        OR: [
          { ageRatingSyncAt: null },
          { ageRatingSyncAt: { lt: cutoff } },
        ],
      },
      select: { id: true, titlePt: true },
      take: limit,
      // Prioriza as nunca tentadas (null primeiro), depois as mais antigas
      orderBy: [{ ageRatingSyncAt: 'asc' }],
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
