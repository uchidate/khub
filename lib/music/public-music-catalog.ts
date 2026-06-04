import { ExternalMusicEntityType } from '@prisma/client'
import prisma from '@/lib/prisma'

export type PublicMusicPlatformLink = {
  platform: string
  platformName: string
  url: string
}

export type PublicMusicTrack = {
  id: string
  title: string
  trackNumber: number | null
  durationMs: number | null
  links: PublicMusicPlatformLink[]
}

export type PublicMusicRelease = {
  id: string
  title: string
  type: string
  releaseDate: Date | null
  coverUrl: string | null
  links: PublicMusicPlatformLink[]
  tracks: PublicMusicTrack[]
}

export type PublicMusicCatalog = {
  profileLinks: PublicMusicPlatformLink[]
  releases: PublicMusicRelease[]
}

type CatalogOwner =
  | { artistId: string; groupId?: never }
  | { groupId: string; artistId?: never }

function normalizeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const value = url.trim()
  if (!value) return null

  const spotifyUri = value.match(/^spotify[:/]([a-z]+)[:/]([A-Za-z0-9]+)$/i)
  if (spotifyUri) return `https://open.spotify.com/${spotifyUri[1].toLowerCase()}/${spotifyUri[2]}`

  if (/^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(value)) return `https://${value}`
  if (/^open\.spotify\.com\//i.test(value)) return `https://${value}`
  return value
}

function mapLinks(
  links: Array<{ url: string; platform: { slug: string; name: string } }>
): PublicMusicPlatformLink[] {
  const seen = new Set<string>()
  return links.flatMap(link => {
    const url = normalizeExternalUrl(link.url)
    if (!url) return []
    const key = `${link.platform.slug}:${url}`
    if (seen.has(key)) return []
    seen.add(key)
    return [{ platform: link.platform.slug, platformName: link.platform.name, url }]
  })
}

export function getPrimaryMusicLink(
  links: PublicMusicPlatformLink[],
  preferredPlatforms = ['spotify', 'apple-music', 'apple_music', 'youtube-music', 'youtube']
): PublicMusicPlatformLink | null {
  for (const platform of preferredPlatforms) {
    const match = links.find(link => link.platform === platform)
    if (match) return match
  }
  return links[0] ?? null
}

export function toSpotifyEmbedUrl(url: string | null | undefined): string | null {
  const normalized = normalizeExternalUrl(url)
  if (!normalized) return null
  try {
    const parsed = new URL(normalized)
    if (parsed.hostname !== 'open.spotify.com') return null
    const embedPath = parsed.pathname.startsWith('/embed') ? parsed.pathname : `/embed${parsed.pathname}`
    return `https://open.spotify.com${embedPath}`
  } catch {
    return null
  }
}

export async function getPublicMusicCatalog(owner: CatalogOwner, take = 20): Promise<PublicMusicCatalog> {
  const musicCatalogArtistWhere = 'artistId' in owner
    ? { artistId: owner.artistId }
    : { groupId: owner.groupId }

  const [profileLinks, releases] = await Promise.all([
    prisma.externalMusicEntity.findMany({
      where: {
        entityType: ExternalMusicEntityType.ARTIST,
        musicCatalogArtist: musicCatalogArtistWhere,
      },
      select: {
        url: true,
        platform: { select: { slug: true, name: true } },
      },
      orderBy: { platform: { name: 'asc' } },
    }).catch(() => []),
    prisma.musicRelease.findMany({
      where: {
        credits: {
          some: { musicCatalogArtist: musicCatalogArtistWhere },
        },
        externalLinks: {
          some: { entityType: ExternalMusicEntityType.RELEASE },
        },
      },
      select: {
        id: true,
        title: true,
        releaseType: true,
        releaseDate: true,
        coverUrl: true,
        externalLinks: {
          where: { entityType: ExternalMusicEntityType.RELEASE },
          select: {
            url: true,
            platform: { select: { slug: true, name: true } },
          },
        },
        tracks: {
          orderBy: [{ discNumber: 'asc' }, { trackNumber: 'asc' }],
          select: {
            id: true,
            title: true,
            trackNumber: true,
            durationMs: true,
            externalLinks: {
              where: { entityType: ExternalMusicEntityType.TRACK },
              select: {
                url: true,
                platform: { select: { slug: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { releaseDate: 'desc' },
      take,
    }).catch(() => []),
  ])

  return {
    profileLinks: mapLinks(profileLinks),
    releases: releases.map(release => ({
      id: release.id,
      title: release.title,
      type: release.releaseType,
      releaseDate: release.releaseDate,
      coverUrl: release.coverUrl,
      links: mapLinks(release.externalLinks),
      tracks: release.tracks.map(track => ({
        id: track.id,
        title: track.title,
        trackNumber: track.trackNumber,
        durationMs: track.durationMs,
        links: mapLinks(track.externalLinks),
      })),
    })),
  }
}
