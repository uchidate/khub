/**
 * POST /api/admin/cms/migrate
 *
 * Endpoint temporário para rodar a migração Prisma → Payload no servidor.
 * Protegido por autenticação admin.
 * Remover após confirmar migração bem-sucedida.
 */

import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { auth } from '@/lib/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import prisma from '@/lib/prisma'
import type { BlogBlock } from '@/lib/types/blocks'

export const maxDuration = 300

export async function POST(request: NextRequest) {
    // Aceita sessão admin OU Bearer PAYLOAD_SECRET (para chamadas server-side)
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '')
    const payloadSecret = process.env.PAYLOAD_SECRET
    const isCronAuth = bearer && payloadSecret && bearer === payloadSecret

    if (!isCronAuth) {
        const session = await auth()
        if (!session || session.user.role?.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body.dry_run === true

    const payload = await getPayload({ config })

    // Push Drizzle schema se tabelas não existem ainda.
    // requireDrizzleKit() no connect.js usa um hash mangled que não existe em prod,
    // então chamamos drizzle-kit/api diretamente com o schema já inicializado.
    if (!dryRun) {
        try {
            const db = payload.db as any
            // webpackIgnore: true → webpack ignora este import; Node.js carrega
            // nativamente pelo caminho absoluto, sem passar pelo __webpack_require__
            // que remapearia 'drizzle-kit' para o hash interno do Payload.
            const apiPath = join(process.cwd(), 'node_modules', 'drizzle-kit', 'api.mjs')
            const { pushSchema } = await import(/* webpackIgnore: true */ apiPath) as { pushSchema: (...args: unknown[]) => Promise<{ apply: () => Promise<void>, warnings: string[] }> }
            const { apply, warnings } = await pushSchema(
                db.schema,
                db.drizzle,
                db.schemaName ? [db.schemaName] : undefined,
            )
            if (warnings.length) console.warn('[migrate] drizzle push warnings:', warnings)
            await apply()
            console.log('[migrate] Drizzle schema pushed OK')
        } catch (pushErr) {
            console.warn('[migrate] pushSchema skipped:', String(pushErr).slice(0, 300))
        }
    }

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

// Tipos de bloco definidos no Payload (payload/blocks/index.ts)
const VALID_BLOCK_TYPES = new Set([
    'blog_heading', 'blog_paragraph', 'blog_quote', 'blog_image', 'blog_gallery',
    'blog_video', 'blog_twitter', 'blog_instagram', 'blog_tiktok',
    'blog_artist_card', 'blog_production_card', 'blog_group_card',
    'blog_stats_row', 'blog_rating', 'blog_divider', 'blog_callout',
])

function buildPayloadBlocks(blocks: BlogBlock[] | null | undefined): object[] {
    if (!blocks || !Array.isArray(blocks)) return []
    const result: object[] = []
    for (const block of blocks) {
        const { type, id: _id, ...rest } = block as { type: string; id?: unknown } & Record<string, unknown>
        const blockType = type

        // Pular tipos não registrados no Payload
        if (!VALID_BLOCK_TYPES.has(blockType)) continue

        if (blockType === 'blog_gallery' && Array.isArray(rest.urls)) {
            rest.urls = (rest.urls as string[]).map((u) => ({ url: u }))
        }
        if (blockType === 'blog_heading' && typeof rest.level === 'number') {
            rest.level = String(rest.level)
        }

        result.push({ blockType, ...rest })
    }
    return result
}
