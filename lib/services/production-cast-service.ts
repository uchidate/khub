/**
 * Production Cast Service
 *
 * Fetches the top 20 cast members from TMDB for each production (movie/TV)
 * and creates/updates them as Artist records, linking via ArtistProduction.
 *
 * Direction: Production → fetch cast → upsert Artists + ArtistProduction
 * (Complementary to filmography-sync-service which goes Artist → Productions)
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import { isRelevantToKoreanCulture } from '../utils/korean-validation'
import { findArtistSocialLinks } from './wikidata-social-links'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// Detects Korean (Hangul) characters
const KOREAN_REGEX = /[\uAC00-\uD7AF\u3131-\u314E\u314F-\u3163]/

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000

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
  gender?: number // 0=unspecified, 1=female, 2=male, 3=non-binary
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
    topN: number = 20
  ): Promise<TMDBCastMember[]> {
    const endpoint = tmdbType === 'movie'
      ? `${TMDB_BASE_URL}/movie/${tmdbId}/credits?language=en-US`
      : `${TMDB_BASE_URL}/tv/${tmdbId}/credits?language=en-US`

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
    const url = `${TMDB_BASE_URL}/person/${tmdbPersonId}?language=en-US`
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
      // Mark as attempted even without tmdbType so the production leaves "Pendentes"
      if (production) {
        await prisma.production.update({
          where: { id: productionId },
          data: { castSyncAt: new Date() },
        })
      }
      return { synced: 0, skipped: 1 }
    }

    const tmdbId = parseInt(production.tmdbId)
    const tmdbType = production.tmdbType as 'movie' | 'tv'

    const castMembers = await this.getProductionCast(tmdbId, tmdbType, 20)

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

          // With en-US: member.name = romanized, member.original_name = Korean (Hangul)
          // Fallback: if member.name is still Korean (edge case), use original_name as romanized
          let nameRomanized = member.name
          let nameHangul: string | null = null

          if (KOREAN_REGEX.test(member.name)) {
            // Unexpected: name came back in Korean — treat original_name as hangul, name as hangul too
            nameHangul = member.name
            // Try original_name as romanized if it's not Korean
            if (member.original_name && !KOREAN_REGEX.test(member.original_name)) {
              nameRomanized = member.original_name
            } else {
              // Last resort: use member.name as-is (will be flagged and corrected by fix-names cron)
              nameRomanized = member.name
            }
          } else if (member.original_name && KOREAN_REGEX.test(member.original_name)) {
            nameHangul = member.original_name
          }

          // Ensure uniqueness — if name exists, append TMDB id
          const nameExists = await prisma.artist.findFirst({
            where: { nameRomanized },
            select: { id: true },
          })

          const finalName = nameExists ? `${nameRomanized} (${member.id})` : nameRomanized

          // Fetch Wikidata social links for the new artist
          const wikidataSocialLinks = await findArtistSocialLinks(finalName, nameHangul)

          const created = await prisma.artist.create({
            data: {
              nameRomanized: finalName,
              nameHangul,
              primaryImageUrl: member.profile_path
                ? `${TMDB_IMAGE_BASE_URL}${member.profile_path}`
                : null,
              bio: details?.biography || null,
              birthDate: details?.birthday ? new Date(details.birthday) : null,
              placeOfBirth: details?.place_of_birth || null,
              gender: details?.gender ?? null,
              roles: ['ATOR'],
              tmdbId: String(member.id),
              tmdbSyncStatus: 'SYNCED',
              tmdbLastSync: new Date(),
              tmdbLastAttempt: new Date(),
              translationStatus: 'pending',
              // AUTO-FLAG if not relevant to Korean culture
              flaggedAsNonKorean: !isRelevant,
              flaggedAt: !isRelevant ? new Date() : null,
              // Social links from Wikidata (if found)
              ...(Object.keys(wikidataSocialLinks).length > 0 && {
                socialLinks: wikidataSocialLinks,
                socialLinksUpdatedAt: new Date(),
              }),
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
            castOrder: member.order,
          },
          update: {
            role: member.character || null,
            castOrder: member.order,
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
   * Sync cast for pending productions: has tmdbId, no artists, never attempted.
   * castSyncAt IS NULL means it was never tried (or was reset).
   * Productions already tried (castSyncAt IS NOT NULL) but with no result
   * need manual intervention or a full resync.
   */
  async syncPendingProductionCasts(limit: number = 5): Promise<{
    processed: number
    totalSynced: number
    totalSkipped: number
  }> {
    const productions = await prisma.production.findMany({
      where: {
        tmdbId: { not: null },
        artists: { none: {} },
        castSyncAt: null,  // Never attempted — avoids re-processing "tried, found nothing" rows
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

  /**
   * Reset castSyncAt for ALL productions with a tmdbId so they get re-processed.
   * Returns { resetCount, total } where total = all productions eligible for sync.
   */
  async resetCastSyncAt(): Promise<{ resetCount: number; total: number }> {
    const result = await prisma.production.updateMany({
      where: { tmdbId: { not: null } },
      data: { castSyncAt: null },
    })
    return { resetCount: result.count, total: result.count }
  }
}

let instance: ProductionCastService | null = null

export function getProductionCastService(): ProductionCastService {
  if (!instance) {
    instance = new ProductionCastService()
  }
  return instance
}

