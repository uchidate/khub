import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const log = createLogger('ADMIN-TAGS')

/** Normalize a tag for duplicate detection (lowercase, remove spaces/hyphens/underscores) */
function normalize(tag: string): string {
    return tag.toLowerCase().replace(/[\s\-_]/g, '')
}

/** Find groups of tags that normalize to the same string (probable duplicates) */
function findDuplicateGroups(tags: string[]): string[][] {
    const normMap = new Map<string, string[]>()
    for (const tag of tags) {
        const key = normalize(tag)
        const group = normMap.get(key) ?? []
        group.push(tag)
        normMap.set(key, group)
    }
    return Array.from(normMap.values()).filter(g => g.length > 1)
}

/**
 * GET /api/admin/tags
 * Returns all unique tags across News, Productions, BlogPost, StoreProduct with usage counts.
 *
 * ?tag=<name> — returns content list for that specific tag (click-through)
 */
export async function GET(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const tagFilter = searchParams.get('tag')

    // ── Click-through: list content using a specific tag ──────────────────────
    if (tagFilter) {
        try {
            const [news, productions, blogPosts, storeProducts] = await Promise.all([
                prisma.news.findMany({
                    where: { tags: { has: tagFilter } },
                    select: { id: true, title: true, slug: true },
                    take: 50,
                }),
                prisma.production.findMany({
                    where: { tags: { has: tagFilter } },
                    select: { id: true, title: true, slug: true },
                    take: 50,
                }),
                prisma.blogPost.findMany({
                    where: { tags: { has: tagFilter } },
                    select: { id: true, title: true, slug: true },
                    take: 50,
                }),
                prisma.storeProduct.findMany({
                    where: { tags: { has: tagFilter } },
                    select: { id: true, name: true },
                    take: 50,
                }),
            ])
            return NextResponse.json({ news, productions, blogPosts, storeProducts })
        } catch (error) {
            log.error('Error fetching tag content', { error: getErrorMessage(error) })
            return NextResponse.json({ error: 'Erro ao buscar conteúdos da tag' }, { status: 500 })
        }
    }

    // ── Full tag list ─────────────────────────────────────────────────────────
    try {
        const [newsList, productions, blogPosts, storeProducts] = await Promise.all([
            prisma.news.findMany({ select: { tags: true } }),
            prisma.production.findMany({ select: { tags: true } }),
            prisma.blogPost.findMany({ select: { tags: true } }),
            prisma.storeProduct.findMany({ select: { tags: true } }),
        ])

        const tagMap = new Map<string, {
            newsCount: number
            productionCount: number
            blogCount: number
            storeCount: number
        }>()

        const bump = (tag: string, field: 'newsCount' | 'productionCount' | 'blogCount' | 'storeCount') => {
            const t = tag.trim()
            if (!t) return
            const entry = tagMap.get(t) ?? { newsCount: 0, productionCount: 0, blogCount: 0, storeCount: 0 }
            entry[field]++
            tagMap.set(t, entry)
        }

        for (const n of newsList) for (const tag of n.tags) bump(tag, 'newsCount')
        for (const p of productions) for (const tag of p.tags) bump(tag, 'productionCount')
        for (const b of blogPosts) for (const tag of b.tags) bump(tag, 'blogCount')
        for (const s of storeProducts) for (const tag of s.tags) bump(tag, 'storeCount')

        const tags = Array.from(tagMap.entries())
            .map(([tag, counts]) => ({
                tag,
                newsCount: counts.newsCount,
                productionCount: counts.productionCount,
                blogCount: counts.blogCount,
                storeCount: counts.storeCount,
                total: counts.newsCount + counts.productionCount + counts.blogCount + counts.storeCount,
            }))
            .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))

        const duplicateGroups = findDuplicateGroups(Array.from(tagMap.keys()))

        return NextResponse.json({ tags, total: tags.length, duplicateGroups })
    } catch (error) {
        log.error('Error fetching tags', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 })
    }
}

const renameSchema = z.object({
    oldTag: z.string().min(1),
    newTag: z.string().min(1),
    merge: z.boolean().optional().default(false),
})

/**
 * PATCH /api/admin/tags
 * Rename (or merge) a tag across News, Productions, BlogPost, StoreProduct.
 */
