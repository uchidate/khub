import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getArtistVisibilityService } from '@/lib/services/artist-visibility-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/productions/cast?productionId=X
 * List cast members for a production
 */
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const productionId = searchParams.get('productionId')
  if (!productionId) return NextResponse.json({ error: 'productionId required' }, { status: 400 })

  const cast = await prisma.artistProduction.findMany({
    where: { productionId },
    orderBy: [{ castOrder: 'asc' }, { artist: { nameRomanized: 'asc' } }],
    include: {
      artist: {
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          primaryImageUrl: true,
          stageNames: true,
        },
      },
    },
  })

  return NextResponse.json(cast)
}

/**
 * PATCH /api/admin/productions/cast
 * Edit role or castOrder for a cast member
 */
export async function PATCH(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const schema = z.object({
    artistId: z.string(),
    productionId: z.string(),
    role: z.string().optional().nullable(),
    castOrder: z.number().int().optional().nullable(),
  })

  const { artistId, productionId, role, castOrder } = schema.parse(body)

  const updated = await prisma.artistProduction.update({
    where: { artistId_productionId: { artistId, productionId } },
    data: { role, castOrder },
    include: {
      artist: {
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          primaryImageUrl: true,
          stageNames: true,
        },
      },
    },
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/admin/productions/cast
 * Remove a cast member from a production
 */
export async function DELETE(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { artistId, productionId } = z.object({
    artistId: z.string(),
    productionId: z.string(),
  }).parse(body)

  await prisma.artistProduction.delete({
    where: { artistId_productionId: { artistId, productionId } },
  })

  // Reavaliar visibilidade do artista após remoção do elenco
  void getArtistVisibilityService().evaluate(artistId).catch(() => {})

  return NextResponse.json({ ok: true })
}
