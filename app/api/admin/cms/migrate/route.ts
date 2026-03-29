/**
 * POST /api/admin/cms/migrate
 *
 * Endpoint temporário para rodar a migração Prisma → Payload no servidor.
 * Protegido por autenticação admin.
 * Remover após confirmar migração bem-sucedida.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import prisma from '@/lib/prisma'
import type { BlogBlock } from '@/lib/types/blocks'

export const maxDuration = 300

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session || session.user.role?.toLowerCase() !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dry_run === true

    const payload = await getPayload({ config })

    const results = {
        categories: { created: 0, skipped: 0 },
        posts:      { created: 0, skipped: 0, errors: 0 },
        errors:     [] as string[],
    }

    // ── 1. Migrate categories ─────────────────────────────────────────────────
    const prismaCategories = await prisma.blogCategory.findMany({ orderBy: { createdAt: 'asc' } })
    const categorySlugToPayloadId = new Map<string, number>()

    for (const cat of prismaCategories) {
        const existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: cat.slug } },
            limit: 1,
        })
        if (existing.docs.length > 0) {
            categorySlugToPayloadId.set(cat.slug, existing.docs[0].id as number)
            results.categories.skipped++
            continue
        }
        if (!dryRun) {
            const created = await payload.create({
                collection: 'categories',
                data: { name: cat.name, slug: cat.slug },
            })
            categorySlugToPayloadId.set(cat.slug, created.id as number)
        }
        results.categories.created++
    }

    // ── 2. Migrate posts ──────────────────────────────────────────────────────
    const prismaPosts = await prisma.blogPost.findMany({
        include: { category: true },
        orderBy: { createdAt: 'asc' },
    })

    for (const post of prismaPosts) {
        const existing = await payload.find({
            collection: 'posts',
            where: { slug: { equals: post.slug } },
            limit: 1,
        })
        if (existing.docs.length > 0) {
            results.posts.skipped++
            continue
        }

        const blocks = buildPayloadBlocks(post.blocks as BlogBlock[] | null)
        const tags = (post.tags ?? []).map((t: string) => ({ tag: t }))
        const categoryId = post.category ? categorySlugToPayloadId.get(post.category.slug) : undefined

        const data = {
            title:          post.title,
            slug:           post.slug,
            excerpt:        post.excerpt ?? undefined,
            coverImageUrl:  post.coverImageUrl ?? undefined,
            status:         post.status,
            publishedAt:    post.publishedAt?.toISOString() ?? undefined,
            scheduledAt:    post.scheduledAt?.toISOString() ?? undefined,
            template:       post.template ?? undefined,
            featured:       post.featured,
            isPrivate:      post.isPrivate,
            authorId:       post.authorId,
            viewCount:      post.viewCount,
            readingTimeMin: post.readingTimeMin,
            tags,
            blocks,
            ...(categoryId ? { category: categoryId } : {}),
        }

        if (!dryRun) {
            try {
                await payload.create({ collection: 'posts', data })
                results.posts.created++
            } catch (err) {
                results.posts.errors++
                results.errors.push(`${post.slug}: ${String(err).slice(0, 200)}`)
            }
        } else {
            results.posts.created++
        }
    }

    return NextResponse.json({
        dry_run: dryRun,
        results,
        message: dryRun
            ? 'Dry run completo — nenhum dado gravado'
            : `Migração concluída: ${results.posts.created} posts, ${results.categories.created} categorias criadas`,
    })
}

function buildPayloadBlocks(blocks: BlogBlock[] | null | undefined): object[] {
    if (!blocks || !Array.isArray(blocks)) return []
    return blocks.map((block) => {
        const { type, ...rest } = block as { type: string } & Record<string, unknown>
        const blockType = type

        if (blockType === 'blog_gallery' && Array.isArray(rest.urls)) {
            rest.urls = (rest.urls as string[]).map((u) => ({ url: u }))
        }
        if (blockType === 'blog_heading' && typeof rest.level === 'number') {
            rest.level = String(rest.level)
        }

        return { blockType, ...rest }
    })
}
