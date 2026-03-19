import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { resetOrchestrator } from '@/lib/ai/orchestrator-factory'

/**
 * POST /api/admin/ai/reset-circuits
 *
 * Reseta os circuit breakers de todos os providers de IA.
 * Útil quando Ollama ou DeepSeek abriram o circuit após falhas em série
 * e o admin quer tentar novamente sem esperar o cooldown de 10 minutos.
 */
export async function POST() {
    const { error } = await requireAdmin()
    if (error) return error

    resetOrchestrator()
    console.log('[admin] AIOrchestrator resetado via API — circuits limpos')

    return NextResponse.json({ ok: true, message: 'Circuit breakers resetados. Novo orchestrator será criado na próxima chamada.' })
}
