/**
 * Social Links Sync Service
 *
 * Fetches social media external IDs for artists via TMDB /person/{tmdbId}/external_ids.
 * Builds a structured socialLinks JSON and persists it on the Artist record.
 *
 * Supported platforms: Instagram, Twitter/X, Facebook, YouTube, TikTok
 */

import { RateLimiter, RateLimiterPresets } from '../utils/rate-limiter'
import prisma from '../prisma'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 2000

// Resync social links older than 30 days
const SOCIAL_LINKS_STALE_DAYS = 30

interface TMDBExternalIds {
  imdb_id: string | null
  facebook_id: string | null
  instagram_id: string | null
  twitter_id: string | null
  youtube_id: string | null
  tiktok_id: string | null
}

export interface SocialLinks {
  [key: string]: string | undefined
  instagram?: string
  twitter?: string
  facebook?: string
  youtube?: string
  tiktok?: string
}

export class SocialLinksSyncService {
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

  private async fetchWithRetry<T>(url: string, retries: number = MAX_RETRIES): Promise<T | null> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.rateLimiter.acquire()

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${TMDB_API_KEY}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60') * 1000
          await this.sleep(retryAfter)
          continue
        }

        if (response.status === 404) {
          return null
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
   * Build socialLinks JSON from TMDB external IDs.
   * Returns null if no social platforms found.
   */
  private buildSocialLinks(externalIds: TMDBExternalIds): SocialLinks | null {
    const links: SocialLinks = {}

    if (externalIds.instagram_id) {
      links.instagram = `https://instagram.com/${externalIds.instagram_id}`
    }
    if (externalIds.twitter_id) {
      links.twitter = `https://twitter.com/${externalIds.twitter_id}`
    }
    if (externalIds.facebook_id) {
      links.facebook = `https://facebook.com/${externalIds.facebook_id}`
    }
    if (externalIds.youtube_id) {
      links.youtube = `https://youtube.com/@${externalIds.youtube_id}`
    }
    if (externalIds.tiktok_id) {
      links.tiktok = `https://tiktok.com/@${externalIds.tiktok_id}`
    }

    return Object.keys(links).length > 0 ? links : null
  }

  /**
   * Sync social links for a single artist.
   */
  async syncArtistSocialLinks(artistId: string): Promise<{
    updated: boolean
    platformsFound: string[]
  }> {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, tmdbId: true, nameRomanized: true },
    })

    if (!artist?.tmdbId) {
      return { updated: false, platformsFound: [] }
    }

    const url = `${TMDB_BASE_URL}/person/${artist.tmdbId}/external_ids`
    const externalIds = await this.fetchWithRetry<TMDBExternalIds>(url)

    const socialLinks = externalIds ? this.buildSocialLinks(externalIds) : null
    const platformsFound = socialLinks ? Object.keys(socialLinks) : []

    await prisma.artist.update({
      where: { id: artistId },
      data: {
        socialLinks: socialLinks ?? undefined,
        socialLinksUpdatedAt: new Date(),
      },
    })

    return { updated: !!socialLinks, platformsFound }
  }

  /**
   * Sync social links for artists that have no data or are stale.
   */
  async syncPendingArtistSocialLinks(limit: number = 10): Promise<{
    processed: number
    updated: number
    withLinks: number
  }> {
    const staleThreshold = new Date()
    staleThreshold.setDate(staleThreshold.getDate() - SOCIAL_LINKS_STALE_DAYS)

    const artists = await prisma.artist.findMany({
      where: {
        tmdbId: { not: null },
        OR: [
          { socialLinksUpdatedAt: null },
          { socialLinksUpdatedAt: { lt: staleThreshold } },
        ],
      },
      select: { id: true, nameRomanized: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let updated = 0
    let withLinks = 0

    for (const artist of artists) {
      try {
        const result = await this.syncArtistSocialLinks(artist.id)
        updated++
        if (result.updated) {
          withLinks++
          console.log(`✅ Social links for "${artist.nameRomanized}": ${result.platformsFound.join(', ')}`)
        } else {
          console.log(`ℹ️  No social links found for "${artist.nameRomanized}"`)
        }
      } catch (err) {
        console.error(`Failed to sync social links for artist ${artist.id}:`, err)
      }
    }

    return { processed: artists.length, updated, withLinks }
  }
}

let instance: SocialLinksSyncService | null = null

export function getSocialLinksSyncService(): SocialLinksSyncService {
  if (!instance) {
    instance = new SocialLinksSyncService()
  }
  return instance
}
