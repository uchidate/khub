import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'
import { assertBudgetAvailable, getBudgetStatus } from '@/lib/ai/budget-guard'
import {
    generateBlogPostFromNews,
    EDITORIAL_COST_ESTIMATES,
} from '@/lib/ai/generators/editorial-generator'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/news/[id]/generate-blog-post
 * Dry-run: retorna estimativa de custo e status de budget.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const news = await prisma.news.findUnique({
        where: { id },
        select: { title: true, blogPostGeneratedAt: true },
    })

    if (!news) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })

    const budget = await getBudgetStatus('blog_post_generation')

    return NextResponse.json({
        title: news.title,
        hasBlogPost: !!news.blogPostGeneratedAt,
        blogPostGeneratedAt: news.blogPostGeneratedAt,
        estimate: EDITORIAL_COST_ESTIMATES.blog_post_generation,
        budget,
    })
}

/**
 * POST /api/admin/news/[id]/generate-blog-post
 * Gera um blog post a partir desta notícia e salva como DRAFT.
 * Retorna o ID e slug do post criado para navegação direta ao editor.
 */
export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { error, session } = await requireAdmin()
    if (error) return error

    const { id } = await params

    const news = await prisma.news.findUnique({
        where: { id },
        select: {
            title: true,
            contentMd: true,
            source: true,
            tags: true,
            blogPostGeneratedAt: true,
        },
    })

    if (!news) return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 })

    try {
        await assertBudgetAvailable('blog_post_generation')
        const r = await generateBlogPostFromNews(news)

        // Garantir slug único adicionando sufixo se necessário
        const baseSlug = r.slug
        let slug = baseSlug
        const existing = await prisma.blogPost.findUnique({ where: { slug } })
        if (existing) {
            slug = `${baseSlug}-${Date.now().toString(36)}`
        }

        const blogPost = await prisma.blogPost.create({
            data: {
                slug,
                title:          r.title,
                excerpt:        r.excerpt,
                contentMd:      r.contentMd,
                tags:           r.tags,
                readingTimeMin: r.readingTimeMin,
                status:         'DRAFT',
                authorId:       (session!.user as { id: string }).id,
            },
        })

        await prisma.news.update({
            where: { id },
            data: { blogPostGeneratedAt: new Date() },
        })

        return NextResponse.json({
            blogPostId:   blogPost.id,
            blogPostSlug: blogPost.slug,
            title:        blogPost.title,
            totalCostUsd: r.cost,
        })
    } catch (err) {
        return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
    }
}
