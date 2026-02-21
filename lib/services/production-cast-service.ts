/**
 * Production Cast Service
 *
 * Fetches the top 5 cast members from TMDB for each production (movie/TV)
 * and creates/updates them as Artist records, linking via ArtistProduction.
 *
 * Direction: Production → fetch cast → upsert Artists + ArtistProduction
 * (Complementary to filmography-sync-service which goes Artist → Productions)
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import { isRelevantToKoreanCulture } from '../utils/korean-validation'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000

// Resync cast older than 30 days
const CAST_SYNC_STALE_DAYS = 30

interface TMDBCastMember {
  id: number
  name: string
  original_name: string
  character: string
  order: number
  profile_path: string | null
  known_for_department: string
  popularity: number
}

interface TMDBCreditsResponse {
  cast: TMDBCastMember[]
}

interface TMDBPersonDetails {
  id: number
  name: string
  biography: string
  birthday: string | null
  profile_path: string | null
  popularity: number
  // Origin validation fields
  place_of_birth: string | null
  also_known_as: string[]
}

export class ProductionCastService {
  private rateLimiter: RateLimiter

  constructor() {
    if (!TMDB_API_KEY) {
      throw new Error('TMDB_API_KEY is not configured')
    }
    this.rateLimiter = new RateLimiter(RateLimiterPresets.TMDB)
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private buildUrl(endpoint: string): string {
    const sep = endpoint.includes('?') ? '&' : '?'
    return `${endpoint}${sep}api_key=${TMDB_API_KEY}`
  }

  private async fetchWithRetry<T>(url: string, retries: number = MAX_RETRIES): Promise<T> {
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

        if (response.status === 404) {
          return null as T
        }

        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        if (attempt < retries) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt)
          await this.sleep(delay)
        }
      }
    }

    throw lastError || new Error('Request failed after retries')
  }

  /**
   * Fetch top N cast members for a production from TMDB
   */
  private async getProductionCast(
    tmdbId: number,
    tmdbType: 'movie' | 'tv',
    topN: number = 5
  ): Promise<TMDBCastMember[]> {
    const endpoint = tmdbType === 'movie'
      ? `${TMDB_BASE_URL}/movie/${tmdbId}/credits?language=ko-KR`
      : `${TMDB_BASE_URL}/tv/${tmdbId}/credits?language=ko-KR`

    const result = await this.fetchWithRetry<TMDBCreditsResponse>(endpoint)
    if (!result) return []

    return result.cast
      .filter(m => m.known_for_department === 'Acting')
      .sort((a, b) => a.order - b.order)
      .slice(0, topN)
  }

  /**
   * Fetch full person details from TMDB
   */
  private async getPersonDetails(tmdbPersonId: number): Promise<TMDBPersonDetails | null> {
    const url = `${TMDB_BASE_URL}/person/${tmdbPersonId}?language=ko-KR`
    return await this.fetchWithRetry<TMDBPersonDetails>(url)
  }

  /**
   * Sync cast for a single production.
   * Upserts Artists and ArtistProduction links.
   */
  async syncProductionCast(productionId: string): Promise<{ synced: number; skipped: number }> {
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      select: { id: true, tmdbId: true, tmdbType: true, titlePt: true },
    })

    if (!production?.tmdbId || !production?.tmdbType) {
      return { synced: 0, skipped: 1 }
    }

    const tmdbId = parseInt(production.tmdbId)
    const tmdbType = production.tmdbType as 'movie' | 'tv'

    const castMembers = await this.getProductionCast(tmdbId, tmdbType, 5)

    let synced = 0

    for (const member of castMembers) {
      try {
        // Check if artist already exists by tmdbId
        const existing = await prisma.artist.findUnique({
          where: { tmdbId: String(member.id) },
          select: { id: true },
        })

        let artistId: string

        if (existing) {
          artistId = existing.id
        } else {
          // Fetch full details to create a richer Artist record
          const details = await this.getPersonDetails(member.id)

          // VALIDATION: Check if cast member is relevant to Korean culture
          const isRelevant = details ? isRelevantToKoreanCulture(details) : false
          if (!isRelevant && details) {
            console.warn(`⚠️  Non-Korean cast member detected: "${member.name}" (tmdbId: ${member.id}, birthplace: ${details.place_of_birth || 'N/A'})`)
          }

          const nameRomanized = member.name
          // Ensure uniqueness — if name exists, append TMDB id
          const nameCandidate = nameRomanized
          const nameExists = await prisma.artist.findUnique({
            where: { nameRomanized: nameCandidate },
            select: { id: true },
          })

          const finalName = nameExists ? `${nameRomanized} (${member.id})` : nameRomanized

          const created = await prisma.artist.create({
            data: {
              nameRomanized: finalName,
              nameHangul: member.original_name !== member.name ? member.original_name : null,
              primaryImageUrl: member.profile_path
                ? `${TMDB_IMAGE_BASE_URL}${member.profile_path}`
                : null,
              bio: details?.biography || null,
              birthDate: details?.birthday ? new Date(details.birthday) : null,
              placeOfBirth: details?.place_of_birth || null,
              roles: ['ATOR'],
              tmdbId: String(member.id),
              tmdbSyncStatus: 'SYNCED',
              tmdbLastSync: new Date(),
              tmdbLastAttempt: new Date(),
              translationStatus: 'pending',
              // AUTO-FLAG if not relevant to Korean culture
              flaggedAsNonKorean: !isRelevant,
              flaggedAt: !isRelevant ? new Date() : null,
            },
          })

          artistId = created.id
        }

        // Upsert ArtistProduction link
        await prisma.artistProduction.upsert({
          where: {
            artistId_productionId: {
              artistId,
              productionId: production.id,
            },
          },
          create: {
            artistId,
            productionId: production.id,
            role: member.character || null,
          },
          update: {
            role: member.character || null,
          },
        })

        synced++
      } catch (err) {
        console.error(`Failed to sync cast member ${member.name} (${member.id}):`, err)
      }
    }

    // Update castSyncAt
    await prisma.production.update({
      where: { id: productionId },
      data: { castSyncAt: new Date() },
    })

    return { synced, skipped: castMembers.length - synced }
  }

  /**
   * Sync cast for pending productions (castSyncAt IS NULL or stale).
   */
  async syncPendingProductionCasts(limit: number = 5): Promise<{
    processed: number
    totalSynced: number
    totalSkipped: number
  }> {
    const staleThreshold = new Date()
    staleThreshold.setDate(staleThreshold.getDate() - CAST_SYNC_STALE_DAYS)

    const productions = await prisma.production.findMany({
      where: {
        tmdbId: { not: null },
        OR: [
          { castSyncAt: null },
          { castSyncAt: { lt: staleThreshold } },
        ],
      },
      select: { id: true, titlePt: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let totalSynced = 0
    let totalSkipped = 0

    for (const production of productions) {
      try {
        const result = await this.syncProductionCast(production.id)
        totalSynced += result.synced
        totalSkipped += result.skipped
        console.log(`✅ Cast synced for "${production.titlePt}": ${result.synced} actors`)
      } catch (err) {
        console.error(`Failed to sync cast for production ${production.id}:`, err)
        totalSkipped++
      }
    }

    return { processed: productions.length, totalSynced, totalSkipped }
  }
}

let instance: ProductionCastService | null = null

export function getProductionCastService(): ProductionCastService {
  if (!instance) {
    instance = new ProductionCastService()
  }
  return instance
}
