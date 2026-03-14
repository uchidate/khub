import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { revalidatePath } from 'next/cache'
import { getArtistVisibilityService } from '@/lib/services/artist-visibility-service'

const log = createLogger('ADMIN-PRODUCTIONS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const productionSchema = z.object({
  titlePt: z.string().optional().nullable(),
  titleKr: z.string().min(1),
  type: z.string().min(1),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  tagline: z.string().optional().nullable(),
  synopsis: z.string().optional().nullable(),
  synopsisSource: z.enum(['tmdb_pt', 'tmdb_en', 'ai', 'manual']).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  backdropUrl: z.string().url().optional().nullable(),
  streamingPlatforms: z.array(z.string()).optional().default([]),
  sourceUrls: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  trailerUrl: z.string().url().optional().nullable(),
  ageRating: z.enum(['L', '10', '12', '14', '16', '18']).optional().nullable(),
  runtime: z.number().int().optional().nullable(),
  episodeCount: z.number().int().optional().nullable(),
  seasonCount: z.number().int().optional().nullable(),
  episodeRuntime: z.number().int().optional().nullable(),
  voteAverage: z.number().optional().nullable(),
  productionStatus: z.string().optional().nullable(),
  network: z.string().optional().nullable(),
  isHidden: z.boolean().optional(),
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

    const filter = searchParams.get('filter')
    // Supported filters:
    //   no_cast           — all without any artists
    //   no_cast_pending   — no artists, has tmdbId, never attempted
    //   no_cast_attempted — no artists, has tmdbId, already tried (castSyncAt set)
    //   no_cast_no_tmdb   — no artists, no tmdbId
    //   no_rating           — all without age rating
    //   no_rating_pending   — no rating, has tmdbId, never attempted
    //   no_rating_attempted — no rating, has tmdbId, already tried (ageRatingSyncAt set)
    //   no_rating_no_tmdb   — no rating, no tmdbId
    //   hidden_from_public  — isHidden=false mas excluídas da filmografia pública
    //                         (ageRating null/18 ou flaggedAsNonKorean=true)

    const filterWhere =
      filter === 'no_cast'           ? { artists: { none: {} } }
      : filter === 'no_cast_pending'   ? { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: null }
      : filter === 'no_cast_attempted' ? { artists: { none: {} }, tmdbId: { not: null }, castSyncAt: { not: null } }
      : filter === 'no_cast_no_tmdb'   ? { artists: { none: {} }, tmdbId: null }
      : filter === 'no_rating'           ? { ageRating: null }
      : filter === 'no_rating_pending'   ? { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: null }
      : filter === 'no_rating_attempted' ? { ageRating: null, tmdbId: { not: null }, ageRatingSyncAt: { not: null } }
      : filter === 'no_rating_no_tmdb'   ? { ageRating: null, tmdbId: null }
      : filter === 'no_tmdb'   ? { tmdbId: null }
      : filter === 'has_tmdb'  ? { tmdbId: { not: null as null } }
      : filter === 'hidden_from_public' ? {
          isHidden: false,
          OR: [
            { ageRating: null },
            { ageRating: '18' },
            { flaggedAsNonKorean: true },
          ],
        }
      : {}

    const where = search
      ? {
          AND: [
            filterWhere,
            {
              OR: [
                { titlePt: { contains: search, mode: 'insensitive' as const } },
                { titleKr: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          ],
        }
      : filterWhere

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

    // Derive titlePt from titleKr when not provided
    const titlePt = (validated.titlePt?.trim() || validated.titleKr).trim()

    // Check if titlePt already exists
    const existing = await prisma.production.findFirst({
      where: { titlePt },
    })

    if (existing) {
      return NextResponse.json({ error: 'Título já cadastrado' }, { status: 400 })
    }

    const production = await prisma.production.create({
      data: { ...validated, titlePt },
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

    // Derive titlePt from titleKr when submitted empty
    const resolvedTitleKr = validated.titleKr ?? existing.titleKr
    const resolvedTitlePt = (validated.titlePt?.trim() || resolvedTitleKr || existing.titlePt).trim()

    // If titlePt changed, check for duplicates (excluding current record)
    if (resolvedTitlePt !== existing.titlePt) {
      const titleExists = await prisma.production.findFirst({
        where: { titlePt: resolvedTitlePt, NOT: { id: productionId } },
      })
      if (titleExists) {
        return NextResponse.json({ error: 'Título já cadastrado' }, { status: 400 })
      }
    }

    // If synopsis is being manually edited, mark source as 'manual'
    const resolvedSynopsisSource = validated.synopsis !== undefined && !validated.synopsisSource
      ? 'manual'
      : validated.synopsisSource

    const production = await prisma.production.update({
      where: { id: productionId },
      data: { ...validated, titlePt: resolvedTitlePt, synopsisSource: resolvedSynopsisSource },
    })

    // Se visibilidade da produção mudou, reavaliar artistas vinculados
    if (validated.isHidden !== undefined && validated.isHidden !== existing.isHidden) {
      const linkedArtists = await prisma.artistProduction.findMany({
        where: { productionId },
        select: { artistId: true },
      })
      if (linkedArtists.length > 0) {
        void getArtistVisibilityService()
          .evaluateMany(linkedArtists.map(a => a.artistId))
          .catch(() => {})
      }
    }

    // Invalidar ISR da página pública para refletir edições imediatamente
    revalidatePath(`/productions/${productionId}`)

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
