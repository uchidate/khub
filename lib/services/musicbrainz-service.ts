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
   */
  async searchArtist(name: string): Promise<string | null> {
    const query = encodeURIComponent(`"${name}"`)
    const url = `${MB_BASE_URL}/artist/?query=${query}&limit=5&fmt=json`

    const result = await this.fetch<MBArtistSearchResponse>(url)
    if (!result || result.artists.length === 0) return null

    // Accept only high-confidence matches (score >= 90)
    const best = result.artists[0]
    if (best.score < 90) return null

    return best.id
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
        // Skip compilations, live albums, remixes — secondary types
        if (rg['secondary-types']?.length > 0) continue

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
