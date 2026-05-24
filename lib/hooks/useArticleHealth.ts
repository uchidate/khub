import { useState, useEffect, useRef } from 'react'
import type { BlogBlock } from '@/lib/types/blocks'

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface ArticleIssue {
    id: string
    severity: IssueSeverity
    title: string
    detail?: string
    field?: 'title' | 'excerpt' | 'cover' | 'category' | 'tags' | 'blocks' | 'seo'
    blockIndex?: number
}

interface HealthInput {
    title: string
    excerpt: string
    coverImageUrl: string
    categoryId: string | null
    tags: string[]
    blocks: BlogBlock[]
    focusKeyword: string
    wordCount: number
}

// Extract image URLs from blocks
function extractImageUrls(blocks: BlogBlock[]): { url: string; blockIndex: number }[] {
    const refs: { url: string; blockIndex: number }[] = []
    blocks.forEach((block, i) => {
        if (block.type === 'blog_image' && block.url) refs.push({ url: block.url, blockIndex: i })
        if (block.type === 'blog_gallery' && block.urls) {
            block.urls.forEach(url => { if (url) refs.push({ url, blockIndex: i }) })
        }
    })
    return refs
}

// Extract YouTube video IDs
function extractVideoIds(blocks: BlogBlock[]): { id: string; blockIndex: number }[] {
    const refs: { id: string; blockIndex: number }[] = []
    const re = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    blocks.forEach((block, i) => {
        if (block.type === 'blog_video' && block.url) {
            const m = block.url.match(re)
            if (m) refs.push({ id: m[1], blockIndex: i })
        }
    })
    return refs
}

// Sync validation — runs on every change
function getStaticIssues(input: HealthInput): ArticleIssue[] {
    const issues: ArticleIssue[] = []

    if (!input.title.trim()) {
        issues.push({ id: 'no-title', severity: 'error', title: 'Título obrigatório', field: 'title' })
    } else if (input.title.trim().length < 20) {
        issues.push({ id: 'short-title', severity: 'warning', title: 'Título muito curto', detail: `${input.title.trim().length} chars — ideal: 40–60`, field: 'title' })
    }

    if (!input.excerpt.trim()) {
        issues.push({ id: 'no-excerpt', severity: 'warning', title: 'Sem resumo', detail: 'Aparece no Google e na listagem', field: 'excerpt' })
    } else if (input.excerpt.length < 120) {
        issues.push({ id: 'short-excerpt', severity: 'warning', title: 'Resumo curto', detail: `${input.excerpt.length} chars — ideal: 120–160 para SEO`, field: 'excerpt' })
    } else if (input.excerpt.length > 160) {
        issues.push({ id: 'long-excerpt', severity: 'info', title: 'Resumo longo', detail: `${input.excerpt.length} chars — Google trunca em 160`, field: 'excerpt' })
    }

    if (!input.coverImageUrl.trim()) {
        issues.push({ id: 'no-cover', severity: 'warning', title: 'Sem imagem de capa', field: 'cover' })
    }

    if (!input.categoryId) {
        issues.push({ id: 'no-category', severity: 'warning', title: 'Sem categoria', field: 'category' })
    }

    if (input.tags.length === 0) {
        issues.push({ id: 'no-tags', severity: 'info', title: 'Sem tags', detail: 'Tags melhoram a descoberta interna', field: 'tags' })
    }

    if (input.focusKeyword && input.title && !input.title.toLowerCase().includes(input.focusKeyword.toLowerCase())) {
        issues.push({ id: 'keyword-not-in-title', severity: 'warning', title: 'Keyword ausente no título', detail: `"${input.focusKeyword}" não está no título`, field: 'seo' })
    }

    if (input.wordCount > 0 && input.wordCount < 300) {
        issues.push({ id: 'short-article', severity: 'info', title: 'Artigo muito curto', detail: `${input.wordCount} palavras — ideal: 600+`, field: 'blocks' })
    }

    // Block-level issues
    const headings = input.blocks.filter(b => b.type === 'blog_heading')
    if (input.wordCount > 400 && headings.length === 0) {
        issues.push({ id: 'no-headings', severity: 'info', title: 'Sem subtítulos (H2/H3)', detail: 'Facilita leitura e SEO', field: 'blocks' })
    }

    input.blocks.forEach((block, i) => {
        if (block.type === 'blog_image' && !block.url) {
            issues.push({ id: `img-no-url-${i}`, severity: 'error', title: 'Imagem sem URL', detail: `Bloco ${i + 1}`, field: 'blocks', blockIndex: i })
        }
        if (block.type === 'blog_video' && block.url) {
            const re = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
            if (!block.url.match(re)) {
                issues.push({ id: `video-invalid-${i}`, severity: 'error', title: 'URL de vídeo inválida', detail: `Bloco ${i + 1} — use youtube.com ou youtu.be`, field: 'blocks', blockIndex: i })
            }
        }
        if (block.type === 'blog_paragraph' && 'text' in block && !(block as { text: string }).text?.trim()) {
            issues.push({ id: `empty-para-${i}`, severity: 'warning', title: 'Parágrafo vazio', detail: `Bloco ${i + 1}`, field: 'blocks', blockIndex: i })
        }
    })

    return issues
}

