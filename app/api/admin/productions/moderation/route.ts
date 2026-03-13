import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTION_MODERATION')

export const dynamic = 'force-dynamic'

// Palavras-chave para detectar conteúdo adulto nos títulos
export const ADULT_KEYWORDS = [
  'porn', 'porno', 'pornô', 'xxx', 'jav',
  'gravure', 'av idol', 'av girl', 'av model',
  'hentai', 'erotic film', 'erotic movie', 'erotic drama',
  'adult film', 'adult video', 'adult movie', 'adult content',
  'nude model', 'nude film', 'softcore', 'hardcore',
  'fetish', 'bdsm', 'onlyfans', 'camgirl', 'cam girl',
  'sex tape', 'sex film', 'sex movie',
  'uncensored', 'leaked sex', 'explicit content',
]

function buildAdultCondition() {
  return {
    OR: [
      ...ADULT_KEYWORDS.map(kw => ({
        titlePt: { contains: kw, mode: 'insensitive' as const },
      })),
      ...ADULT_KEYWORDS.map(kw => ({
        synopsis: { contains: kw, mode: 'insensitive' as const },
      })),
    ],
  }
}

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
    case 'adult': {
      // Combina: verificado como adulto pelo DeepSeek OU detectado por palavras-chave
      const adultCondition = {
        OR: [
          { isAdultContent: true },
          ...buildAdultCondition().OR,
        ],
      }
      if (search) return { AND: [adultCondition, titleFilter] }
      return adultCondition
    }
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
    const [suspicious, recent, flagged, adult, all] = await Promise.all([
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
      prisma.production.count({ where: { OR: [{ isAdultContent: true }, ...buildAdultCondition().OR] } }),
      prisma.production.count({ where: { flaggedAsNonKorean: false } }),
    ])
    return NextResponse.json({ suspicious, recent, flagged, adult, all })
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
          isAdultContent: true,
          adultCheckedAt: true,
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
  withArtists: z.boolean().optional().default(false),
})

/**
 * DELETE /api/admin/productions/moderation
 * Remover permanentemente — single (?productionId=) ou bulk (body.ids[])
 * body.withArtists=true → também exclui artistas vinculados APENAS a essas produções
 */
export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Support both query param (single) and body (bulk)
    const productionIdParam = request.nextUrl.searchParams.get('productionId')
    let ids: string[]
    let withArtists = false

    if (productionIdParam) {
      ids = [productionIdParam]
    } else {
      const body = await request.json()
      const parsed = deleteSchema.parse(body)
      ids = parsed.ids
      withArtists = parsed.withArtists ?? false
    }

    let deletedArtists = 0

    if (withArtists) {
      // Artistas vinculados a essas produções
      const linked = await prisma.artistProduction.findMany({
        where: { productionId: { in: ids } },
        select: { artistId: true },
        distinct: ['artistId'],
      })
      const linkedArtistIds = linked.map(r => r.artistId)

      if (linkedArtistIds.length > 0) {
        // Desses, quais têm produções fora da lista (não podem ser excluídos)
        const withOther = await prisma.artistProduction.findMany({
          where: { artistId: { in: linkedArtistIds }, productionId: { notIn: ids } },
          select: { artistId: true },
          distinct: ['artistId'],
        })
        const withOtherSet = new Set(withOther.map(r => r.artistId))
        const artistIdsToDelete = linkedArtistIds.filter(id => !withOtherSet.has(id))

        if (artistIdsToDelete.length > 0) {
          const r = await prisma.artist.deleteMany({ where: { id: { in: artistIdsToDelete } } })
          deletedArtists = r.count
          log.info(`${deletedArtists} artist(s) deleted alongside productions`, { artistIds: artistIdsToDelete })
        }
      }
    }

    const result = await prisma.production.deleteMany({
      where: { id: { in: ids } },
    })

    log.info(`${result.count} production(s) permanently deleted`, { ids, withArtists, deletedArtists })

    return NextResponse.json({ success: true, deleted: result.count, deletedArtists })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    log.error('Failed to delete production', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Failed to delete production' }, { status: 500 })
  }
}
