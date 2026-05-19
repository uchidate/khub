/**
 * Sync Spotify discography for all groups.
 * Strategy: fetch album list → batch-fetch album details (20/req) → upsert releases + tracks.
 * Skips tracks on first run if --releases-only flag passed.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { ExternalMusicMatchStatus, MusicCreditRole, MusicReleaseType } from '@prisma/client'

const pool = new Pool({ connectionString: 'postgresql://hallyuhub:hallyuhub@127.0.0.1:5433/hallyuhub_production' })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) as any })
const SPOTIFY_PLATFORM_ID = 'cmpa4aib0000201pbcn3ep1j1'
const RELEASES_ONLY = process.argv.includes('--releases-only')
const CONCURRENCY = 5 // groups in parallel

let spotifyToken = ''
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (spotifyToken && Date.now() < tokenExpiry - 30000) return spotifyToken
  const creds = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const d = await res.json() as any
  spotifyToken = d.access_token
  tokenExpiry = Date.now() + d.expires_in * 1000
  return spotifyToken
}

async function spotifyFetch(url: string, retries = 6): Promise<any> {
  const token = await getToken()
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (res.status === 429) {
      const wait = (parseInt(res.headers.get('retry-after') || '3') + 1) * 1000
      await new Promise(r => setTimeout(r, wait))
      continue
    }
    if (!res.ok) throw new Error(`Spotify ${res.status}`)
    return res.json()
  }
  throw new Error('Max retries exceeded')
}

// Get all album IDs for an artist (just IDs, fast pagination)
async function getAlbumIds(artistId: string): Promise<string[]> {
  const ids: string[] = []
  let url: string | null = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`
  while (url) {
    const d = await spotifyFetch(url)
    ids.push(...d.items.map((i: any) => i.id))
    url = d.next ?? null
  }
  return [...new Set(ids)]
}

// Batch fetch album details (20 per request)
async function getAlbumsBatch(ids: string[]): Promise<any[]> {
  const results: any[] = []
  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20)
    const d = await spotifyFetch(`https://api.spotify.com/v1/albums?ids=${chunk.join(',')}`)
    results.push(...d.albums.filter(Boolean))
  }
  return results
}

function mapReleaseType(album: any): MusicReleaseType {
  if (album.album_type === 'single') return MusicReleaseType.SINGLE
  if (album.album_type === 'album' && album.total_tracks <= 6) return MusicReleaseType.EP
  return MusicReleaseType.ALBUM
}

function parseDate(s: string | null): Date | null {
  if (!s) return null
  const n = s.length === 4 ? `${s}-01-01` : s.length === 7 ? `${s}-01` : s
  const d = new Date(n)
  return isNaN(d.getTime()) ? null : d
}

async function syncGroup(groupId: string, name: string): Promise<{ releases: number; tracks: number }> {
  const catalog = await prisma.musicCatalogArtist.findUnique({
    where: { groupId },
    select: {
      id: true,
      externalLinks: {
        where: { entityType: 'ARTIST', platformId: SPOTIFY_PLATFORM_ID },
        select: { externalId: true }, take: 1
      }
    }
  })
  if (!catalog?.externalLinks[0]) throw new Error('Sem Spotify ID')

  const artistId = catalog.externalLinks[0].externalId
  const albumIds = await getAlbumIds(artistId)
  if (!albumIds.length) return { releases: 0, tracks: 0 }

  const albums = await getAlbumsBatch(albumIds)
  let releases = 0, tracks = 0

  for (const album of albums) {
    const releaseData = {
      title: album.name,
      releaseType: mapReleaseType(album),
      releaseDate: parseDate(album.release_date),
      coverUrl: album.images?.[0]?.url ?? null,
    }

    const existingLink = await prisma.externalMusicEntity.findUnique({
      where: { platformId_entityType_externalId: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'RELEASE', externalId: album.id } },
      select: { releaseId: true }
    })

    const release = existingLink?.releaseId
      ? await prisma.musicRelease.update({ where: { id: existingLink.releaseId }, data: releaseData })
      : await prisma.musicRelease.create({ data: releaseData })

    await prisma.musicReleaseCredit.upsert({
      where: { releaseId_musicCatalogArtistId_role: { releaseId: release.id, musicCatalogArtistId: catalog.id, role: MusicCreditRole.PRIMARY } },
      update: {},
      create: { releaseId: release.id, musicCatalogArtistId: catalog.id, role: MusicCreditRole.PRIMARY }
    })

    await prisma.externalMusicEntity.upsert({
      where: { platformId_entityType_externalId: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'RELEASE', externalId: album.id } },
      update: { url: album.external_urls.spotify, releaseId: release.id, matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED, matchedAt: new Date() },
      create: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'RELEASE', externalId: album.id, url: album.external_urls.spotify, releaseId: release.id, matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED, source: 'spotify_api', matchedAt: new Date() }
    })

    releases++

    if (!RELEASES_ONLY) {
      // Tracks already embedded in album detail response
      for (const track of (album.tracks?.items ?? [])) {
        const trackData = {
          title: track.name,
          trackNumber: track.track_number,
          discNumber: track.disc_number,
          durationMs: track.duration_ms,
          isrc: track.external_ids?.isrc ?? null,
        }
        const trackLink = await prisma.externalMusicEntity.findUnique({
          where: { platformId_entityType_externalId: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'TRACK', externalId: track.id } },
          select: { trackId: true }
        })
        const musicTrack = trackLink?.trackId
          ? await prisma.musicTrack.update({ where: { id: trackLink.trackId }, data: trackData })
          : await prisma.musicTrack.create({ data: { ...trackData, releaseId: release.id } })

        await prisma.musicTrackCredit.upsert({
          where: { trackId_musicCatalogArtistId_role: { trackId: musicTrack.id, musicCatalogArtistId: catalog.id, role: MusicCreditRole.PRIMARY } },
          update: {},
          create: { trackId: musicTrack.id, musicCatalogArtistId: catalog.id, role: MusicCreditRole.PRIMARY }
        })
        await prisma.externalMusicEntity.upsert({
          where: { platformId_entityType_externalId: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'TRACK', externalId: track.id } },
          update: { url: track.external_urls?.spotify, trackId: musicTrack.id, matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED, matchedAt: new Date() },
          create: { platformId: SPOTIFY_PLATFORM_ID, entityType: 'TRACK', externalId: track.id, url: track.external_urls?.spotify, trackId: musicTrack.id, matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED, source: 'spotify_api', matchedAt: new Date() }
        })
        tracks++
      }
    }
  }
  return { releases, tracks }
}

async function runBatch(groups: { id: string; name: string }[], concurrency: number) {
  let ok = 0, fail = 0, totalReleases = 0, totalTracks = 0
  const queue = [...groups]

  async function worker() {
    while (queue.length) {
      const g = queue.shift()!
      process.stdout.write(`${g.name}... `)
      try {
        const r = await syncGroup(g.id, g.name)
        console.log(`✅ ${r.releases}r ${r.tracks}t`)
        ok++; totalReleases += r.releases; totalTracks += r.tracks
      } catch (e: any) {
        console.log(`❌ ${e.message}`)
        fail++
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return { ok, fail, totalReleases, totalTracks }
}

async function main() {
  const groups = await prisma.musicalGroup.findMany({
    where: { isHidden: false, musicCatalogArtist: { isNot: null } },
    select: { id: true, name: true },
    orderBy: { trendingScore: 'desc' }
  })

  const mode = RELEASES_ONLY ? '(releases only, sem tracks)' : '(releases + tracks)'
  console.log(`🎵 ${groups.length} grupos | concorrência: ${CONCURRENCY} | ${mode}\n`)
  const start = Date.now()

  const { ok, fail, totalReleases, totalTracks } = await runBatch(groups, CONCURRENCY)

  const elapsed = Math.round((Date.now() - start) / 1000)
  console.log(`\n✅ ${ok} grupos | 📀 ${totalReleases} releases | 🎵 ${totalTracks} tracks | ❌ ${fail} falhou | ⏱ ${elapsed}s`)
}

main().catch(console.error).finally(() => pool.end())
