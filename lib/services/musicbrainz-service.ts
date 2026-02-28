/**
 * MusicBrainz Service
 *
 * Free music metadata API — no authentication needed, just User-Agent header.
 * Rate limit: 1 request/second (enforced via sleep between requests).
 *
 * Base URL: https://musicbrainz.org/ws/2/
 * Cover Art: https://coverartarchive.org/release-group/{mbid}/front
 */

const MB_BASE_URL = 'https://musicbrainz.org/ws/2'
const CAA_BASE_URL = 'https://coverartarchive.org'
const USER_AGENT = 'HallyuHub/1.0 (https://hallyuhub.com.br)'

// MusicBrainz requires at least 1s between requests
const RATE_LIMIT_MS = 1100

export type MBReleaseType = 'ALBUM' | 'EP' | 'SINGLE'

export interface MBRelease {
  mbid: string
  title: string
  type: MBReleaseType
  firstReleaseDate: string | null // 'YYYY-MM-DD' or 'YYYY' or null
  coverUrl: string | null
}

export interface MBArtistEnrichment {
  /** Platform → URL (instagram, twitter, youtube, spotify, weibo, tiktok…) */
  socialLinks: Record<string, string>
  /** TMDB person ID extracted from themoviedb.org URL */
  tmdbId: string | null
  /** Spotify artist page URL */
  spotifyArtistUrl: string | null
  /** Apple Music artist page URL */
  appleMusicArtistUrl: string | null
}

// Secondary release types to skip when importing discography.
// We keep "Remix" (useful), skip only noise types.
const SKIP_SECONDARY_TYPES = new Set([
  'Compilation', 'Live', 'DJ-mix', 'Mixtape/Street', 'Demo', 'Broadcast',
])

interface MBArtistResult {
  id: string
  name: string
  score: number
}

interface MBArtistSearchResponse {
  artists: MBArtistResult[]
}

interface MBReleaseGroup {
  id: string
  title: string
  'primary-type': string
  'secondary-types': string[]
  'first-release-date': string
}

interface MBReleaseGroupResponse {
  'release-groups': MBReleaseGroup[]
  'release-group-count': number
}

export class MusicBrainzService {
  private lastRequest = 0

