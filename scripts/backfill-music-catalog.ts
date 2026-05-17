import 'dotenv/config'
import prisma from '../lib/prisma'
import {
  ExternalMusicEntityType,
  ExternalMusicMatchStatus,
  MusicCatalogArtistKind,
  MusicCreditRole,
  MusicReleaseType,
} from '@prisma/client'

const platforms = [
  { slug: 'spotify', name: 'Spotify' },
  { slug: 'apple_music', name: 'Apple Music' },
  { slug: 'youtube_music', name: 'YouTube Music' },
  { slug: 'deezer', name: 'Deezer' },
  { slug: 'musicbrainz', name: 'MusicBrainz' },
] as const

const legacyReleaseTypeMap: Record<string, MusicReleaseType> = {
  ALBUM: MusicReleaseType.ALBUM,
  EP: MusicReleaseType.EP,
  SINGLE: MusicReleaseType.SINGLE,
  MINI_ALBUM: MusicReleaseType.MINI_ALBUM,
  FULL_ALBUM: MusicReleaseType.FULL_ALBUM,
  OST: MusicReleaseType.OST,
  REPACKAGE: MusicReleaseType.REPACKAGE,
  COMPILATION: MusicReleaseType.COMPILATION,
}

async function seedPlatforms() {
  for (const platform of platforms) {
    await prisma.streamingPlatform.upsert({
      where: { slug: platform.slug },
      update: { name: platform.name },
      create: platform,
    })
  }
}

async function backfillArtists() {
  const [artists, groups] = await Promise.all([
    prisma.artist.findMany({ select: { id: true, nameRomanized: true } }),
    prisma.musicalGroup.findMany({ select: { id: true, name: true } }),
  ])

  for (const artist of artists) {
    await prisma.musicCatalogArtist.upsert({
      where: { artistId: artist.id },
      update: {
        kind: MusicCatalogArtistKind.PERSON,
        canonicalName: artist.nameRomanized,
      },
      create: {
        kind: MusicCatalogArtistKind.PERSON,
        canonicalName: artist.nameRomanized,
        artistId: artist.id,
      },
    })
  }

  for (const group of groups) {
    await prisma.musicCatalogArtist.upsert({
      where: { groupId: group.id },
      update: {
        kind: MusicCatalogArtistKind.GROUP,
        canonicalName: group.name,
      },
      create: {
        kind: MusicCatalogArtistKind.GROUP,
        canonicalName: group.name,
        groupId: group.id,
      },
    })
  }

  return { artists: artists.length, groups: groups.length }
}

async function backfillReleases() {
  const albums = await prisma.album.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      releaseDate: true,
      coverUrl: true,
      artistId: true,
      spotifyUrl: true,
      appleMusicUrl: true,
      youtubeUrl: true,
      mbid: true,
    },
  })

  const platformBySlug = new Map(
    (await prisma.streamingPlatform.findMany()).map(platform => [platform.slug, platform])
  )

  let releases = 0
  let links = 0

  for (const album of albums) {
    const release = await prisma.musicRelease.upsert({
      where: { legacyAlbumId: album.id },
      update: {
        title: album.title,
        releaseType: legacyReleaseTypeMap[album.type] ?? MusicReleaseType.ALBUM,
        releaseDate: album.releaseDate,
        coverUrl: album.coverUrl,
      },
      create: {
        title: album.title,
        releaseType: legacyReleaseTypeMap[album.type] ?? MusicReleaseType.ALBUM,
        releaseDate: album.releaseDate,
        coverUrl: album.coverUrl,
        legacyAlbumId: album.id,
      },
    })
    releases++

    const musicArtist = await prisma.musicCatalogArtist.findUnique({
      where: { artistId: album.artistId },
      select: { id: true },
    })

    if (musicArtist) {
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
    }

    const legacyLinks = [
      { slug: 'spotify', url: album.spotifyUrl },
      { slug: 'apple_music', url: album.appleMusicUrl },
      { slug: 'youtube_music', url: album.youtubeUrl },
      { slug: 'musicbrainz', url: album.mbid ? `https://musicbrainz.org/release-group/${album.mbid}` : null, externalId: album.mbid },
    ] as const

    for (const link of legacyLinks) {
      if (!link.url) continue
      const platform = platformBySlug.get(link.slug)
      if (!platform) continue

      await prisma.externalMusicEntity.upsert({
        where: {
          platformId_entityType_externalId: {
            platformId: platform.id,
            entityType: ExternalMusicEntityType.RELEASE,
            externalId: 'externalId' in link && link.externalId ? link.externalId : link.url,
          },
        },
        update: {
          url: link.url,
          releaseId: release.id,
        },
        create: {
          platformId: platform.id,
          entityType: ExternalMusicEntityType.RELEASE,
          externalId: 'externalId' in link && link.externalId ? link.externalId : link.url,
          url: link.url,
          releaseId: release.id,
          source: 'legacy_backfill',
          matchStatus: ExternalMusicMatchStatus.UNVERIFIED,
        },
      })
      links++
    }
  }

  return { releases, links }
}

async function main() {
  await seedPlatforms()
  const people = await backfillArtists()
  const releases = await backfillReleases()

  console.log(JSON.stringify({
    platforms: platforms.length,
    musicCatalogArtists: people,
    musicReleases: releases,
  }, null, 2))
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(process.exitCode ?? 0)
  })
