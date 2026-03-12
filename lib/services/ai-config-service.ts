import prisma from '@/lib/prisma'
import type { AiFeature } from '@/lib/ai/ai-usage-logger'

export const AI_FEATURES: AiFeature[] = [
    'news_translation',
    'news_generation',
    'artist_generation',
    'artist_translation',
    'group_translation',
    'production_generation',
    'news_tagging',
]

export const FEATURE_LABELS: Record<AiFeature | 'unknown', string> = {
    news_translation:     'Tradução de Notícias',
    news_generation:      'Geração de Notícias',
    artist_generation:    'Geração de Artistas',
    artist_translation:   'Tradução de Artistas',
    group_translation:    'Tradução de Grupos',
    production_generation:'Geração de Produções',
    news_tagging:         'Tagueamento de Notícias',
    unknown:              'Desconhecido',
}

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
