import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { ArtistRepository } from '@/lib/repositories/ArtistRepository'
import { toHttpError } from '@/lib/repositories/base'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ARTIST_MODERATION')

export const dynamic = 'force-dynamic'

// Palavras-chave para detectar conteúdo adulto em artistas
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

function buildAdultArtistCondition() {
  return {
    OR: [
      ...ADULT_KEYWORDS.map(kw => ({
        nameRomanized: { contains: kw, mode: 'insensitive' as const },
      })),
      ...ADULT_KEYWORDS.map(kw => ({
        bio: { contains: kw, mode: 'insensitive' as const },
      })),
    ],
  }
}

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
  // hidden=true → só ocultos; hidden=false → só visíveis; ausente → todos
  const hiddenParam = searchParams.get('hidden')
  const hiddenWhere = hiddenParam === 'true' ? { isHidden: true }
    : hiddenParam === 'false' ? { isHidden: false }
    : {}

  try {
    let where: any = {}

    switch (filter) {
      case 'suspicious':
        // Artistas sem nome Hangul E sem local de nascimento coreano
        where = {
          ...hiddenWhere,
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
          ...hiddenWhere,
          createdAt: { gte: sevenDaysAgo },
          flaggedAsNonKorean: false,
        }
        break
      }

      case 'flagged':
        // Artistas já flagged
        where = { ...hiddenWhere, flaggedAsNonKorean: true }
        break

      case 'adult':
        where = { ...hiddenWhere, ...buildAdultArtistCondition() }
        break

      case 'all':
      default:
        // Todos os artistas (sem flagged)
        where = { ...hiddenWhere, flaggedAsNonKorean: false }
        break
    }

    // Stats
    if (searchParams.get('stats') === '1') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const [suspicious, recent, flagged, adult, all] = await Promise.all([
        prisma.artist.count({ where: { ...hiddenWhere, flaggedAsNonKorean: false, OR: [{ nameHangul: null }, { placeOfBirth: null }] } }),
        prisma.artist.count({ where: { ...hiddenWhere, createdAt: { gte: sevenDaysAgo }, flaggedAsNonKorean: false } }),
        prisma.artist.count({ where: { ...hiddenWhere, flaggedAsNonKorean: true } }),
        prisma.artist.count({ where: { ...hiddenWhere, ...buildAdultArtistCondition() } }),
        prisma.artist.count({ where: { ...hiddenWhere, flaggedAsNonKorean: false } }),
      ])
      return NextResponse.json({ suspicious, recent, flagged, adult, all })
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

    // Conta produções ocultas por artista (batch)
    const artistIds = artists.map(a => a.id)
    const hiddenProdRows = artistIds.length > 0
      ? await prisma.artistProduction.groupBy({
          by: ['artistId'],
          where: { artistId: { in: artistIds }, production: { isHidden: true } },
          _count: { productionId: true },
        })
      : []
    const hiddenProdMap = new Map(hiddenProdRows.map(r => [r.artistId, r._count.productionId]))

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
        hiddenProductionsCount: hiddenProdMap.get(artist.id) ?? 0,
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
  const { error, session } = await requireAdmin()
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

    const artist = await ArtistRepository.flag(
      artistId,
      flaggedAsNonKorean,
      { adminId: session!.user.id }
    )
    return NextResponse.json({ success: true, artist })
  } catch (err) {
    log.error('Failed to update artist flag', { error: getErrorMessage(err) })
    return toHttpError(err)
  }
}

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

/**
 * DELETE /api/admin/artists/moderation
 * Remover artista(s) permanentemente
 * - single: ?artistId=xxx (query param)
 * - bulk: body { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const artistIdParam = request.nextUrl.searchParams.get('artistId')
    let ids: string[]

    if (artistIdParam) {
      ids = [artistIdParam]
    } else {
      const body = await request.json()
      ids = bulkDeleteSchema.parse(body).ids
    }

    const result = await ArtistRepository.delete(ids, { adminId: session!.user.id })
    return NextResponse.json({ success: true, deleted: result.count })
  } catch (err) {
    log.error('Failed to delete artist', { error: getErrorMessage(err) })
    return toHttpError(err)
  }
}
