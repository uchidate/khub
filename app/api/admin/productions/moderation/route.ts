import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('PRODUCTION_MODERATION')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/moderation
 * Lista produções para revisão/moderação
 *
 * Query params:
 * - filter: 'all' | 'suspicious' | 'recent' | 'flagged'
 * - page: número da página (padrão: 1)
 * - limit: itens por página (padrão: 20)
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const searchParams = request.nextUrl.searchParams
  const filter = searchParams.get('filter') || 'suspicious'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  try {
    let where: any = {}

    switch (filter) {
      case 'suspicious':
        // Produções sem título coreano OU sem TMDB ID
        where = {
          AND: [
            { flaggedAsNonKorean: false },
            {
              OR: [
                { titleKr: null },
                { tmdbId: null },
              ],
            },
          ],
        }
        break

      case 'recent': {
        // Produções adicionadas nos últimos 7 dias
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        where = {
          createdAt: { gte: sevenDaysAgo },
          flaggedAsNonKorean: false,
        }
        break
      }

      case 'flagged':
        // Produções já flagged
        where = { flaggedAsNonKorean: true }
        break

      case 'all':
      default:
        // Todas as produções (sem flagged)
        where = { flaggedAsNonKorean: false }
        break
    }

    // Buscar produções com contagem total
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
          _count: {
            select: {
              artists: true,
              userFavorites: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.production.count({ where }),
    ])

    // Calcular métricas de suspeição para cada produção
    const productionsWithScore = productions.map(production => {
      let suspicionScore = 0
      const reasons: string[] = []

      // Sem título coreano
      if (!production.titleKr) {
        suspicionScore += 3
        reasons.push('Sem título em coreano')
      }

      // Sem TMDB ID
      if (!production.tmdbId) {
        suspicionScore += 2
        reasons.push('Sem TMDB ID')
      }

      // Título português não parece coreano (heurística básica)
      if (production.titlePt) {
        const hasCoreano = /[\uAC00-\uD7AF]/.test(production.titlePt)
        const hasCommonKoreanWords = /(king|queen|princess|prince|doctor|mr\.|mrs\.|love|heart|secret|moon|sun|sky|flower|spring|summer|autumn|winter|school|hospital|palace)/i.test(production.titlePt)

        if (!hasCoreano && !hasCommonKoreanWords) {
          suspicionScore += 2
          reasons.push('Título não parece coreano')
        }
      }

      // Sem artistas coreanos
      if (production._count.artists === 0) {
        suspicionScore += 3
        reasons.push('Sem artistas vinculados')
      }

      // Plataformas de streaming suspeitas
      if (production.streamingPlatforms.length === 0) {
        suspicionScore += 1
        reasons.push('Sem plataformas de streaming')
      }

      return {
        ...production,
        suspicionScore,
        suspicionReasons: reasons,
      }
    })

    // Ordenar por suspicionScore (decrescente) se filter=suspicious
    if (filter === 'suspicious') {
      productionsWithScore.sort((a, b) => b.suspicionScore - a.suspicionScore)
    }

    return NextResponse.json({
      productions: productionsWithScore,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filter,
    })
  } catch (err) {
    log.error('Failed to fetch productions for moderation', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to fetch productions' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/productions/moderation
 * Marcar/desmarcar produção como não-relevante
 */
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { productionId, flaggedAsNonKorean } = body

    if (!productionId || typeof flaggedAsNonKorean !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: { productionId: string, flaggedAsNonKorean: boolean }' },
        { status: 400 }
      )
    }

    // Atualizar produção
    const production = await prisma.production.update({
      where: { id: productionId },
      data: {
        flaggedAsNonKorean,
        flaggedAt: flaggedAsNonKorean ? new Date() : null,
      },
      select: {
        id: true,
        titlePt: true,
        flaggedAsNonKorean: true,
      },
    })

    log.info(`Production ${flaggedAsNonKorean ? 'flagged' : 'unflagged'}`, { productionId, title: production.titlePt })

    return NextResponse.json({
      success: true,
      production,
    })
  } catch (err) {
    log.error('Failed to update production flag', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to update production' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/productions/moderation
 * Remover produção permanentemente
 */
export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const productionId = searchParams.get('productionId')

    if (!productionId) {
      return NextResponse.json(
        { error: 'Missing productionId query parameter' },
        { status: 400 }
      )
    }

    // Buscar produção antes de deletar (para log)
    const production = await prisma.production.findUnique({
      where: { id: productionId },
      select: { titlePt: true },
    })

    if (!production) {
      return NextResponse.json(
        { error: 'Production not found' },
        { status: 404 }
      )
    }

    // Deletar produção (cascade deleta relações)
    await prisma.production.delete({
      where: { id: productionId },
    })

    log.info(`Production permanently deleted`, { productionId, title: production.titlePt })

    return NextResponse.json({
      success: true,
      message: `Production ${production.titlePt} deleted successfully`,
    })
  } catch (err) {
    log.error('Failed to delete production', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to delete production' },
      { status: 500 }
    )
  }
}
