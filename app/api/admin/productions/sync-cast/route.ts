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

  const body = await req.json() as { productionId?: string; pending?: boolean; reset?: boolean; resetMode?: 'no-tmdb-type' | 'all'; limit?: number }
  const service = new ProductionCastService()

  if (body.productionId) {
    // Sync de uma produção específica
    try {
      const result = await service.syncProductionCast(body.productionId)
      return NextResponse.json({ ok: true, ...result })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sincronizar elenco'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  if (body.reset) {
    // Reseta castSyncAt de produções com tmdbId para reprocessamento
    // resetMode='no-tmdb-type' → apenas as que foram carimbadas incorretamente (sem tmdbType)
    const resetMode = body.resetMode === 'no-tmdb-type' ? 'no-tmdb-type' : 'all'
    const { resetCount, total } = await service.resetCastSyncAt(resetMode)
    return NextResponse.json({ ok: true, resetCount, total, resetMode })
  }

  if (body.pending) {
    // Sync em lote de produções pendentes/desatualizadas
    const limit = Math.min(body.limit ?? 10, 50)
    const result = await service.syncPendingProductionCasts(limit)
    return NextResponse.json({ ok: true, ...result })
  }

  return NextResponse.json({ error: 'Informe productionId, pending:true ou reset:true' }, { status: 400 })
}
