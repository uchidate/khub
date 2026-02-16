import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-ARTISTS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const artistSchema = z.object({
  nameRomanized: z.string().min(1),
  nameHangul: z.string().optional(),
  birthDate: z.string().optional(),              // ISO date string, camelCase
  birthName: z.string().optional(),
  stageNames: z.array(z.string()).optional(),    // array de nomes artísticos
  roles: z.array(z.string()).optional(),         // ex: ['IDOL', 'ACTOR']
  height: z.string().optional(),
  bloodType: z.string().optional(),
  zodiacSign: z.string().optional(),
  bio: z.string().optional(),
  primaryImageUrl: z.string().url().optional(),  // era: imageUrl
  socialLinks: z.record(z.string(), z.string()).optional(),  // JSON: { instagram: "...", etc }
  tmdbId: z.string().optional(),
  agencyId: z.string().optional(),
})

/**
 * GET /api/admin/artists
 * List artists with pagination, search, and sorting
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
            { nameRomanized: { contains: search, mode: 'insensitive' as const } },
            { nameHangul: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          agency: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              productions: true,
              albums: true,
            },
          },
        },
      }),
      prisma.artist.count({ where }),
    ])

    const formattedArtists = artists.map((artist: {
      _count: { productions: number; albums: number }
      agency: { id: string; name: string } | null
      [key: string]: unknown
    }) => ({
      ...artist,
      productionsCount: artist._count.productions,
      albumsCount: artist._count.albums,
      agencyName: artist.agency?.name,
    }))

    return paginatedResponse(
      formattedArtists,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get artists error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/artists
 * Create a new artist
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = artistSchema.parse(body)

    // Convert date strings to Date objects
    const data: Record<string, unknown> = { ...validated }
    if (validated.birthDate) {
      data.birthDate = new Date(validated.birthDate)
    }

    const artist = await prisma.artist.create({
      data: data as any,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(artist, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Create artist error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/artists?id=<artistId>
 * Update an artist
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('id')

    if (!artistId) {
      return NextResponse.json({ error: 'Artist ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = artistSchema.partial().parse(body)

    // Convert date strings to Date objects
    const data: Record<string, unknown> = { ...validated }
    if (validated.birthDate) {
      data.birthDate = new Date(validated.birthDate)
    }

    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: data as any,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(artist)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Update artist error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/artists
 * Delete artists
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.artist.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} artista(s) deletado(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete artists error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
