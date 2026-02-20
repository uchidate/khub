import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTIST_MODERATION')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/artists/moderation
 * Lista artistas para revisão/moderação
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
        // Artistas sem nome Hangul E sem local de nascimento coreano
        where = {
          AND: [
            { flaggedAsNonKorean: false },
            {
              OR: [
                { nameHangul: null },
                { placeOfBirth: null },
              ],
            },
          ],
        }
        break

      case 'recent': {
        // Artistas adicionados nos últimos 7 dias
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        where = {
          createdAt: { gte: sevenDaysAgo },
          flaggedAsNonKorean: false,
        }
        break
      }

      case 'flagged':
        // Artistas já flagged
        where = { flaggedAsNonKorean: true }
        break

      case 'all':
      default:
        // Todos os artistas (sem flagged)
        where = { flaggedAsNonKorean: false }
        break
    }

    // Buscar artistas com contagem total
    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          placeOfBirth: true,
          bio: true,
          primaryImageUrl: true,
          roles: true,
          tmdbId: true,
          createdAt: true,
          flaggedAsNonKorean: true,
          flaggedAt: true,
          _count: {
            select: {
              productions: true,
              memberships: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.artist.count({ where }),
    ])

    // Calcular métricas de suspeição para cada artista
    const artistsWithScore = artists.map(artist => {
      let suspicionScore = 0
      const reasons: string[] = []

      // Sem nome Hangul
      if (!artist.nameHangul) {
        suspicionScore += 3
        reasons.push('Sem nome em Hangul')
      }

      // Sem local de nascimento
      if (!artist.placeOfBirth) {
        suspicionScore += 2
        reasons.push('Sem local de nascimento')
      }

      // Local de nascimento não-coreano
      if (artist.placeOfBirth) {
        const birthPlace = artist.placeOfBirth.toLowerCase()
        const nonKoreanCountries = ['china', 'japan', 'thailand', 'vietnam', 'philippines', 'india']
        const isNonKorean = nonKoreanCountries.some(country =>
          birthPlace.includes(country) && !birthPlace.includes('korea')
        )
        if (isNonKorean) {
          suspicionScore += 4
          reasons.push(`Nascido em: ${artist.placeOfBirth}`)
        }
      }

      // Biografia em inglês (heurística)
      if (artist.bio && artist.bio.length > 30) {
        const accented = (artist.bio.match(/[áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]/g) || []).length
        const words = artist.bio.trim().split(/\s+/).length
        const isLikelyEnglish = words > 8 && accented / words < 0.03
        if (isLikelyEnglish) {
          suspicionScore += 2
          reasons.push('Biografia em inglês')
        }
      }

      // Sem produções coreanas
      if (artist._count.productions === 0 && artist._count.memberships === 0) {
        suspicionScore += 3
        reasons.push('Sem produções ou grupos')
      }

      return {
        ...artist,
        suspicionScore,
        suspicionReasons: reasons,
      }
    })

    // Ordenar por suspicionScore (decrescente) se filter=suspicious
    if (filter === 'suspicious') {
      artistsWithScore.sort((a, b) => b.suspicionScore - a.suspicionScore)
    }

    return NextResponse.json({
      artists: artistsWithScore,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filter,
    })
  } catch (err) {
    log.error('Failed to fetch artists for moderation', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/artists/moderation/:artistId
 * Marcar/desmarcar artista como não-relevante
 */
export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const { artistId, flaggedAsNonKorean } = body

    if (!artistId || typeof flaggedAsNonKorean !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: { artistId: string, flaggedAsNonKorean: boolean }' },
        { status: 400 }
      )
    }

    // Atualizar artista
    const artist = await prisma.artist.update({
      where: { id: artistId },
      data: {
        flaggedAsNonKorean,
        flaggedAt: flaggedAsNonKorean ? new Date() : null,
      },
      select: {
        id: true,
        nameRomanized: true,
        flaggedAsNonKorean: true,
      },
    })

    log.info(`Artist ${flaggedAsNonKorean ? 'flagged' : 'unflagged'}`, { artistId, name: artist.nameRomanized })

    return NextResponse.json({
      success: true,
      artist,
    })
  } catch (err) {
    log.error('Failed to update artist flag', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to update artist' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/artists/moderation/:artistId
 * Remover artista permanentemente
 */
export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const searchParams = request.nextUrl.searchParams
    const artistId = searchParams.get('artistId')

    if (!artistId) {
      return NextResponse.json(
        { error: 'Missing artistId query parameter' },
        { status: 400 }
      )
    }

    // Buscar artista antes de deletar (para log)
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { nameRomanized: true },
    })

    if (!artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      )
    }

    // Deletar artista (cascade deleta relações)
    await prisma.artist.delete({
      where: { id: artistId },
    })

    log.info(`Artist permanently deleted`, { artistId, name: artist.nameRomanized })

    return NextResponse.json({
      success: true,
      message: `Artist ${artist.nameRomanized} deleted successfully`,
    })
  } catch (err) {
    log.error('Failed to delete artist', { error: getErrorMessage(err) })
    return NextResponse.json(
      { error: 'Failed to delete artist' },
      { status: 500 }
    )
  }
}
