import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getOrchestrator } from '@/lib/ai/orchestrator-factory'

export const dynamic = 'force-dynamic'

// Returns count of posts without excerpts
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    const count = await prisma.blogPost.count({
        where: {
            status: 'PUBLISHED',
            isPrivate: false,
            OR: [{ excerpt: null }, { excerpt: '' }],
        },
    })
    return NextResponse.json({ pending: count })
}

// Enriches up to `batch` posts (default 5) without excerpts
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const batch = Math.min(20, Math.max(1, Number(body?.batch ?? 5)))

    const posts = await prisma.blogPost.findMany({
        where: {
            status: 'PUBLISHED',
            isPrivate: false,
            OR: [{ excerpt: null }, { excerpt: '' }],
        },
        select: { id: true, title: true, blocks: true },
        orderBy: { publishedAt: 'desc' },
        take: batch,
    })

    if (posts.length === 0) {
        return NextResponse.json({ processed: 0, message: 'Nenhum post sem excerpt encontrado.' })
    }

    const orchestrator = getOrchestrator()
    const results: { id: string; title: string; status: 'ok' | 'error'; excerpt?: string }[] = []

    for (const post of posts) {
        try {
            // Extract plain text from blocks for context
            const blocks = (post.blocks ?? []) as Array<{ type: string; text?: string; items?: string[] }>
            const textSnippet = blocks
                .filter(b => b.type === 'blog_paragraph' || b.type === 'blog_heading')
                .map(b => b.text ?? '')
                .join(' ')
                .slice(0, 600)

            const prompt = `Você é um editor de conteúdo de K-Pop e K-Drama. Escreva um excerpt (meta description) conciso para o artigo abaixo.

Regras:
- Entre 120 e 155 caracteres
- Em português brasileiro
- Não começar com "Neste artigo" ou "Este post"
- Direto ao ponto, mencione o tema central
- Sem aspas na resposta

Título: "${post.title}"
Trecho do conteúdo: "${textSnippet}"

Retorne apenas o texto do excerpt, sem mais nada.`

            const result = await orchestrator.generate(prompt, {
                feature: 'blog_post_generation',
                maxTokens: 200,
            })

            const excerpt = result.content.trim().replace(/^["']|["']$/g, '').slice(0, 160)

            await prisma.blogPost.update({
                where: { id: post.id },
                data: { excerpt },
            })

            results.push({ id: post.id, title: post.title, status: 'ok', excerpt })
        } catch (err) {
            results.push({ id: post.id, title: post.title, status: 'error' })
            console.error(`Excerpt enrichment failed for ${post.id}:`, err)
        }
    }

    return NextResponse.json({
        processed: results.filter(r => r.status === 'ok').length,
        failed: results.filter(r => r.status === 'error').length,
        results,
    })
}
