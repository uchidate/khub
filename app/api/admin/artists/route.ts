import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const artistSchema = z.object({
  nameRomanized: z.string().min(1),
  nameHangul: z.string().optional(),
  nameKanji: z.string().optional(),
  nameHiragana: z.string().optional(),
  stageName: z.string().optional(),
  bio: z.string().optional(),
  birthdate: z.string().optional(), // ISO date string
  deathdate: z.string().optional(), // ISO date string
  country: z.string().optional(),
  imageUrl: z.string().url().optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'other']).optional(),
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
            { stageName: { contains: search, mode: 'insensitive' as const } },
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
    console.error('Get artists error:', error)
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
    if (validated.birthdate) {
      data.birthdate = new Date(validated.birthdate)
    }
    if (validated.deathdate) {
      data.deathdate = new Date(validated.deathdate)
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

    console.error('Create artist error:', error)
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
    if (validated.birthdate) {
      data.birthdate = new Date(validated.birthdate)
    }
    if (validated.deathdate) {
      data.deathdate = new Date(validated.deathdate)
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

    console.error('Update artist error:', error)
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

    console.error('Delete artists error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
