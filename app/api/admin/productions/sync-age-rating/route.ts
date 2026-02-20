/**
 * POST /api/admin/productions/sync-age-rating
 *
 * Busca a classificação etária (DJCTQ) do TMDB para produções sem ageRating.
 * Body: { productionId: string }          → sincroniza uma produção específica
 * Body: { pending: true, limit?: number } → sincroniza N produções pendentes
 *
 * Autenticação: session admin (requireAdmin).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { ProductionAgeRatingService } from '@/lib/services/production-age-rating-service'

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
    return NextResponse.json({ ok: true, ...result })
  }

  return NextResponse.json({ error: 'Informe productionId ou pending:true' }, { status: 400 })
}
