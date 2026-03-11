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
    | VideoBlock

export type NewsBlockType = NewsBlock['type']

export const BLOCK_TYPE_LABELS: Record<NewsBlockType, string> = {
    heading: 'Título',
    paragraph: 'Parágrafo',
    quote: 'Citação',
    image: 'Imagem',
    twitter_embed: 'Tweet',
    instagram_embed: 'Instagram',
    video: 'Vídeo',
}

export const TEXT_BLOCK_TYPES: NewsBlockType[] = ['heading', 'paragraph', 'quote']
export const MEDIA_BLOCK_TYPES: NewsBlockType[] = ['image', 'twitter_embed', 'instagram_embed', 'video']

export function isTextBlock(block: NewsBlock): block is HeadingBlock | ParagraphBlock | QuoteBlock {
    return TEXT_BLOCK_TYPES.includes(block.type)
}