  private async rateLimit(): Promise<void> {
    const now = Date.now()
    const elapsed = now - this.lastRequest
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed))
    }
    this.lastRequest = Date.now()
  }

  private async fetch<T>(url: string): Promise<T | null> {
    await this.rateLimit()

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      })

      if (response.status === 404) return null
      if (response.status === 503) {
        // MusicBrainz overloaded — wait and retry once
        await new Promise(resolve => setTimeout(resolve, 5000))
        await this.rateLimit()
        const retry = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
        })
        if (!retry.ok) return null
        return await retry.json()
      }

      if (!response.ok) return null

      return await response.json()
    } catch {
      return null
    }
  }

  /**
   * Search for an artist by name, returns their MusicBrainz ID (mbid).
   * Returns null if not found or confidence too low.
   *
   * Strategy:
   * 1. Exact-phrase search with quotes (high confidence ≥ 90)
   * 2. If not found, fallback without quotes (relaxed confidence ≥ 85)
   *    Useful for Korean/CJK names where tokenization differs.
   */
  async searchArtist(name: string): Promise<string | null> {
    // Attempt 1: exact phrase match (most reliable for latin names)
    const exactQuery = encodeURIComponent(`"${name}"`)
    const exactUrl = `${MB_BASE_URL}/artist/?query=${exactQuery}&limit=5&fmt=json`

    const exactResult = await this.fetch<MBArtistSearchResponse>(exactUrl)
    if (exactResult && exactResult.artists.length > 0) {
      const best = exactResult.artists[0]
      if (best.score >= 90) return best.id
    }

    // Attempt 2: fuzzy match without quotes (better for CJK/Korean names)
    const fuzzyQuery = encodeURIComponent(name)
    const fuzzyUrl = `${MB_BASE_URL}/artist/?query=${fuzzyQuery}&limit=5&fmt=json`

    const fuzzyResult = await this.fetch<MBArtistSearchResponse>(fuzzyUrl)
    if (!fuzzyResult || fuzzyResult.artists.length === 0) return null

    const best = fuzzyResult.artists[0]
    if (best.score >= 85) return best.id

    return null
  }

  /**
   * Fetch all release groups (albums, EPs, singles) for an artist by mbid.
   */
  async getArtistReleases(mbid: string): Promise<MBRelease[]> {
    // MusicBrainz API query values → our AlbumData type values
    const types: Array<{ query: string; type: MBReleaseType }> = [
      { query: 'album', type: 'ALBUM' },
      { query: 'ep', type: 'EP' },
      { query: 'single', type: 'SINGLE' },
    ]
    const releases: MBRelease[] = []

    for (const { query, type } of types) {
      const url = `${MB_BASE_URL}/release-group?artist=${mbid}&type=${query}&limit=100&fmt=json`
      const result = await this.fetch<MBReleaseGroupResponse>(url)
      if (!result) continue

      for (const rg of result['release-groups']) {
        // Skip noise types (Live, Compilation, etc.) but keep Remix and others
        const secondary = rg['secondary-types'] ?? []
        if (secondary.some((t: string) => SKIP_SECONDARY_TYPES.has(t))) continue

        const releaseDate = rg['first-release-date'] || null
        const coverUrl = await this.getCoverArt(rg.id)

        releases.push({
          mbid: rg.id,
          title: rg.title,
          type,
          firstReleaseDate: releaseDate,
          coverUrl,
        })
      }
    }

    return releases
  }

  /**
   * Try to get cover art from Cover Art Archive.
   * Returns URL if it exists, null otherwise.
   */
  async getCoverArt(releaseGroupMbid: string): Promise<string | null> {
    await this.rateLimit()

    try {
      const url = `${CAA_BASE_URL}/release-group/${releaseGroupMbid}/front`
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      })

      if (response.ok && response.url) {
        return response.url
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Fetch the musical group an artist is currently a member of.
   * Uses MusicBrainz artist-rels to find "member of band" relations.
   * Returns { name, mbid } of the group, or null if not found.
   */
  async getArtistGroup(mbid: string): Promise<{ name: string; mbid: string } | null> {
    const url = `${MB_BASE_URL}/artist/${mbid}?inc=artist-rels&fmt=json`
    const data = await this.fetch<any>(url)
    if (!data || !data.relations) return null

    // Find active "member of band" relations (no end-date = still active)
    const memberOf = data.relations.filter((r: any) =>
      r.type === 'member of band' && !r.ended && r.direction === 'forward'
    )

    if (memberOf.length === 0) return null

    // Prefer the most recently joined group (sort by begin date desc)
    memberOf.sort((a: any, b: any) => {
      const dateA = a['begin'] || '0000'
      const dateB = b['begin'] || '0000'
      return dateB.localeCompare(dateA)
    })

    const group = memberOf[0].artist
    return { name: group.name, mbid: group.id }
  }

  /**
   * Fetch debut date for a musical group (or artist) by mbid.
   * Uses MusicBrainz life-span.begin field.
   * Returns a Date object or null if not available.
   *
   * Handles partial dates:
   *   'YYYY-MM-DD' → exact date
   *   'YYYY-MM'    → first day of month
   *   'YYYY'       → January 1st of that year
   */
  async getGroupDebutDate(mbid: string): Promise<Date | null> {
    const url = `${MB_BASE_URL}/artist/${mbid}?fmt=json`
    const data = await this.fetch<any>(url)
    if (!data) return null

    const begin = data['life-span']?.begin as string | undefined
    if (!begin) return null

    // Normalize partial dates to full YYYY-MM-DD
    const normalized =
      begin.length === 10 ? begin :
      begin.length === 7  ? `${begin}-01` :
      begin.length === 4  ? `${begin}-01-01` : null

    if (!normalized) return null
    const date = new Date(normalized)
    return isNaN(date.getTime()) ? null : date
  }

  /**
   * Extract enrichment data from MusicBrainz URL relationships.
   * Fetches social links (Instagram, Twitter, YouTube, Spotify, Weibo, TikTok),
   * TMDB ID, and streaming page URLs for the artist.
   */
  async getArtistEnrichment(mbid: string): Promise<MBArtistEnrichment> {
    const url = `${MB_BASE_URL}/artist/${mbid}?inc=url-rels&fmt=json`
    const data = await this.fetch<{ relations?: Array<{ url?: { resource: string } }> }>(url)

    const result: MBArtistEnrichment = {
      socialLinks: {},
      tmdbId: null,
      spotifyArtistUrl: null,
      appleMusicArtistUrl: null,
    }

    if (!data?.relations) return result

    for (const rel of data.relations) {
      const resource = rel.url?.resource ?? ''
      if (!resource) continue

      if (/instagram\.com\//i.test(resource)) {
        result.socialLinks.instagram = resource
      } else if (/(?:twitter|x)\.com\//i.test(resource)) {
        result.socialLinks.twitter = resource
      } else if (/youtube\.com\/(?:channel|c|@)/i.test(resource)) {
        result.socialLinks.youtube = resource
      } else if (/weibo\.com\//i.test(resource)) {
        result.socialLinks.weibo = resource
      } else if (/tiktok\.com\//i.test(resource)) {
        result.socialLinks.tiktok = resource
      } else if (/open\.spotify\.com\/artist\//i.test(resource)) {
        result.socialLinks.spotify = resource
        result.spotifyArtistUrl = resource
      } else if (/music\.apple\.com\//i.test(resource)) {
        result.appleMusicArtistUrl = resource
      } else if (/themoviedb\.org\/person\/(\d+)/i.test(resource)) {
        const match = resource.match(/person\/(\d+)/)
        if (match) result.tmdbId = match[1]
      }
    }

    return result
  }

  /**
   * Convenience: search artist then fetch all releases.
   * Returns null if artist not found in MusicBrainz.
   */
  async getDiscography(artistName: string): Promise<{
    mbid: string
    releases: MBRelease[]
  } | null> {
    const mbid = await this.searchArtist(artistName)
    if (!mbid) return null

    const releases = await this.getArtistReleases(mbid)
    return { mbid, releases }
  }
}

let instance: MusicBrainzService | null = null

export function getMusicBrainzService(): MusicBrainzService {
  if (!instance) {
    instance = new MusicBrainzService()
  }
  return instance
}
