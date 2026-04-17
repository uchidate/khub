import prisma from '@/lib/prisma'
// Re-export constants from ai-features for convenience in server-side code
export { AI_FEATURES, FEATURE_LABELS } from '@/lib/ai/ai-features'

export interface AiConfigRow {
    id:               string
    feature:          string
    preferredProvider:string | null
    enabled:          boolean
    monthlyBudgetUsd: number | null
    notes:            string | null
    updatedAt:        Date
    updatedBy:        string | null
}

export async function getAllAiConfigs(): Promise<AiConfigRow[]> {
    return prisma.aiConfig.findMany({ orderBy: { feature: 'asc' } })
}

export async function getAiConfig(feature: string): Promise<AiConfigRow | null> {
    return prisma.aiConfig.findUnique({ where: { feature } })
}

export async function upsertAiConfig(
    feature: string,
    data: {
        preferredProvider?: string | null
        enabled?:           boolean
        monthlyBudgetUsd?:  number | null
        notes?:             string | null
        updatedBy:          string
    }
): Promise<AiConfigRow> {
    return prisma.aiConfig.upsert({
        where:  { feature },
        create: { feature, ...data },
        update: data,
    })
}
