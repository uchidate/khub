import { NextRequest, NextResponse } from 'next/server'
import { ExternalMusicEntityType, Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)))
  const search = searchParams.get('search')?.trim() ?? ''
  const filter = searchParams.get('filter') ?? 'all'

  const baseWhere: Prisma.ArtistWhereInput = { flaggedAsNonKorean: false }
  const spotifyLinked: Prisma.ArtistWhereInput = {
    musicCatalogArtist: {
      externalLinks: {
        some: {
          entityType: ExternalMusicEntityType.ARTIST,
          platform: { slug: 'spotify' },
        },
      },
    },
  }

  const where: Prisma.ArtistWhereInput = {
    AND: [
      baseWhere,
      ...(search ? [{
        OR: [
          { nameRomanized: { contains: search, mode: 'insensitive' as const } },
          { nameHangul: { contains: search, mode: 'insensitive' as const } },
        ],
      }] : []),
      ...(filter === 'linked'
        ? [spotifyLinked]
        : filter === 'missing'
          ? [{ NOT: spotifyLinked }]
          : []),
    ],
  }

  const [artists, total, totalArtists, linkedCount] = await Promise.all([
    prisma.artist.findMany({
      where,
      orderBy: [{ trendingScore: 'desc' }, { nameRomanized: 'asc' }],
      select: {
        id: true,
        nameRomanized: true,
        nameHangul: true,
        stageNames: true,
        primaryImageUrl: true,
        musicCatalogArtist: {
          select: {
            externalLinks: {
              where: {
                entityType: ExternalMusicEntityType.ARTIST,
                platform: { slug: 'spotify' },
              },
              select: {
                externalId: true,
                url: true,
                matchStatus: true,
                matchedAt: true,
              },
              take: 1,
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.artist.count({ where }),
    prisma.artist.count({ where: baseWhere }),
    prisma.artist.count({ where: { AND: [baseWhere, spotifyLinked] } }),
  ])

  return NextResponse.json({
    artists: artists.map(artist => ({
      ...artist,
      spotifyLink: artist.musicCatalogArtist?.externalLinks[0] ?? null,
      musicCatalogArtist: undefined,
    })),
    total,
    page,
    pages: Math.ceil(total / limit),
    stats: {
      total: totalArtists,
      linked: linkedCount,
      missing: totalArtists - linkedCount,
    },
  })
}
