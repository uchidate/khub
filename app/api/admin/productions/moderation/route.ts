import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTION_MODERATION')

export const dynamic = 'force-dynamic'

function buildWhere(filter: string, search?: string) {
  const titleFilter = search
    ? {
        OR: [
          { titlePt: { contains: search, mode: 'insensitive' as const } },
          { titleKr: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  switch (filter) {
    case 'suspicious':
      return {
        AND: [
          { flaggedAsNonKorean: false },
          { OR: [{ titleKr: null }, { tmdbId: null }] },
          ...(search ? [titleFilter] : []),
        ],
      }
    case 'recent': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return {
        createdAt: { gte: sevenDaysAgo },
        flaggedAsNonKorean: false,
        ...titleFilter,
      }
    }
    case 'flagged':
      return { flaggedAsNonKorean: true, ...titleFilter }
    case 'all':
    default:
      return { flaggedAsNonKorean: false, ...titleFilter }
  }
}

function calcSuspicion(production: {
  titlePt: string | null
  titleKr: string | null
  tmdbId: string | null
  streamingPlatforms: string[]
  _count: { artists: number }
}) {
  let suspicionScore = 0
  const reasons: string[] = []

  if (!production.titleKr) {
    suspicionScore += 3
    reasons.push('Sem título em coreano')
  }
  if (!production.tmdbId) {
    suspicionScore += 2
    reasons.push('Sem TMDB ID')
  }
  if (production.titlePt) {
    const hasCoreano = /[\uAC00-\uD7AF]/.test(production.titlePt)
    const hasCommonKoreanWords = /(king|queen|princess|prince|doctor|mr\.|mrs\.|love|heart|secret|moon|sun|sky|flower|spring|summer|autumn|winter|school|hospital|palace)/i.test(production.titlePt)
    if (!hasCoreano && !hasCommonKoreanWords) {
      suspicionScore += 2
      reasons.push('Título não parece coreano')
    }
  }
  if (production._count.artists === 0) {
    suspicionScore += 3
    reasons.push('Sem artistas vinculados')
  }
  if (production.streamingPlatforms.length === 0) {
    suspicionScore += 1
    reasons.push('Sem plataformas de streaming')
  }

  return { suspicionScore, suspicionReasons: reasons }
}

/**
 * GET /api/admin/productions/moderation
 * - ?stats=1 → contagens por categoria
 * - ?filter=suspicious|recent|flagged|all
 * - ?search=texto
 * - ?page=1&limit=20
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const searchParams = request.nextUrl.searchParams

  // Stats endpoint
  if (searchParams.get('stats') === '1') {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [suspicious, recent, flagged, all] = await Promise.all([
      prisma.production.count({
        where: {
          flaggedAsNonKorean: false,
          OR: [{ titleKr: null }, { tmdbId: null }],
        },
      }),
      prisma.production.count({
        where: { createdAt: { gte: sevenDaysAgo }, flaggedAsNonKorean: false },
      }),
      prisma.production.count({ where: { flaggedAsNonKorean: true } }),
      prisma.production.count({ where: { flaggedAsNonKorean: false } }),
    ])
    return NextResponse.json({ suspicious, recent, flagged, all })
  }

  const filter = searchParams.get('filter') || 'suspicious'
  const search = searchParams.get('search')?.trim() || undefined
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit

  try {
    const where = buildWhere(filter, search)

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where,
        select: {
          id: true,
          titlePt: true,
          titleKr: true,
          type: true,
          year: true,
          synopsis: true,
          imageUrl: true,
          tmdbId: true,
          tmdbType: true,
          streamingPlatforms: true,
          createdAt: true,
          flaggedAsNonKorean: true,
          flaggedAt: true,
          _count: { select: { artists: true, userFavorites: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.production.count({ where }),
    ])

    const productionsWithScore = productions.map(p => ({
      ...p,
      ...calcSuspicion(p),
    }))

    if (filter === 'suspicious') {
      productionsWithScore.sort((a, b) => b.suspicionScore - a.suspicionScore)
    }

    return NextResponse.json({
      productions: productionsWithScore,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      filter,
    })
  } catch (err) {
    log.error('Failed to fetch productions for moderation', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Failed to fetch productions' }, { status: 500 })
  }
}

const flagSchema = z.object({
  productionId: z.string().optional(),
  ids: z.array(z.string()).optional(),
  flaggedAsNonKorean: z.boolean(),
})

/**
 * PUT /api/admin/productions/moderation
 * Marcar/desmarcar — single (productionId) ou bulk (ids[])
 */
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const parsed = flagSchema.parse(body)

    const ids = parsed.ids ?? (parsed.productionId ? [parsed.productionId] : [])
    if (ids.length === 0) {
      return NextResponse.json({ error: 'productionId or ids[] required' }, { status: 400 })
    }

    await prisma.production.updateMany({
      where: { id: { in: ids } },
      data: {
        flaggedAsNonKorean: parsed.flaggedAsNonKorean,
        flaggedAt: parsed.flaggedAsNonKorean ? new Date() : null,
      },
    })

    log.info(`${ids.length} production(s) ${parsed.flaggedAsNonKorean ? 'flagged' : 'unflagged'}`, { ids })

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    log.error('Failed to update production flag', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Failed to update production' }, { status: 500 })
  }
}

const deleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

/**
 * DELETE /api/admin/productions/moderation
 * Remover permanentemente — single (?productionId=) ou bulk (body.ids[])
 */
export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Support both query param (single) and body (bulk)
    const productionIdParam = request.nextUrl.searchParams.get('productionId')
    let ids: string[]

    if (productionIdParam) {
      ids = [productionIdParam]
    } else {
      const body = await request.json()
      ids = deleteSchema.parse(body).ids
    }

    const result = await prisma.production.deleteMany({
      where: { id: { in: ids } },
    })

    log.info(`${result.count} production(s) permanently deleted`, { ids })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    log.error('Failed to delete production', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Failed to delete production' }, { status: 500 })
  }
}
