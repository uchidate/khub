/** Constantes de features de IA — sem dependências de servidor, seguro para uso em Client Components */

export type AiFeature =
    | 'news_translation'
    | 'news_generation'
    | 'artist_generation'
    | 'artist_translation'
    | 'group_translation'
    | 'production_generation'
    | 'news_tagging'
    | 'unknown'

export const AI_FEATURES: Exclude<AiFeature, 'unknown'>[] = [
    'news_translation',
    'news_generation',
    'artist_generation',
    'artist_translation',
    'group_translation',
    'production_generation',
    'news_tagging',
]

export const FEATURE_LABELS: Record<AiFeature, string> = {
    news_translation:      'Tradução de Notícias',
    news_generation:       'Geração de Notícias',
    artist_generation:     'Geração de Artistas',
    artist_translation:    'Tradução de Artistas',
    group_translation:     'Tradução de Grupos',
    production_generation: 'Geração de Produções',
    news_tagging:          'Tagueamento de Notícias',
    unknown:               'Desconhecido',
}
