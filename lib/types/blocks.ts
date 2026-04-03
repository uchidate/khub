// ─── News Block Types (Option A — Block Editor) ───────────────────────────────
//
// Each block has a `type` discriminator. Text-based blocks carry `original`
// (source language) and `translated` (pt-BR) strings. Media blocks carry
// only the necessary URLs/metadata.
//
// The `blocks` field on the News model stores `NewsBlock[]` serialized as JSON.

export type HeadingBlock = {
    type: 'heading'
    original: string
    translated: string
}

export type ParagraphBlock = {
    type: 'paragraph'
    original: string
    translated: string
}

export type QuoteBlock = {
    type: 'quote'
    original: string
    translated: string
}

export type ImageBlock = {
    type: 'image'
    url: string
    caption?: string
}

export type TwitterEmbedBlock = {
    type: 'twitter_embed'
    url: string
}

export type InstagramEmbedBlock = {
    type: 'instagram_embed'
    url: string
}

export type TikTokEmbedBlock = {
    type: 'tiktok_embed'
    url: string
}

export type VideoBlock = {
    type: 'video'
    url: string
    caption?: string
}

export type NewsBlock =
    | HeadingBlock
    | ParagraphBlock
    | QuoteBlock
    | ImageBlock
    | TwitterEmbedBlock
    | InstagramEmbedBlock
    | TikTokEmbedBlock
    | VideoBlock

export type NewsBlockType = NewsBlock['type']

export const BLOCK_TYPE_LABELS: Record<NewsBlockType, string> = {
    heading: 'Título',
    paragraph: 'Parágrafo',
    quote: 'Citação',
    image: 'Imagem',
    twitter_embed: 'Tweet',
    instagram_embed: 'Instagram',
    tiktok_embed: 'TikTok',
    video: 'Vídeo',
}

export const TEXT_BLOCK_TYPES: NewsBlockType[] = ['heading', 'paragraph', 'quote']
export const MEDIA_BLOCK_TYPES: NewsBlockType[] = ['image', 'twitter_embed', 'instagram_embed', 'tiktok_embed', 'video']

export function isTextBlock(block: NewsBlock): block is HeadingBlock | ParagraphBlock | QuoteBlock {
    return TEXT_BLOCK_TYPES.includes(block.type)
}

// ─── Blog Block Types ──────────────────────────────────────────────────────────
//
// Blocos exclusivos do blog — enriquecem posts com dados estruturados do site.
// Usados no BlogBlockEditor e renderizados pelo BlogBlockRenderer.

export type BlogHeadingBlock = {
    type: 'blog_heading'
    text: string
    level: 1 | 2 | 3
}

export type BlogParagraphBlock = {
    type: 'blog_paragraph'
    text: string
}

export type BlogQuoteBlock = {
    type: 'blog_quote'
    text: string
    author?: string
}

export type BlogImageBlock = {
    type: 'blog_image'
    url: string
    caption?: string
    fullWidth?: boolean
    size?: 'small' | 'medium' | 'full'
}

export type BlogGalleryBlock = {
    type: 'blog_gallery'
    urls: string[]
    caption?: string
}

export type BlogVideoBlock = {
    type: 'blog_video'
    url: string
    caption?: string
}

export type BlogTwitterBlock = {
    type: 'blog_twitter'
    url: string
}

export type BlogInstagramBlock = {
    type: 'blog_instagram'
    url: string
}

export type BlogTikTokBlock = {
    type: 'blog_tiktok'
    url: string
}

// Bloco de card de artista — puxa dados ao vivo pelo id
export type BlogArtistCardBlock = {
    type: 'blog_artist_card'
    artistId: string
    note?: string          // anotação editorial opcional
    compact?: boolean
}

// Bloco de card de produção
export type BlogProductionCardBlock = {
    type: 'blog_production_card'
    productionId: string
    note?: string
    compact?: boolean
}

// Bloco de card de grupo musical
export type BlogGroupCardBlock = {
    type: 'blog_group_card'
    groupId: string
    note?: string
    compact?: boolean
}

// Linha de stats biográficos (ex: data de nascimento, altura, grupo)
export type BlogStatsRowBlock = {
    type: 'blog_stats_row'
    items: { label: string; value: string; emoji?: string }[]
}

// Avaliação editorial (estrelas + texto)
export type BlogRatingBlock = {
    type: 'blog_rating'
    score: number          // 0–10
    label?: string         // ex: "Álbum", "Drama", "Comeback"
    summary?: string
}