// Async image check with cache to avoid re-fetching
const urlCache = new Map<string, 'ok' | 'broken'>()

async function checkImageUrl(url: string): Promise<'ok' | 'broken'> {
    if (urlCache.has(url)) return urlCache.get(url)!
    try {
        const res = await fetch(`/api/admin/image-audit/check?url=${encodeURIComponent(url)}`, {
            signal: AbortSignal.timeout(6000),
        })
        const result = res.ok ? 'ok' : 'broken'
        urlCache.set(url, result)
        return result
    } catch {
        return 'broken'
    }
}

export function useArticleHealth(input: HealthInput) {
    const [staticIssues, setStaticIssues] = useState<ArticleIssue[]>([])
    const [asyncIssues, setAsyncIssues] = useState<ArticleIssue[]>([])
    const [checking, setChecking] = useState(false)
    const asyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sync issues — immediate
    useEffect(() => {
        setStaticIssues(getStaticIssues(input))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input.title, input.excerpt, input.coverImageUrl, input.categoryId, input.tags.join(','), input.focusKeyword, input.wordCount, input.blocks])

    // Async checks — debounced 2s
    useEffect(() => {
        if (asyncTimer.current) clearTimeout(asyncTimer.current)
        asyncTimer.current = setTimeout(async () => {
            const imageRefs = extractImageUrls(input.blocks)
            const videoRefs = extractVideoIds(input.blocks)
            if (imageRefs.length === 0 && videoRefs.length === 0) { setAsyncIssues([]); return }

            setChecking(true)
            const newAsync: ArticleIssue[] = []

            await Promise.all([
                ...imageRefs.map(async ({ url, blockIndex }) => {
                    const result = await checkImageUrl(url)
                    if (result === 'broken') {
                        newAsync.push({
                            id: `broken-img-${blockIndex}`,
                            severity: 'error',
                            title: 'Imagem quebrada (404)',
                            detail: url.length > 50 ? `...${url.slice(-45)}` : url,
                            field: 'blocks',
                            blockIndex,
                        })
                    }
                }),
                ...videoRefs.map(async ({ id, blockIndex }) => {
                    const cacheKey = `yt:${id}`
                    if (!urlCache.has(cacheKey)) {
                        try {
                            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
                                signal: AbortSignal.timeout(5000),
                            })
                            urlCache.set(cacheKey, res.ok ? 'ok' : 'broken')
                        } catch {
                            urlCache.set(cacheKey, 'broken')
                        }
                    }
                    if (urlCache.get(cacheKey) === 'broken') {
                        newAsync.push({
                            id: `broken-video-${blockIndex}`,
                            severity: 'error',
                            title: 'Vídeo sem embed disponível',
                            detail: `youtube.com/watch?v=${id}`,
                            field: 'blocks',
                            blockIndex,
                        })
                    }
                }),
            ])

            setAsyncIssues(newAsync)
            setChecking(false)
        }, 2000)
        return () => { if (asyncTimer.current) clearTimeout(asyncTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input.blocks])

    const allIssues = [...staticIssues, ...asyncIssues]
    const errors   = allIssues.filter(i => i.severity === 'error').length
    const warnings = allIssues.filter(i => i.severity === 'warning').length

    return { issues: allIssues, errors, warnings, checking }
}
