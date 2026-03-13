import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('AUTO_HIDE')

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/auto-hide
 * Retorna quantos registros seriam ocultados (preview sem executar)
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Produções adultas (IA confirmou) ainda visíveis
    const adultVisible = await prisma.production.count({
      where: { isAdultContent: true, isHidden: false },
    })

    // Artistas vinculados a produções adultas ainda visíveis
    const adultProductionIds = await prisma.production.findMany({
      where: { isAdultContent: true, isHidden: false },
      select: { id: true },
    })
    const artistsFromAdult = adultProductionIds.length > 0
      ? await prisma.artist.count({
          where: {
            isHidden: false,
            productions: { some: { productionId: { in: adultProductionIds.map(p => p.id) } } },
          },
        })
      : 0

    return NextResponse.json({ adultVisible, artistsFromAdult })
  } catch (err) {
    log.error('Failed to fetch auto-hide preview', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

const bodySchema = z.object({
  /** Ocultar produções com isAdultContent = true */
  hideAdult: z.boolean().default(true),
  /** Ocultar artistas vinculados às produções ocultadas */
  hideLinkedArtists: z.boolean().default(false),
})

/**
 * POST /api/admin/productions/auto-hide
 * Oculta automaticamente:
 * - Produções com isAdultContent = true (confirmado pela IA)
 * - Artistas vinculados a essas produções (opcional)
 *
 * Nota: produções sem classificação não são ocultadas em massa aqui,
 * pois podem ser dramas legítimos ainda não classificados.
 * Use o filtro "Conteúdo adulto" + DeepSeek para identificá-las primeiro.
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = bodySchema.parse(await request.json())
    const { hideAdult, hideLinkedArtists } = body

    let hiddenProductions = 0
    let hiddenArtists = 0

    if (hideAdult) {
      // Ocultar produções adultas confirmadas
      const result = await prisma.production.updateMany({
        where: { isAdultContent: true, isHidden: false },
        data: { isHidden: true },
      })
      hiddenProductions = result.count
      log.info(`Auto-hidden ${hiddenProductions} adult productions`)

      if (hideLinkedArtists && hiddenProductions > 0) {
        // Encontrar artistas vinculados a produções adultas
        const adultProductionIds = await prisma.production.findMany({
          where: { isAdultContent: true },
          select: { id: true },
        })
        const ids = adultProductionIds.map(p => p.id)

        const artistResult = await prisma.artist.updateMany({
          where: {
            isHidden: false,
            productions: { some: { productionId: { in: ids } } },
          },
          data: { isHidden: true },
        })
        hiddenArtists = artistResult.count
        log.info(`Auto-hidden ${hiddenArtists} artists linked to adult productions`)
      }
    }

    return NextResponse.json({
      success: true,
      hiddenProductions,
      hiddenArtists,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: err.issues }, { status: 400 })
    }
    log.error('Failed to auto-hide productions', { error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Erro ao ocultar registros' }, { status: 500 })
  }
}
