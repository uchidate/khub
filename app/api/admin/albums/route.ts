import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-ALBUMS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const albumSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['ALBUM', 'EP', 'SINGLE']),
  releaseDate: z.string().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  spotifyUrl: z.string().url().optional().nullable(),
  appleMusicUrl: z.string().url().optional().nullable(),
  youtubeUrl: z.string().url().optional().nullable(),
  artistId: z.string().min(1),
})

/**
 * GET /api/admin/albums
 * List albums with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { skip, take, search, orderBy } = buildQueryOptions(searchParams)

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          artist: {
            select: {
              id: true,
              nameRomanized: true,
            },
          },
        },
      }),
      prisma.album.count({ where }),
    ])

    const formattedAlbums = albums.map((album) => ({
      ...album,
      artistName: album.artist.nameRomanized,
    }))

    return paginatedResponse(
      formattedAlbums,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get albums error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/albums
 * Create a new album
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = albumSchema.parse(body)

    // Convert releaseDate string to Date if provided
    const data: Record<string, unknown> = { ...validated }
    if (validated.releaseDate) {
      data.releaseDate = new Date(validated.releaseDate)
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: validated.artistId },
    })

    if (!artist) {
      return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
    }

    const album = await prisma.album.create({
      data: data as Parameters<typeof prisma.album.create>[0]['data'],
      include: {
        artist: {
          select: {
            id: true,
            nameRomanized: true,
          },
        },
      },
    })

    return NextResponse.json(album, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Create album error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/albums?id=<albumId>
 * Update an album
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('id')

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = albumSchema.partial().parse(body)

    // Convert releaseDate string to Date if provided
    const data: Record<string, unknown> = { ...validated }
    if (validated.releaseDate) {
      data.releaseDate = new Date(validated.releaseDate)
    }

    // If artistId is being updated, verify the new artist exists
    if (validated.artistId) {
      const artist = await prisma.artist.findUnique({
        where: { id: validated.artistId },
      })

      if (!artist) {
        return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
      }
    }

    const album = await prisma.album.update({
      where: { id: albumId },
      data: data as Parameters<typeof prisma.album.update>[0]['data'],
      include: {
        artist: {
          select: {
            id: true,
            nameRomanized: true,
          },
        },
      },
    })

    return NextResponse.json(album)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Update album error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/albums
 * Delete albums
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.album.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} álbum(ns) deletado(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete albums error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
