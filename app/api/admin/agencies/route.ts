import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const agencySchema = z.object({
  name: z.string().min(1),
  website: z.string().url().optional().nullable(),
  socials: z.record(z.string(), z.unknown()).optional().nullable(),
})

/**
 * GET /api/admin/agencies
 * List agencies with pagination, search, and sorting
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
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [agencies, total] = await Promise.all([
      prisma.agency.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              artists: true,
            },
          },
        },
      }),
      prisma.agency.count({ where }),
    ])

    const formattedAgencies = agencies.map((agency) => ({
      ...agency,
      artistsCount: agency._count.artists,
    }))

    return paginatedResponse(
      formattedAgencies,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    console.error('Get agencies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/agencies
 * Create a new agency
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = agencySchema.parse(body)

    // Check if agency name already exists
    const existing = await prisma.agency.findUnique({
      where: { name: validated.name },
    })

    if (existing) {
      return NextResponse.json({ error: 'Agência já cadastrada' }, { status: 400 })
    }

    const agency = await prisma.agency.create({
      data: validated as Parameters<typeof prisma.agency.create>[0]['data'],
    })

    return NextResponse.json(agency, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Create agency error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/agencies?id=<agencyId>
 * Update an agency
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const agencyId = searchParams.get('id')

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = agencySchema.partial().parse(body)

    // Check if agency exists
    const existing = await prisma.agency.findUnique({
      where: { id: agencyId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agência não encontrada' }, { status: 404 })
    }

    // If name is being updated, check for duplicates
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.agency.findUnique({
        where: { name: validated.name },
      })

      if (nameExists) {
        return NextResponse.json({ error: 'Nome de agência já cadastrado' }, { status: 400 })
      }
    }

    const agency = await prisma.agency.update({
      where: { id: agencyId },
      data: validated as Parameters<typeof prisma.agency.update>[0]['data'],
    })

    return NextResponse.json(agency)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Update agency error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/agencies
 * Delete agencies
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    // Check if any agency has artists
    const agenciesWithArtists = await prisma.agency.findMany({
      where: { id: { in: ids } },
      include: {
        _count: {
          select: { artists: true },
        },
      },
    })

    const hasArtists = agenciesWithArtists.some((agency) => agency._count.artists > 0)

    if (hasArtists) {
      return NextResponse.json(
        { error: 'Não é possível deletar agências que possuem artistas vinculados' },
        { status: 400 }
      )
    }

    const result = await prisma.agency.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} agência(s) deletada(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    console.error('Delete agencies error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
