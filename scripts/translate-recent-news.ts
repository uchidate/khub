/**
 * Traduz as 10 notícias mais recentes usando Ollama (llama3:8b).
 * Popula blocks[] com original + translated, atualiza title e contentMd em pt-BR.
 *
 * Uso: docker-compose exec hallyuhub npx tsx scripts/translate-recent-news.ts
 */

import pg from 'pg'
import { markdownToBlocks } from '../lib/utils/markdown-to-blocks'
import type { NewsBlock } from '../lib/types/blocks'

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
const DB_URL     = process.env.DATABASE_URL!
const LIMIT      = 10

// ─── Ollama ───────────────────────────────────────────────────────────────────

async function translate(text: string): Promise<string> {
    if (!text.trim()) return text

    const prompt = `Traduza o texto abaixo do inglês para o português do Brasil (pt-BR).
Mantenha nomes próprios, termos K-pop, títulos de dramas e artistas em seu formato original.
Mantenha links markdown ([texto](url)) intactos.
Retorne APENAS o texto traduzido, sem explicações, sem aspas, sem prefixos.

Texto:
${text}`

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'phi3:mini',
            prompt,
            stream: false,
            options: { temperature: 0.3 },
        }),
        signal: AbortSignal.timeout(120_000),
    })

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json() as { response: string }
    return data.response.trim()
}

async function translateTitle(title: string): Promise<string> {
    const prompt = `Traduza o título abaixo do inglês para o português do Brasil (pt-BR).
Mantenha nomes próprios, termos K-pop, títulos de dramas e artistas em seu formato original.
Use linguagem jornalística natural.
Retorne APENAS o título traduzido, sem explicações ou aspas.

Título: ${title}`

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'phi3:mini',
            prompt,
            stream: false,
            options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(60_000),
    })

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`)
    const data = await res.json() as { response: string }
    return data.response.trim()
}

// ─── Block translation ─────────────────────────────────────────────────────────

async function translateBlocks(blocks: NewsBlock[]): Promise<NewsBlock[]> {
    const result: NewsBlock[] = []
    for (const block of blocks) {
        if (block.type === 'image' || block.type === 'video' ||
            block.type === 'twitter_embed' || block.type === 'instagram_embed') {
            result.push(block)
            continue
        }
        const translated = await translate(block.original)
        result.push({ ...block, translated })
    }
    return result
}

// ─── Markdown from blocks to pt-BR string ─────────────────────────────────────

function blocksToMarkdown(blocks: NewsBlock[]): string {
    return blocks.map(block => {
        if (block.type === 'heading') return `## ${block.translated}`
        if (block.type === 'paragraph') return block.translated
        if (block.type === 'quote') return `> ${block.translated}`
        if (block.type === 'image') return `![${block.caption ?? ''}](${block.url})`
        if (block.type === 'video') return `[Vídeo](${block.url})`
        if (block.type === 'twitter_embed') return `[Tweet](${block.url})`
        if (block.type === 'instagram_embed') return `[Instagram](${block.url})`
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

    console.log(`Traduzindo ${rows.length} artigos com Ollama (${OLLAMA_URL})...`)

    for (let i = 0; i < rows.length; i++) {
        const { id, title, original_content } = rows[i]
        console.log(`\n[${i + 1}/${rows.length}] ${title.slice(0, 70)}`)

        try {
            const blocks = markdownToBlocks(original_content)
            console.log(`  → ${blocks.length} blocos`)

            console.log('  → Traduzindo título...')
            const newTitle = await translateTitle(title)

            console.log('  → Traduzindo blocos...')
            const translatedBlocks = await translateBlocks(blocks)

            const newContentMd = blocksToMarkdown(translatedBlocks)

            await pool.query(`
                UPDATE "News"
                SET
                    title             = $1,
                    "contentMd"       = $2,
                    blocks            = $3::jsonb,
                    "translationStatus" = 'completed',
                    "translatedAt"    = NOW()
                WHERE id = $4
            `, [newTitle, newContentMd, JSON.stringify(translatedBlocks), id])

            console.log(`  ✅ "${newTitle.slice(0, 60)}"`)
        } catch (err) {
            console.error(`  ❌ Erro:`, err instanceof Error ? err.message : err)
        }
    }

    await pool.end()
    console.log('\n✅ Concluído!')
}

main().catch(e => { console.error(e); process.exit(1) })
