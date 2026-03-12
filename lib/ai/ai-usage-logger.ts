import prisma from '@/lib/prisma'
export type { AiFeature } from './ai-features'
import type { AiFeature } from './ai-features'

export interface AiUsageEntry {
    provider: string
    model: string
    feature: AiFeature
    tokensIn?: number
    tokensOut?: number
    cost?: number
    durationMs: number
    status: 'success' | 'error' | 'circuit_open'
    errorMsg?: string
}

/**
 * Persiste um log de uso de IA no banco.
 * Fire-and-forget — nunca lança exceção, nunca bloqueia a operação principal.
 */
export function logAiUsage(entry: AiUsageEntry): void {
    const tokensIn  = entry.tokensIn  ?? 0
    const tokensOut = entry.tokensOut ?? 0
    prisma.aiUsageLog.create({
        data: {
            provider:   entry.provider,
            model:      entry.model,
            feature:    entry.feature,
            tokensIn,
            tokensOut,
            cost:       entry.cost ?? 0,
            durationMs: entry.durationMs,
            status:     entry.status,
            errorMsg:   entry.errorMsg?.slice(0, 500),
        },
    }).catch(() => { /* melhor esforço */ })
}
