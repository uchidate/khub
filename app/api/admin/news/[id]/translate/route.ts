import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import prisma from '@/lib/prisma'
import { markdownToBlocks } from '@/lib/utils/markdown-to-blocks'
import type { NewsBlock } from '@/lib/types/blocks'

async function translateBlocks(client: OpenAI, title: string, blocks: NewsBlock[]): Promise<{ title: string; blocks: NewsBlock[] }> {
    const textIndices: number[] = []
    const lines: string[] = [`T: ${title}`]

    blocks.forEach((b, i) => {
        if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') {
            textIndices.push(i)
            lines.push(`${textIndices.length}: ${'original' in b ? b.original : ''}`)
        }
    })

    if (textIndices.length === 0) return { title, blocks }

    const prompt = `Translate each numbered line from English to Brazilian Portuguese (pt-BR).
Rules:
- Keep proper names, K-pop terms, drama titles, and artist names in their original form
- Keep markdown links [text](url) intact
- Return ONLY the translated lines in the same numbered format
- Line starting with "T:" is the article title

${lines.join('\n')}`

    const res = await client.chat.completions.create({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens:  4096,
    })

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

    return { title: translatedTitle, blocks: translatedBlocks }
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
    const blocks = markdownToBlocks(source)

    const { title, blocks: translated } = await translateBlocks(deepseek, news.title, blocks)

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
