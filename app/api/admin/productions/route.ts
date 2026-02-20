import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-PRODUCTIONS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const productionSchema = z.object({
  titlePt: z.string().min(1),
  titleKr: z.string().optional().nullable(),
  type: z.string().min(1),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  synopsis: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  streamingPlatforms: z.array(z.string()).optional().default([]),
  sourceUrls: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  trailerUrl: z.string().url().optional().nullable(),
  ageRating: z.enum(['L', '10', '12', '14', '16', '18']).optional().nullable(),
})

/**
 * GET /api/admin/productions
 * List productions with pagination, search, and sorting
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
            { titlePt: { contains: search, mode: 'insensitive' as const } },
            { titleKr: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
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
      prisma.production.count({ where }),
    ])

    const formattedProductions = productions.map((production) => ({
      ...production,
      artistsCount: production._count.artists,
    }))

    return paginatedResponse(
      formattedProductions,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get productions error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/productions
 * Create a new production
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = productionSchema.parse(body)

    // Check if titlePt already exists
    const existing = await prisma.production.findUnique({
      where: { titlePt: validated.titlePt },
    })

    if (existing) {
      return NextResponse.json({ error: 'Título já cadastrado' }, { status: 400 })
    }

    const production = await prisma.production.create({
      data: validated,
    })

    return NextResponse.json(production, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Create production error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/productions?id=<productionId>
 * Update a production
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const productionId = searchParams.get('id')

    if (!productionId) {
      return NextResponse.json({ error: 'Production ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = productionSchema.partial().parse(body)

    // Check if production exists
    const existing = await prisma.production.findUnique({
      where: { id: productionId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Produção não encontrada' }, { status: 404 })
    }

    // If titlePt is being updated, check for duplicates
    if (validated.titlePt && validated.titlePt !== existing.titlePt) {
      const titleExists = await prisma.production.findUnique({
        where: { titlePt: validated.titlePt },
      })

      if (titleExists) {
        return NextResponse.json({ error: 'Título já cadastrado' }, { status: 400 })
      }
    }

    const production = await prisma.production.update({
      where: { id: productionId },
      data: validated,
    })

    return NextResponse.json(production)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Update production error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/productions
 * Delete productions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.production.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} produção(ões) deletada(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete productions error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