export async function PATCH(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { oldTag, newTag, merge } = renameSchema.parse(body)

        if (oldTag === newTag) {
            return NextResponse.json({ error: 'Tag nova deve ser diferente da atual' }, { status: 400 })
        }

        const [targetNews, targetProd, targetBlog, targetStore] = await Promise.all([
            prisma.news.count({ where: { tags: { has: newTag } } }).catch(() => 0),
            prisma.production.count({ where: { tags: { has: newTag } } }).catch(() => 0),
            prisma.blogPost.count({ where: { tags: { has: newTag } } }).catch(() => 0),
            prisma.storeProduct.count({ where: { tags: { has: newTag } } }).catch(() => 0),
        ])

        if ((targetNews + targetProd + targetBlog + targetStore > 0) && !merge) {
            return NextResponse.json({
                error: `Tag "${newTag}" já existe. Use merge: true para mesclar.`,
                conflict: true,
            }, { status: 409 })
        }

        const [newsToUpdate, prodsToUpdate, blogsToUpdate, storesToUpdate] = await Promise.all([
            prisma.news.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
            prisma.production.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
            prisma.blogPost.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
            prisma.storeProduct.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
        ])

        const remap = (tags: string[]) => Array.from(new Set(tags.map(t => t === oldTag ? newTag : t)))

        await prisma.$transaction(async (tx) => {
            for (const n of newsToUpdate) await tx.news.update({ where: { id: n.id }, data: { tags: remap(n.tags) } })
            for (const p of prodsToUpdate) await tx.production.update({ where: { id: p.id }, data: { tags: remap(p.tags) } })
            for (const b of blogsToUpdate) await tx.blogPost.update({ where: { id: b.id }, data: { tags: remap(b.tags) } })
            for (const s of storesToUpdate) await tx.storeProduct.update({ where: { id: s.id }, data: { tags: remap(s.tags) } })
        })

        log.info(merge ? 'Tag merged' : 'Tag renamed', {
            oldTag, newTag,
            newsUpdated: newsToUpdate.length,
            prodsUpdated: prodsToUpdate.length,
            blogsUpdated: blogsToUpdate.length,
            storesUpdated: storesToUpdate.length,
        })

        return NextResponse.json({
            message: merge ? `Tag "${oldTag}" mesclada em "${newTag}"` : `Tag "${oldTag}" renomeada para "${newTag}"`,
            newsUpdated: newsToUpdate.length,
            productionsUpdated: prodsToUpdate.length,
            blogsUpdated: blogsToUpdate.length,
            storesUpdated: storesToUpdate.length,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Error renaming tag', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao renomear tag' }, { status: 500 })
    }
}

const deleteSchema = z.object({
    tag: z.string().min(1).optional(),
    tags: z.array(z.string().min(1)).optional(),
}).refine(d => d.tag || (d.tags && d.tags.length > 0), { message: 'Forneça tag ou tags' })

/**
 * DELETE /api/admin/tags
 * Remove a tag (or multiple tags) from all content.
 * Body: { tag: string } OR { tags: string[] } (bulk)
 */
export async function DELETE(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const parsed = deleteSchema.parse(body)
        const tagsToDelete = parsed.tags ?? [parsed.tag!]

        let totalNews = 0, totalProds = 0, totalBlogs = 0, totalStores = 0

        for (const tag of tagsToDelete) {
            const [newsToUpdate, prodsToUpdate, blogsToUpdate, storesToUpdate] = await Promise.all([
                prisma.news.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
                prisma.production.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
                prisma.blogPost.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
                prisma.storeProduct.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
            ])

            await prisma.$transaction(async (tx) => {
                for (const n of newsToUpdate) await tx.news.update({ where: { id: n.id }, data: { tags: n.tags.filter(t => t !== tag) } })
                for (const p of prodsToUpdate) await tx.production.update({ where: { id: p.id }, data: { tags: p.tags.filter(t => t !== tag) } })
                for (const b of blogsToUpdate) await tx.blogPost.update({ where: { id: b.id }, data: { tags: b.tags.filter(t => t !== tag) } })
                for (const s of storesToUpdate) await tx.storeProduct.update({ where: { id: s.id }, data: { tags: s.tags.filter(t => t !== tag) } })
            })

            totalNews += newsToUpdate.length
            totalProds += prodsToUpdate.length
            totalBlogs += blogsToUpdate.length
            totalStores += storesToUpdate.length
        }

        log.info('Tag(s) deleted', { tags: tagsToDelete, totalNews, totalProds, totalBlogs, totalStores })

        return NextResponse.json({
            message: tagsToDelete.length === 1
                ? `Tag "${tagsToDelete[0]}" removida`
                : `${tagsToDelete.length} tags removidas`,
            newsUpdated: totalNews,
            productionsUpdated: totalProds,
            blogsUpdated: totalBlogs,
            storesUpdated: totalStores,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Error deleting tag', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao deletar tag' }, { status: 500 })
    }
}
