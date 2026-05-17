import {
  ExternalMusicEntityType,
  ExternalMusicMatchStatus,
  MusicCreditRole,
  MusicReleaseType,
} from '@prisma/client'
import prisma from '@/lib/prisma'
import { getSpotifyService, SpotifyAlbum } from '@/lib/services/spotify-service'

function mapReleaseType(album: SpotifyAlbum): MusicReleaseType {
  if (album.albumType === 'single') return MusicReleaseType.SINGLE
  if (album.albumType === 'album' && album.totalTracks <= 6) return MusicReleaseType.EP
  return MusicReleaseType.ALBUM
}

function parseSpotifyDate(value: string | null): Date | null {
  if (!value) return null
  const normalized = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function syncSpotifyCatalogForArtist(artistId: string) {
  return syncSpotifyCatalog({
    where: { artistId },
    missingLinkMessage: 'Artista ainda não tem perfil Spotify vinculado',
  })
}

export async function syncSpotifyCatalogForGroup(groupId: string) {
  return syncSpotifyCatalog({
    where: { groupId },
    missingLinkMessage: 'Grupo ainda não tem perfil Spotify vinculado',
  })
}

async function syncSpotifyCatalog({
  where,
  missingLinkMessage,
}: {
  where: { artistId: string } | { groupId: string }
  missingLinkMessage: string
}) {
  const musicArtist = await prisma.musicCatalogArtist.findUnique({
    where,
    select: {
      id: true,
      externalLinks: {
        where: {
          entityType: ExternalMusicEntityType.ARTIST,
          platform: { slug: 'spotify' },
        },
        select: { externalId: true },
        take: 1,
      },
    },
  })
  if (!musicArtist?.externalLinks[0]) {
    throw new Error(missingLinkMessage)
  }

  const platform = await prisma.streamingPlatform.findUniqueOrThrow({
    where: { slug: 'spotify' },
    select: { id: true },
  })
  const spotify = getSpotifyService()
  const albums = await spotify.getArtistAlbums(musicArtist.externalLinks[0].externalId)

  let releasesSynced = 0
  let tracksSynced = 0

  for (const album of albums) {
    const releaseLink = await prisma.externalMusicEntity.findUnique({
      where: {
        platformId_entityType_externalId: {
          platformId: platform.id,
          entityType: ExternalMusicEntityType.RELEASE,
          externalId: album.id,
        },
      },
      select: { releaseId: true },
    })

    const release = releaseLink?.releaseId
      ? await prisma.musicRelease.update({
          where: { id: releaseLink.releaseId },
          data: {
            title: album.name,
            releaseType: mapReleaseType(album),
            releaseDate: parseSpotifyDate(album.releaseDate),
            coverUrl: album.imageUrl,
          },
        })
      : await prisma.musicRelease.create({
          data: {
            title: album.name,
            releaseType: mapReleaseType(album),
            releaseDate: parseSpotifyDate(album.releaseDate),
            coverUrl: album.imageUrl,
          },
        })

    await prisma.musicReleaseCredit.upsert({
      where: {
        releaseId_musicCatalogArtistId_role: {
          releaseId: release.id,
          musicCatalogArtistId: musicArtist.id,
          role: MusicCreditRole.PRIMARY,
        },
      },
      update: {},
      create: {
        releaseId: release.id,
        musicCatalogArtistId: musicArtist.id,
        role: MusicCreditRole.PRIMARY,
      },
    })

    await prisma.externalMusicEntity.upsert({
      where: {
        platformId_entityType_externalId: {
          platformId: platform.id,
          entityType: ExternalMusicEntityType.RELEASE,
          externalId: album.id,
        },
      },
      update: {
        url: album.url,
        releaseId: release.id,
        matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED,
        source: 'spotify_api',
        matchedAt: new Date(),
      },
      create: {
        platformId: platform.id,
        entityType: ExternalMusicEntityType.RELEASE,
        externalId: album.id,
        url: album.url,
        releaseId: release.id,
        matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED,
        source: 'spotify_api',
        matchedAt: new Date(),
      },
    })

    const tracks = await spotify.getAlbumTracks(album.id)
    for (const track of tracks) {
      const trackLink = await prisma.externalMusicEntity.findUnique({
        where: {
          platformId_entityType_externalId: {
            platformId: platform.id,
            entityType: ExternalMusicEntityType.TRACK,
            externalId: track.id,
          },
        },
        select: { trackId: true },
      })
      const musicTrack = trackLink?.trackId
        ? await prisma.musicTrack.update({
            where: { id: trackLink.trackId },
            data: {
              title: track.name,
              trackNumber: track.trackNumber,
              discNumber: track.discNumber,
              durationMs: track.durationMs,
              isrc: track.isrc,
            },
          })
        : await prisma.musicTrack.create({
            data: {
              title: track.name,
              trackNumber: track.trackNumber,
              discNumber: track.discNumber,
              durationMs: track.durationMs,
              isrc: track.isrc,
              releaseId: release.id,
            },
          })

      await prisma.musicTrackCredit.upsert({
        where: {
          trackId_musicCatalogArtistId_role: {
            trackId: musicTrack.id,
            musicCatalogArtistId: musicArtist.id,
            role: MusicCreditRole.PRIMARY,
          },
        },
        update: {},
        create: {
          trackId: musicTrack.id,
          musicCatalogArtistId: musicArtist.id,
          role: MusicCreditRole.PRIMARY,
        },
      })
      await prisma.externalMusicEntity.upsert({
        where: {
          platformId_entityType_externalId: {
            platformId: platform.id,
            entityType: ExternalMusicEntityType.TRACK,
            externalId: track.id,
          },
        },
        update: {
          url: track.url,
          trackId: musicTrack.id,
          matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED,
          source: 'spotify_api',
          matchedAt: new Date(),
        },
        create: {
          platformId: platform.id,
          entityType: ExternalMusicEntityType.TRACK,
          externalId: track.id,
          url: track.url,
          trackId: musicTrack.id,
          matchStatus: ExternalMusicMatchStatus.AUTO_MATCHED,
          source: 'spotify_api',
          matchedAt: new Date(),
        },
      })
      tracksSynced++
    }
    releasesSynced++
  }

  return { releasesSynced, tracksSynced }
}
