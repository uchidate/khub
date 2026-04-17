/**
 * Budget Guard
 * Verifica se o gasto mensal de uma feature não ultrapassou o limite configurado.
 * Lança erro se o budget estiver esgotado, bloqueando a chamada ao provider.
 */

import prisma from '@/lib/prisma'
import { getMonthlySpendByFeature } from '@/lib/services/ai-stats-service'
import type { AiFeature } from './ai-features'

export class BudgetExceededError extends Error {
    constructor(
        public readonly feature: AiFeature,
        public readonly spent: number,
        public readonly budget: number,
    ) {
        super(
            `Budget mensal esgotado para "${feature}": gasto $${spent.toFixed(4)} / limite $${budget.toFixed(2)}`
        )
        this.name = 'BudgetExceededError'
    }
}

/**
 * Verifica se a feature tem budget disponível.
 * Lança BudgetExceededError se o limite mensal foi atingido.
 * Se não houver configuração de budget (null), libera sem restrição.
 */
export async function assertBudgetAvailable(feature: AiFeature): Promise<void> {
    const config = await prisma.aiConfig.findUnique({ where: { feature } })

    // Sem configuração ou sem limite → libera
    if (!config?.monthlyBudgetUsd) return

    // Feature desabilitada
    if (!config.enabled) {
        throw new Error(`Feature "${feature}" está desabilitada na configuração de IA.`)
    }

    const spendByFeature = await getMonthlySpendByFeature()
    const spent = spendByFeature[feature] ?? 0

    if (spent >= config.monthlyBudgetUsd) {
        throw new BudgetExceededError(feature, spent, config.monthlyBudgetUsd)
    }
}

/**
 * Retorna o estado do budget para uma feature sem lançar erro.
 * Útil para exibir no admin antes de confirmar uma geração.
 */
export async function getBudgetStatus(feature: AiFeature): Promise<{
    feature: AiFeature
    budgetUsd: number | null
    spentUsd: number
    remainingUsd: number | null
    exceeded: boolean
    enabled: boolean
}> {
    const config = await prisma.aiConfig.findUnique({ where: { feature } })
    const spendByFeature = await getMonthlySpendByFeature()
    const spentUsd = spendByFeature[feature] ?? 0
    const budgetUsd = config?.monthlyBudgetUsd ?? null

    return {
        feature,
        budgetUsd,
        spentUsd,
        remainingUsd: budgetUsd != null ? Math.max(0, budgetUsd - spentUsd) : null,
        exceeded: budgetUsd != null && spentUsd >= budgetUsd,
        enabled: config?.enabled ?? true,
    }
}

/**
 * Retorna o status de budget para todas as features editoriais de uma vez.
 * Usado na tela de enriquecimento em lote para exibir o estado geral.
 */
export async function getAllEditorialBudgetStatuses(): Promise<Record<string, {
    budgetUsd: number | null
    spentUsd: number
    remainingUsd: number | null
    exceeded: boolean
    enabled: boolean
}>> {
    const editorialFeatures: AiFeature[] = [
        'artist_bio_enrichment',
        'artist_editorial',
        'artist_curiosidades',
        'group_bio_enrichment',
        'group_editorial',
        'production_review',
        'news_editorial_note',
        'blog_post_generation',
    ]

    const [configs, spendByFeature] = await Promise.all([
        prisma.aiConfig.findMany({
            where: { feature: { in: editorialFeatures } },
        }),
        getMonthlySpendByFeature(),
    ])

    const configMap = Object.fromEntries(configs.map(c => [c.feature, c]))

    return Object.fromEntries(editorialFeatures.map(feature => {
        const config = configMap[feature]
        const spentUsd = spendByFeature[feature] ?? 0
        const budgetUsd = config?.monthlyBudgetUsd ?? null
        return [feature, {
            budgetUsd,
            spentUsd,
            remainingUsd: budgetUsd != null ? Math.max(0, budgetUsd - spentUsd) : null,
            exceeded: budgetUsd != null && spentUsd >= budgetUsd,
            enabled: config?.enabled ?? true,
        }]
    }))
}
