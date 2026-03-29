/**
 * scripts/migrate-blog-to-payload.ts
 *
 * Migration Phase 4: Prisma BlogPost + BlogCategory → Payload CMS posts + categories
 *
 * Usage:
 *   npx ts-node --esm scripts/migrate-blog-to-payload.ts [--dry-run]
 *
 * What it does:
 *   1. Reads all BlogCategory rows from Prisma → creates Payload categories (skips existing slugs)
 *   2. Reads all BlogPost rows from Prisma → creates Payload posts with blocks content
 *      - Maps Prisma status (DRAFT/PUBLISHED/ARCHIVED) to Payload status values
 *      - Preserves all block content, tags, dates, cover image, SEO, template
 *      - Sets authorId to the Prisma user ID (string) for traceability
 *   3. Reports counts and errors
 *
 * Safe to run multiple times (idempotent by slug).
 */

import { getPayload } from 'payload'
import config from '../payload.config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
    console.log(`\n🚀 Blog → Payload migration ${DRY_RUN ? '(DRY RUN)' : ''}`)
    console.log('─'.repeat(50))

    const payload = await getPayload({ config })

    // ── 1. Migrate categories ─────────────────────────────────────────────────
    const prismaCategories = await prisma.blogCategory.findMany({
        orderBy: { createdAt: 'asc' },
    })
    console.log(`\n📁 Categories: ${prismaCategories.length} to migrate`)

    const categorySlugToPayloadId = new Map<string, number>()

    for (const cat of prismaCategories) {
        // Check if already exists
        const existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: cat.slug } },
            limit: 1,
        })
        if (existing.docs.length > 0) {
            console.log(`  ↩  [skip] Category "${cat.slug}" already exists (id=${existing.docs[0].id})`)
            categorySlugToPayloadId.set(cat.slug, existing.docs[0].id as number)
            continue
        }
        if (DRY_RUN) {
            console.log(`  ✓  [dry]  Would create category: "${cat.name}" (${cat.slug})`)
            continue
        }
        const created = await payload.create({
            collection: 'categories',
            data: { name: cat.name, slug: cat.slug },
        })
        categorySlugToPayloadId.set(cat.slug, created.id as number)
        console.log(`  ✓  Created category: "${cat.name}" (id=${created.id})`)
    }

    // ── 2. Migrate posts ──────────────────────────────────────────────────────
    const prismaPosts = await prisma.blogPost.findMany({
        include: { category: true },
        orderBy: { createdAt: 'asc' },
    })
    console.log(`\n📝 Posts: ${prismaPosts.length} to migrate`)

    let created = 0
    let skipped = 0
    let errored = 0

    for (const post of prismaPosts) {
        // Check if already exists
        const existing = await payload.find({
            collection: 'posts',
            where: { slug: { equals: post.slug } },
            limit: 1,
        })
        if (existing.docs.length > 0) {
            console.log(`  ↩  [skip] Post "${post.slug}" already exists`)
            skipped++
            continue
        }

        // Build blocks from JSON (already in BlogBlock[] format)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blocks: any[] = buildPayloadBlocks(post.blocks as any[])

        // Build tags array
        const tags = (post.tags ?? []).map((t: string) => ({ tag: t }))

        // Resolve category ID
        const categoryId = post.category
            ? categorySlugToPayloadId.get(post.category.slug)
            : undefined

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

        if (DRY_RUN) {
            console.log(`  ✓  [dry]  Would create post: "${post.slug}" (${blocks.length} blocks)`)
            created++
            continue
        }

        try {
            const result = await payload.create({ collection: 'posts', data })
            console.log(`  ✓  Created post: "${post.slug}" (id=${result.id}, blocks=${blocks.length})`)
            created++
        } catch (err) {
            console.error(`  ✗  Error creating post "${post.slug}":`, err)
            errored++
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(50))
    console.log(`✅ Migration complete${DRY_RUN ? ' (dry run)' : ''}`)
    console.log(`   Categories: ${categorySlugToPayloadId.size} processed`)
    console.log(`   Posts: ${created} created, ${skipped} skipped, ${errored} errors`)

    await prisma.$disconnect()
    process.exit(0)
}

/**
 * Converts a Prisma BlogBlock[] JSON array to Payload blocks format.
 * Payload blocks require a `blockType` discriminator (not `type`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPayloadBlocks(blocks: any[] | null | undefined): any[] {
    if (!blocks || !Array.isArray(blocks)) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return blocks.map((block: any) => {
        const { type, ...rest } = block
        // Map BlogBlock.type (e.g. 'blog_heading') to Payload blockType
        const blockType = type as string

        // Special handling for gallery: flatten urls array of strings → array of {url}
        if (blockType === 'blog_gallery' && Array.isArray(rest.urls)) {
            rest.urls = rest.urls.map((u: string) => ({ url: u }))
        }

        // Special handling for stats_row items (already correct format)
        // Special handling for heading level (store as string in Payload select)
        if (blockType === 'blog_heading' && typeof rest.level === 'number') {
            rest.level = String(rest.level)
        }

        return { blockType, ...rest }
    })
}

main().catch((err) => {
    console.error('Migration failed:', err)
    process.exit(1)
})
