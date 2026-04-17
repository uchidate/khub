/**
 * Vocabulário controlado de tags — única fonte de verdade.
 *
 * Regras:
 * - Sempre minúsculas com hífens (kebab-case)
 * - Máximo 4 tags por artigo (enforced no blog-style-guide)
 * - Usar tags cross-category combinadas com tags específicas da categoria
 *
 * Organização:
 * - BLOG_TAGS_BY_CATEGORY: tags recomendadas por categoria (para o editor)
 * - ALL_BLOG_TAGS: array plano para autocomplete e validação
 */

export const BLOG_TAGS_BY_CATEGORY: Record<string, string[]> = {
    'k-pop': [
        'debut', 'comeback', 'mv', 'daesang', 'collab',
        'boy-group', 'girl-group', 'solista',
        '1a-geracao', '2a-geracao', '3a-geracao', '4a-geracao', '5a-geracao',
        'hybe', 'sm-entertainment', 'yg-entertainment', 'jyp-entertainment', 'starship',
        'big-hit', 'cube', 'pledis', 'source-music', 'p-nation',
        'world-tour', 'concert', 'fotolibro', 'album-fisico',
    ],
    'k-drama': [
        'romance', 'thriller', 'historico', 'fantasia', 'slice-of-life',
        'acao', 'misterio', 'comedia', 'horror',
        'netflix', 'tvn', 'disney-plus', 'prime-video', 'mbc', 'sbs', 'kbs',
        '2023', '2024', '2025',
        'adaptacao-webtoon', 'remake',
    ],
    'k-film': [
        'acao', 'drama', 'terror', 'suspense', 'animacao', 'documentario', 'comedia',
        'netflix', 'cinema', 'oscar', 'cannes',
        '2023', '2024', '2025',
    ],
    'k-beauty': [
        'skincare', 'maquiagem', 'cabelo', 'tendencia', 'tutorial',
        'glass-skin', 'sun-care', 'ampoule', 'essence',
        'rotina-coreana', 'unboxing',
    ],
    'reality-shows': [
        'survival', 'audition', 'variety',
        'produce-series', 'i-land', 'street-woman-fighter', 'running-man',
        'mnet', 'sbs', 'kbs', 'tvn',
        'debut-show',
    ],
    'webtoons': [
        'romance', 'fantasia', 'acao', 'comedia', 'drama',
        'adaptacao-drama', 'adaptacao-filme',
        'naver', 'kakao', 'lezhin',
    ],
    'grupos': [
        'formacao', 'discografia', 'historia', 'debut', 'encerramento',
        'boy-group', 'girl-group', 'mixed-group',
        '4a-geracao', '3a-geracao', '2a-geracao',
    ],
    'artistas': [
        'solista', 'debut', 'comeback', 'discografia',
        'ator', 'atriz', 'modelo',
    ],
    'cultura': [
        'hallyu', 'idioma', 'gastronomia', 'viagem', 'soft-power',
        'brasil', 'america-latina', 'mercado-global',
        'moda', 'tendencia',
    ],
}

/** Tags usáveis em qualquer categoria */
export const BLOG_TAGS_CROSS_CATEGORY: string[] = [
    'analise', 'ranking', 'top-10', 'fandom', 'exclusivo',
    'iniciantes', 'guia', 'historia', 'premios', 'recordes',
]

/** Array plano com todas as tags — para autocomplete e validação no admin */
export const ALL_BLOG_TAGS: string[] = Array.from(
    new Set([
        ...Object.values(BLOG_TAGS_BY_CATEGORY).flat(),
        ...BLOG_TAGS_CROSS_CATEGORY,
    ])
).sort()
