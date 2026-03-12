/**
 * Traduz as 10 notícias mais recentes usando Ollama (phi3:mini).
 * Envia TODO o conteúdo de cada artigo em UMA chamada (muito mais rápido).
 *
 * Uso: docker-compose exec hallyuhub npx tsx scripts/translate-recent-news.ts
 */

import OpenAI from 'openai'
import pg from 'pg'
import { markdownToBlocks } from '../lib/utils/markdown-to-blocks'
import type { NewsBlock } from '../lib/types/blocks'

const DB_URL = process.env.DATABASE_URL!
const LIMIT  = 10

const deepseek = new OpenAI({
    apiKey:  process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
})

async function deepseekGenerate(prompt: string): Promise<string> {
    const res = await deepseek.chat.completions.create({
        model:       'deepseek-chat',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens:  4096,
    })
    return res.choices[0]?.message?.content?.trim() ?? ''
}

// ─── Batch translation ────────────────────────────────────────────────────────
// Envia título + todos os textos do artigo em uma única chamada Ollama.
// Formato: linhas numeradas → Ollama retorna linhas numeradas traduzidas.

async function translateArticle(
    title: string,
    blocks: NewsBlock[],
): Promise<{ title: string; blocks: NewsBlock[] }> {

    // Coletar apenas blocos de texto (image/video não precisam de tradução)
    const textIndices: number[] = []
    const lines: string[] = [`T: ${title}`]

    blocks.forEach((b, i) => {
        if (b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote') {
            textIndices.push(i)
            lines.push(`${textIndices.length}: ${b.original}`)
        }
    })

    const prompt = `Translate each numbered line below from English to Brazilian Portuguese (pt-BR).
Rules:
- Keep proper names, K-pop terms, drama titles, and artist names unchanged
- Keep markdown links [text](url) intact
- Return ONLY the translated lines in the same numbered format, nothing else
- Line "T:" is the article title

${lines.join('\n')}`

    const raw = await deepseekGenerate(prompt)

    // Parsear resposta: extrair linha T: e linhas numeradas
    let translatedTitle = title
    const translations = new Map<number, string>()

    for (const line of raw.split('\n')) {
        const titleMatch = line.match(/^T:\s*(.+)/)
        if (titleMatch) { translatedTitle = titleMatch[1].trim(); continue }

        const numMatch = line.match(/^(\d+):\s*(.+)/)
        if (numMatch) {
            translations.set(parseInt(numMatch[1]), numMatch[2].trim())
        }
    }

    // Aplicar traduções de volta aos blocos
    const translated = blocks.map((b, i) => {
        const posInText = textIndices.indexOf(i)
        if (posInText === -1) return b  // image/video — sem tradução
        const t = translations.get(posInText + 1)
        if (!t) return b  // fallback: manter original
        return { ...b, translated: t } as NewsBlock
    })

    return { title: translatedTitle, blocks: translated }
}

// ─── Markdown from blocks (pt-BR) ─────────────────────────────────────────────

function blocksToMarkdown(blocks: NewsBlock[]): string {
    return blocks.map(b => {
        if (b.type === 'heading') return `## ${'translated' in b ? b.translated : b.original}`
        if (b.type === 'paragraph') return 'translated' in b ? b.translated : b.original
        if (b.type === 'quote') return `> ${'translated' in b ? b.translated : b.original}`
        if (b.type === 'image') return `![${b.caption ?? ''}](${b.url})`
        if (b.type === 'video') return `[Vídeo](${b.url})`
        if (b.type === 'twitter_embed') return `[Tweet](${b.url})`
        if (b.type === 'instagram_embed') return `[Instagram](${b.url})`
        return ''
    }).filter(Boolean).join('\n\n')
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const pool = new pg.Pool({ connectionString: DB_URL })

    const { rows } = await pool.query<{
        id: string
        title: string
        original_content: string
    }>(`
        SELECT id, title, COALESCE("originalContent", "contentMd") as original_content
        FROM "News"
        ORDER BY "publishedAt" DESC
        LIMIT $1
    `, [LIMIT])

    console.log(`Traduzindo ${rows.length} artigos com DeepSeek-V3`)
    console.log('(1 chamada por artigo)\n')

    for (let i = 0; i < rows.length; i++) {
        const { id, title, original_content } = rows[i]
        console.log(`[${i + 1}/${rows.length}] ${title.slice(0, 70)}`)

        try {
            const blocks = markdownToBlocks(original_content)
            const textBlockCount = blocks.filter(b =>
                b.type === 'heading' || b.type === 'paragraph' || b.type === 'quote'
            ).length
            console.log(`  → ${blocks.length} blocos (${textBlockCount} de texto)`)

            const { title: newTitle, blocks: translatedBlocks } = await translateArticle(title, blocks)
            const newContentMd = blocksToMarkdown(translatedBlocks)

            await pool.query(`
                UPDATE "News"
                SET
                    title               = $1,
                    "contentMd"         = $2,
                    blocks              = $3::jsonb,
                    "translationStatus" = 'completed',
                    "translatedAt"      = NOW()
                WHERE id = $4
            `, [newTitle, newContentMd, JSON.stringify(translatedBlocks), id])

            console.log(`  ✅ "${newTitle.slice(0, 65)}"`)
        } catch (err) {
            console.error(`  ❌ Erro:`, err instanceof Error ? err.message : err)
        }
    }

    await pool.end()
    console.log('\n✅ Concluído!')
}

main().catch(e => { console.error(e); process.exit(1) })
