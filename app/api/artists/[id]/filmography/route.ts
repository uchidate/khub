import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTISTS')

/**
 * GET /api/artists/[id]/filmography
 * Get filmography for an artist
 *
 * Query params:
 * - sortBy?: 'year' | 'title' | 'type' (default: 'year')
 * - order?: 'asc' | 'desc' (default: 'desc')
 *
 * Public endpoint
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const sortBy = searchParams.get('sortBy') || 'year'
    const order = searchParams.get('order') || 'desc'

    // Get artist with filmography
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        productions: {
          include: {
            production: true,
          },
        },
      },
    })

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Transform and sort filmography
    let filmography = artist.productions.map(ap => ({
      productionId: ap.production.id,
      title: ap.production.titlePt,
      titleKr: ap.production.titleKr,
      type: ap.production.type,
      year: ap.production.year,
      role: ap.role,
      synopsis: ap.production.synopsis,
      imageUrl: ap.production.imageUrl,
      streamingPlatforms: ap.production.streamingPlatforms,
      tmdbId: ap.production.tmdbId,
      voteAverage: ap.production.voteAverage,
      releaseDate: ap.production.releaseDate,
    }))

    // Sort
    filmography.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'year':
          comparison = (a.year || 0) - (b.year || 0)
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }

      return order === 'desc' ? -comparison : comparison
    })

    return NextResponse.json({
      success: true,
      artist: {
        id: artist.id,
        name: artist.nameRomanized,
        nameKr: artist.nameHangul,
        tmdbId: artist.tmdbId,
        tmdbSyncStatus: artist.tmdbSyncStatus,
        tmdbLastSync: artist.tmdbLastSync,
      },
      filmography,
      count: filmography.length,
    })

  } catch (error) {
    log.error('Get filmography error', { error: getErrorMessage(error) })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
