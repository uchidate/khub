import { Resolver } from 'node:dns'
import { Agent, fetch as undiciFetch } from 'undici'

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

export interface SpotifyArtistCandidate {
  id: string
  name: string
  url: string
  imageUrl: string | null
  followers: number
  popularity: number
  genres: string[]
}

export interface SpotifyAlbum {
  id: string
  name: string
  url: string
  albumType: string
  releaseDate: string | null
  imageUrl: string | null
  totalTracks: number
}

export interface SpotifyTrack {
  id: string
  name: string
  url: string
  trackNumber: number | null
  discNumber: number | null
  durationMs: number | null
  isrc: string | null
}

interface SpotifyTokenResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
}

interface SpotifyArtistSearchResponse {
  artists: {
    items: Array<{
      id: string
      name: string
      external_urls: { spotify?: string }
      images: Array<{ url: string }>
      followers?: { total?: number }
      popularity?: number
      genres?: string[]
    }>
  }
}

interface SpotifyArtistAlbumsResponse {
  items: Array<{
    id: string
    name: string
    album_type: string
    release_date?: string
    external_urls: { spotify?: string }
    images: Array<{ url: string }>
    total_tracks: number
  }>
  next?: string | null
}

interface SpotifyAlbumTracksResponse {
  items: Array<{
    id: string
    name: string
    external_urls: { spotify?: string }
    track_number?: number
    disc_number?: number
    duration_ms?: number
    external_ids?: { isrc?: string }
  }>
}

class SpotifyService {
  private cachedToken: { value: string; expiresAt: number } | null = null
  private dispatcher: Agent | null = null
  private lastApiRequestAt = 0

  private getDispatcher() {
    if (this.dispatcher) return this.dispatcher

    const rawServers = process.env.SPOTIFY_DNS_SERVERS?.trim()
    if (!rawServers) return undefined

    const resolver = new Resolver()
    resolver.setServers(rawServers.split(',').map(server => server.trim()).filter(Boolean))

    this.dispatcher = new Agent({
      connect: {
        lookup(hostname, options, callback) {
          resolver.resolve4(hostname, (error, addresses) => {
            if (error) {
              callback(error, [], 4)
              return
            }
            callback(
              null,
              options.all ? addresses.map(address => ({ address, family: 4 })) : addresses[0],
              4
            )
          })
        },
      },
    })
    return this.dispatcher
  }

  private getCredentials() {
    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials are not configured')
    }
    return { clientId, clientSecret }
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now()
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.value
    }

    const { clientId, clientSecret } = this.getCredentials()
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    let response: Response
    try {
      response = await undiciFetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }),
        cache: 'no-store',
        ...(this.getDispatcher() ? { dispatcher: this.getDispatcher() } : {}),
      } as Parameters<typeof undiciFetch>[1]) as unknown as Response
    } catch {
      throw new Error('Não foi possível alcançar o Spotify. Verifique a conexão de rede/DNS do servidor.')
    }

    if (!response.ok) {
      throw new Error(`Spotify token request failed (${response.status})`)
    }

    const data = await response.json() as SpotifyTokenResponse
    this.cachedToken = {
      value: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    }
    return data.access_token
  }

  private async wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  private async requestApi(url: string, token: string): Promise<Response> {
    const minGapMs = 250
    const elapsed = Date.now() - this.lastApiRequestAt
    if (elapsed < minGapMs) await this.wait(minGapMs - elapsed)

    for (let attempt = 0; attempt < 5; attempt++) {
      this.lastApiRequestAt = Date.now()
      const response = await undiciFetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        ...(this.getDispatcher() ? { dispatcher: this.getDispatcher() } : {}),
      } as Parameters<typeof undiciFetch>[1]) as unknown as Response

      if (response.status !== 429) return response

      const retryAfter = Number(response.headers.get('retry-after'))
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(30_000, 1_000 * (attempt + 1))
      await this.wait(waitMs)
    }

    return undiciFetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      ...(this.getDispatcher() ? { dispatcher: this.getDispatcher() } : {}),
    } as Parameters<typeof undiciFetch>[1]) as unknown as Response
  }

  async searchArtists(query: string, limit = 8): Promise<SpotifyArtistCandidate[]> {
    const token = await this.getAccessToken()
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: String(Math.max(1, Math.min(limit, 20))),
    })
    let response: Response
    try {
      response = await this.requestApi(`${SPOTIFY_API_BASE}/search?${params}`, token)
    } catch {
      throw new Error('Não foi possível consultar o Spotify. Verifique a conexão de rede/DNS do servidor.')
    }

    if (!response.ok) {
      throw new Error(`Spotify artist search failed (${response.status})`)
    }

    const data = await response.json() as SpotifyArtistSearchResponse
    return data.artists.items
      .filter(item => item.external_urls.spotify)
      .map(item => ({
        id: item.id,
        name: item.name,
        url: item.external_urls.spotify!,
        imageUrl: item.images[0]?.url ?? null,
        followers: item.followers?.total ?? 0,
        popularity: item.popularity ?? 0,
        genres: item.genres ?? [],
      }))
  }

  async getArtistAlbums(artistId: string): Promise<SpotifyAlbum[]> {
    const token = await this.getAccessToken()
    const items: SpotifyArtistAlbumsResponse['items'] = []
    let nextUrl: string | null = `${SPOTIFY_API_BASE}/artists/${artistId}/albums?${new URLSearchParams({
      include_groups: 'album,single',
      limit: '50',
    })}`

    while (nextUrl) {
      const response = await this.requestApi(nextUrl, token)

      if (!response.ok) {
        throw new Error(`Spotify artist albums request failed (${response.status})`)
      }

      const data = await response.json() as SpotifyArtistAlbumsResponse
      items.push(...data.items)
      nextUrl = data.next ?? null
    }

    const seen = new Set<string>()
    return items
      .filter(item => item.external_urls.spotify)
      .filter(item => !seen.has(item.id) && seen.add(item.id))
      .map(item => ({
        id: item.id,
        name: item.name,
        url: item.external_urls.spotify!,
        albumType: item.album_type,
        releaseDate: item.release_date ?? null,
        imageUrl: item.images[0]?.url ?? null,
        totalTracks: item.total_tracks,
      }))
  }

  async getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken()
    const response = await this.requestApi(`${SPOTIFY_API_BASE}/albums/${albumId}/tracks?limit=50`, token)

    if (!response.ok) {
      throw new Error(`Spotify album tracks request failed (${response.status})`)
    }

    const data = await response.json() as SpotifyAlbumTracksResponse
    return data.items
      .filter(item => item.external_urls.spotify)
      .map(item => ({
        id: item.id,
        name: item.name,
        url: item.external_urls.spotify!,
        trackNumber: item.track_number ?? null,
        discNumber: item.disc_number ?? null,
        durationMs: item.duration_ms ?? null,
        isrc: item.external_ids?.isrc ?? null,
      }))
  }
}

let service: SpotifyService | null = null

export function getSpotifyService() {
  if (!service) service = new SpotifyService()
  return service
}