// Divisor visual
export type BlogDividerBlock = {
    type: 'blog_divider'
}

// Embed do Spotify (track, álbum, playlist, artista)
export type BlogSpotifyBlock = {
    type: 'blog_spotify'
    url: string
    compact?: boolean
}

// Item de linha do tempo
export type BlogTimelineItem = {
    year: string
    title: string
    text?: string
    emoji?: string
}

// Linha do tempo / marcos da carreira
export type BlogTimelineBlock = {
    type: 'blog_timeline'
    items: BlogTimelineItem[]
}

// Caixa de destaque (fato, dado, alerta, info)
export type BlogCalloutBlock = {
    type: 'blog_callout'
    variant: 'fact' | 'stat' | 'info' | 'warning'
    title?: string
    text: string
}

// Card "Você sabia?" — curiosidade visual destacada
export type BlogCuriosityBlock = {
    type: 'blog_curiosity'
    text: string
    emoji?: string   // ex: "🎤", "🏆", "🎬"
}

// Pull quote estilo revista — texto grande centralizado para impacto visual
export type BlogHighlightBlock = {
    type: 'blog_highlight'
    text: string
    attribution?: string
}

export type BlogBlock =
    | BlogHeadingBlock
    | BlogParagraphBlock
    | BlogQuoteBlock
    | BlogImageBlock
    | BlogGalleryBlock
    | BlogVideoBlock
    | BlogTwitterBlock
    | BlogInstagramBlock
    | BlogTikTokBlock
    | BlogArtistCardBlock
    | BlogProductionCardBlock
    | BlogGroupCardBlock
    | BlogStatsRowBlock
    | BlogRatingBlock
    | BlogSpotifyBlock
    | BlogTimelineBlock
    | BlogDividerBlock
    | BlogCalloutBlock
    | BlogCuriosityBlock
    | BlogHighlightBlock

export type BlogBlockType = BlogBlock['type']

export const BLOG_BLOCK_TYPE_LABELS: Record<BlogBlockType, string> = {
    blog_heading:          'Título',
    blog_paragraph:        'Parágrafo',
    blog_quote:            'Citação',
    blog_image:            'Imagem',
    blog_gallery:          'Galeria',
    blog_video:            'Vídeo',
    blog_twitter:          'Tweet',
    blog_instagram:        'Instagram',
    blog_tiktok:           'TikTok',
    blog_artist_card:      'Card de Artista',
    blog_production_card:  'Card de Produção',
    blog_group_card:       'Card de Grupo',
    blog_stats_row:        'Stats / Dados',
    blog_rating:           'Avaliação',
    blog_divider:          'Divisor',
    blog_callout:          'Destaque',
    blog_curiosity:        'Curiosidade',
    blog_highlight:        'Destaque Visual',
    blog_spotify:          'Spotify',
    blog_timeline:         'Linha do Tempo',
}

export type BlogTemplate = 'free' | 'idol_bio' | 'review' | 'ranking'

export const BLOG_TEMPLATE_LABELS: Record<BlogTemplate, string> = {
    free:      'Livre',
    idol_bio:  'Biografia de Idol',
    review:    'Review',
    ranking:   'Ranking',
}

/** Blocos pré-carregados para cada template */
export const BLOG_TEMPLATE_BLOCKS: Record<BlogTemplate, BlogBlock[]> = {
    free: [],

    idol_bio: [
        { type: 'blog_heading', text: 'Quem é?', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_stats_row', items: [
            { label: 'Nome real', value: '' },
            { label: 'Data de nascimento', value: '' },
            { label: 'Altura', value: '' },
            { label: 'Grupo', value: '' },
            { label: 'Agência', value: '' },
        ]},
        { type: 'blog_heading', text: 'Carreira', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Por que você vai amar', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Produções em destaque', level: 2 },
        { type: 'blog_heading', text: 'Curiosidades', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    review: [
        { type: 'blog_heading', text: 'Nossa análise', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_rating', score: 8, label: '', summary: '' },
        { type: 'blog_heading', text: 'Pontos fortes', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Pontos fracos', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Veredicto', level: 2 },
        { type: 'blog_quote', text: '', author: 'Equipe HallyuHub' },
    ],

    ranking: [
        { type: 'blog_heading', text: '#1', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#2', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#3', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#4', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#5', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],
}
