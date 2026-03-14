import type { NewsBlock } from '@/lib/types/blocks'

/**
 * Converte o Markdown de um artigo importado em NewsBlock[].
 *
 * - Para blocos de texto: `original` = `translated` = conteúdo original.
 *   O editor só precisa sobrescrever `translated` onde quiser.
 * - Imagens: extraídas inline do markdown (![alt](url))
 * - YouTube: [![](thumbnail)](youtube-url) → VideoBlock
 */
export function markdownToBlocks(markdown: string): NewsBlock[] {
    const blocks: NewsBlock[] = []

    const chunks = markdown
        .split(/\n\n+/)
        .map(c => c.trim())
        .filter(Boolean)

    for (const chunk of chunks) {
        // Heading: # / ## / ###
        const headingMatch = chunk.match(/^#{1,3}\s+(.+)$/)
        if (headingMatch) {
            const text = headingMatch[1].trim()
            blocks.push({ type: 'heading', original: text, translated: text })
            continue
        }

        // Image: ![alt](url)  (sozinha no chunk)
        const imageMatch = chunk.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
        if (imageMatch) {
            blocks.push({ type: 'image', url: imageMatch[2], caption: imageMatch[1] || undefined })
            continue
        }

        // YouTube: [![](thumbnail)](https://www.youtube.com/watch?v=...)
        const videoMatch = chunk.match(/^\[!\[\]\([^)]+\)\]\((https:\/\/(?:www\.)?youtube\.com\/[^)]+)\)$/)
        if (videoMatch) {
            blocks.push({ type: 'video', url: videoMatch[1] })
            continue
        }

        // YouTube bare URL or [text](youtube-url)
        const youtubeUrl = chunk.match(/^(?:\[([^\]]*)\]\()?(https?:\/\/(?:www\.)?(?:youtube\.com\/watch[^\s)]+|youtu\.be\/[^\s)]+))\)?$/)
        if (youtubeUrl) {
            blocks.push({ type: 'video', url: youtubeUrl[2] })
            continue
        }

        // Twitter/X embed — bare URL or [text](url)
        const twitterUrl = chunk.match(/^(?:\[([^\]]*)\]\()?(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s)]+)\)?$/)
        if (twitterUrl) {
            blocks.push({ type: 'twitter_embed', url: twitterUrl[2] })
            continue
        }

        // Instagram embed — bare URL or [text](url)
        const instagramUrl = chunk.match(/^(?:\[([^\]]*)\]\()?(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[^\s/)]+\/?)\)?$/)
        if (instagramUrl) {
            blocks.push({ type: 'instagram_embed', url: instagramUrl[2] })
            continue
        }

        // TikTok embed — bare URL or [text](url)
        const tiktokUrl = chunk.match(/^(?:\[([^\]]*)\]\()?(https?:\/\/(?:www\.)?(?:tiktok\.com|vm\.tiktok\.com)\/[^\s)]+)\)?$/)
        if (tiktokUrl) {
            blocks.push({ type: 'tiktok_embed', url: tiktokUrl[2] })
            continue
        }

        // Blockquote: > text
        const quoteMatch = chunk.match(/^>\s+([\s\S]+)$/)
        if (quoteMatch) {
            const text = quoteMatch[1].replace(/\n>\s*/g, '\n').trim()
            blocks.push({ type: 'quote', original: text, translated: text })
            continue
        }

        // Paragraph — ignora fragmentos muito curtos (artefatos de formatação)
        if (chunk.length >= 15) {
            blocks.push({ type: 'paragraph', original: chunk, translated: chunk })
        }
    }

    return blocks
}
