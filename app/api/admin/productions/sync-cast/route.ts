/**
 * POST /api/admin/productions/sync-cast
 *
 * Importa o elenco do TMDB para uma ou mais produções.
 * Body: { productionId: string }  → sincroniza uma produção específica
 * Body: { pending: true, limit?: number } → sincroniza N produções pendentes
 *
 * Autenticação: session admin (requireAdmin), sem CRON_SECRET.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { ProductionCastService } from '@/lib/services/production-cast-service'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json() as { productionId?: string; pending?: boolean; limit?: number }
  const service = new ProductionCastService()

  if (body.productionId) {
    // Sync de uma produção específica
    const result = await service.syncProductionCast(body.productionId)
    return NextResponse.json({ ok: true, ...result })
  }

  if (body.pending) {
    // Sync em lote de produções pendentes/desatualizadas
    const limit = Math.min(body.limit ?? 10, 50)
    const result = await service.syncPendingProductionCasts(limit)
    return NextResponse.json({ ok: true, ...result })
  }

  return NextResponse.json({ error: 'Informe productionId ou pending:true' }, { status: 400 })
}
