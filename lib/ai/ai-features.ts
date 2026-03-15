/** Constantes de features de IA — sem dependências de servidor, seguro para uso em Client Components */

export type AiFeature =
    | 'news_translation'
    | 'news_generation'
    | 'artist_generation'
    | 'artist_translation'
    | 'group_translation'
    | 'production_generation'
    | 'news_tagging'
    // Enriquecimento de conteúdo editorial
    | 'artist_bio_enrichment'
    | 'artist_editorial'
    | 'artist_curiosidades'
    | 'group_bio_enrichment'
    | 'group_editorial'
    | 'production_review'
    | 'news_editorial_note'
    | 'blog_post_generation'
    | 'unknown'

export const AI_FEATURES: Exclude<AiFeature, 'unknown'>[] = [
    'news_translation',
    'news_generation',
    'artist_generation',
    'artist_translation',
    'group_translation',
    'production_generation',
    'news_tagging',
    'artist_bio_enrichment',
    'artist_editorial',
    'artist_curiosidades',
    'group_bio_enrichment',
    'group_editorial',
    'production_review',
    'news_editorial_note',
    'blog_post_generation',
]

export const FEATURE_LABELS: Record<AiFeature, string> = {
    news_translation:       'Tradução de Notícias',
    news_generation:        'Geração de Notícias',
    artist_generation:      'Geração de Artistas',
    artist_translation:     'Tradução de Artistas',
    group_translation:      'Tradução de Grupos',
    production_generation:  'Geração de Produções',
    news_tagging:           'Tagueamento de Notícias',
    artist_bio_enrichment:  'Bio de Artista (enriquecimento)',
    artist_editorial:       'Análise Editorial de Artista',
    artist_curiosidades:    'Curiosidades sobre Artista',
    group_bio_enrichment:   'Bio de Grupo (enriquecimento)',
    group_editorial:        'Análise Editorial de Grupo',
    production_review:      'Review Editorial de Produção',
    news_editorial_note:    'Nota Editorial de Notícia',
    blog_post_generation:   'Geração de Post de Blog',
    unknown:                'Desconhecido',
}
