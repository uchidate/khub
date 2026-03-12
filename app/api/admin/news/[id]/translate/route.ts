import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks'
import { logAiUsage } from '@/lib/ai/ai-usage-logger'
import type { NewsBlock } from '@/lib/types/blocks'

const MEDIA_DOMAINS = /\b(youtube\.com|youtu\.be|twitter\.com|x\.com|instagram\.com|tiktok\.com|facebook\.com|spotify\.com|soundcloud\.com|weverse\.io|vlive\.tv|naver\.com|youku\.com|bilibili\.com)\b/i

/**
 * Strip markdown links that point to external article/profile pages.
 * Keeps links to social/media platforms (Twitter, Instagram, YouTube, etc.)
 * and image URLs (jpg, png, gif, webp).
 */
function stripExternalLinks(text: string): string {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        if (MEDIA_DOMAINS.test(url)) return match   // keep social/media links
        if (/\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(url)) return match  // keep image links
        return label  // strip article/profile links → plain text
    })
}

async function translateBlocks(client: OpenAI, title: string, blocks: NewsBlock[]): Promise<{ title: string; blocks: NewsBlock[]; tokensIn: number; tokensOut: number; cost: number }> {
    const textIndices: number[] = []
    const lines: string[] = [`T: ${title}`]

    blocks.forEach((b, i) => {
        if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') {
            textIndices.push(i)
            const text = 'original' in b ? b.original : ''
            lines.push(`${textIndices.length}: ${stripExternalLinks(text)}`)
        }
    })

    if (textIndices.length === 0) return { title, blocks, tokensIn: 0, tokensOut: 0, cost: 0 }

    const prompt = `Translate each numbered line from English to Brazilian Portuguese (pt-BR).
Rules:
- Keep proper names, K-pop terms, drama titles, and artist names in their original form
- Do NOT include any markdown links or URLs in your output — plain text only
- Return ONLY the translated lines in the same numbered format
- Line starting with "T:" is the article title

${lines.join('\n')}`

    const res = await client.chat.completions.create({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens:  4096,
    })

    const tokensIn  = res.usage?.prompt_tokens     ?? 0
    const tokensOut = res.usage?.completion_tokens ?? 0
    // DeepSeek-V3: $0.27/MTok input, $1.10/MTok output
    const cost = (tokensIn * 0.00000027) + (tokensOut * 0.0000011)

    const raw = res.choices[0]?.message?.content ?? ''
    let translatedTitle = title
    const translations = new Map<number, string>()

    for (const line of raw.split('\n')) {
        const t = line.match(/^T:\s*(.+)/)
        if (t) { translatedTitle = t[1].trim(); continue }
        const n = line.match(/^(\d+):\s*(.+)/)
        if (n) translations.set(parseInt(n[1]), n[2].trim())
    }

    const translatedBlocks = blocks.map((b, i) => {
        const pos = textIndices.indexOf(i)
        if (pos === -1) return b
        const t = translations.get(pos + 1)
        return t ? { ...b, translated: t } as NewsBlock : b
    })

    return { title: translatedTitle, blocks: translatedBlocks, tokensIn, tokensOut, cost }
}

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    if (!process.env.DEEPSEEK_API_KEY) {
        return NextResponse.json({ error: 'DEEPSEEK_API_KEY não configurada' }, { status: 503 })
    }

    const deepseek = new OpenAI({
        apiKey:  process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com',
    })

    const news = await prisma.news.findUnique({
        where:  { id },
        select: { id: true, title: true, originalContent: true, contentMd: true },
    })

    if (!news) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })

    const source = news.originalContent || news.contentMd
    const rawBlocks = markdownToBlocks(source)
    // Strip external links from original text (links to other sites, e.g. soompi.com/artist/...)
    const blocks = rawBlocks.map(b => {
        if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') {
            const clean = stripExternalLinks(b.original)
            return { ...b, original: clean, translated: clean }
        }
        return b
    }) as NewsBlock[]

    const t0 = Date.now()
    let translateResult: Awaited<ReturnType<typeof translateBlocks>>
    try {
        translateResult = await translateBlocks(deepseek, news.title, blocks)
        logAiUsage({
            provider:   'deepseek',
            model:      'deepseek-chat',
            feature:    'news_translation',
            tokensIn:   translateResult.tokensIn,
            tokensOut:  translateResult.tokensOut,
            cost:       translateResult.cost,
            durationMs: Date.now() - t0,
            status:     'success',
        })
    } catch (err: unknown) {
        logAiUsage({
            provider:   'deepseek',
            model:      'deepseek-chat',
            feature:    'news_translation',
            durationMs: Date.now() - t0,
            status:     'error',
            errorMsg:   err instanceof Error ? err.message : String(err),
        })
        throw err
    }
    const { title, blocks: translated } = translateResult

    const contentMd = translated.map(b => {
        if (b.type === 'heading')        return `## ${b.translated}`
        if (b.type === 'paragraph')      return b.translated
        if (b.type === 'quote')          return `> ${b.translated}`
        if (b.type === 'image')          return `![${b.caption ?? ''}](${b.url})`
        if (b.type === 'video')          return `[Vídeo](${b.url})`
        if (b.type === 'twitter_embed')  return `[Tweet](${b.url})`
        if (b.type === 'instagram_embed') return `[Instagram](${b.url})`
        return ''
    }).filter(Boolean).join('\n\n')

    await prisma.news.update({
        where: { id },
        data: {
            title,
            contentMd,
            blocks:            translated as object[],
            translationStatus: 'completed',
            translatedAt:      new Date(),
        },
    })

    return NextResponse.json({ title, blocks: translated })
}
