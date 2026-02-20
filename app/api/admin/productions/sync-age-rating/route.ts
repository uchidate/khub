/**
 * POST /api/admin/productions/sync-age-rating
 *
 * Busca a classificação etária (DJCTQ) do TMDB para produções sem ageRating.
 * Body: { productionId: string }          → sincroniza uma produção específica
 * Body: { pending: true, limit?: number } → sincroniza N produções pendentes
 *
 * Produções já tentadas recentemente (ageRatingSyncAt < 7 dias) são puladas
 * e retentadas automaticamente após o cooldown.
 *
 * Autenticação: session admin (requireAdmin).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { ProductionAgeRatingService } from '@/lib/services/production-age-rating-service'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json() as { productionId?: string; pending?: boolean; limit?: number }
  const service = new ProductionAgeRatingService()

  if (body.productionId) {
    const result = await service.syncProductionAgeRating(body.productionId)
    return NextResponse.json({ ok: true, ...result })
  }

  if (body.pending) {
    const limit = Math.min(body.limit ?? 20, 100)
    const result = await service.syncPendingAgeRatings(limit)

    // Contar quantas ainda estão sem classificação (total, independente do cooldown)
    const remaining = await prisma.production.count({
      where: { ageRating: null, tmdbId: { not: null } },
    })

    return NextResponse.json({ ok: true, ...result, remaining })
  }

  return NextResponse.json({ error: 'Informe productionId ou pending:true' }, { status: 400 })
}
