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
 * Returns all unique tags across News and Productions with usage counts + duplicate groups.
 */
export async function GET() {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const [newsList, productions] = await Promise.all([
            prisma.news.findMany({ select: { tags: true } }),
            prisma.production.findMany({ select: { tags: true } }),
        ])

        const tagMap = new Map<string, { newsCount: number; productionCount: number }>()

        for (const n of newsList) {
            for (const tag of n.tags) {
                const t = tag.trim()
                if (!t) continue
                const entry = tagMap.get(t) ?? { newsCount: 0, productionCount: 0 }
                entry.newsCount++
                tagMap.set(t, entry)
            }
        }

        for (const p of productions) {
            for (const tag of p.tags) {
                const t = tag.trim()
                if (!t) continue
                const entry = tagMap.get(t) ?? { newsCount: 0, productionCount: 0 }
                entry.productionCount++
                tagMap.set(t, entry)
            }
        }

        const tags = Array.from(tagMap.entries())
            .map(([tag, counts]) => ({
                tag,
                newsCount: counts.newsCount,
                productionCount: counts.productionCount,
                total: counts.newsCount + counts.productionCount,
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
 * Rename (or merge) a tag across all News and Productions.
 * If `merge: true`, allows renaming to an existing tag (merges them).
 * Always deduplicates the tags array after update.
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

        // Check if target already exists (merge scenario)
        const targetExists = await prisma.news.count({ where: { tags: { has: newTag } } })
            .then(n => n > 0)
            .catch(() => false)
        const targetExistsProd = await prisma.production.count({ where: { tags: { has: newTag } } })
            .then(n => n > 0)
            .catch(() => false)

        if ((targetExists || targetExistsProd) && !merge) {
            return NextResponse.json({ error: `Tag "${newTag}" já existe. Use merge: true para mesclar.`, conflict: true }, { status: 409 })
        }

        const [newsToUpdate, prodsToUpdate] = await Promise.all([
            prisma.news.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
            prisma.production.findMany({ where: { tags: { has: oldTag } }, select: { id: true, tags: true } }),
        ])

        await prisma.$transaction(async (tx) => {
            for (const n of newsToUpdate) {
                const updated = n.tags.map(t => t === oldTag ? newTag : t)
                // Dedup: remove duplicates that may arise from merging
                const deduped = Array.from(new Set(updated))
                await tx.news.update({ where: { id: n.id }, data: { tags: deduped } })
            }
            for (const p of prodsToUpdate) {
                const updated = p.tags.map(t => t === oldTag ? newTag : t)
                const deduped = Array.from(new Set(updated))
                await tx.production.update({ where: { id: p.id }, data: { tags: deduped } })
            }
        })

        log.info(merge ? 'Tag merged' : 'Tag renamed', {
            oldTag, newTag,
            newsUpdated: newsToUpdate.length,
            prodsUpdated: prodsToUpdate.length,
        })

        return NextResponse.json({
            message: merge
                ? `Tag "${oldTag}" mesclada em "${newTag}"`
                : `Tag "${oldTag}" renomeada para "${newTag}"`,
            newsUpdated: newsToUpdate.length,
            productionsUpdated: prodsToUpdate.length,
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
    tag: z.string().min(1),
})

/**
 * DELETE /api/admin/tags
 * Remove a tag from all News and Productions.
 */
export async function DELETE(request: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    try {
        const body = await request.json()
        const { tag } = deleteSchema.parse(body)

        const [newsToUpdate, prodsToUpdate] = await Promise.all([
            prisma.news.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
            prisma.production.findMany({ where: { tags: { has: tag } }, select: { id: true, tags: true } }),
        ])

        await prisma.$transaction(async (tx) => {
            for (const n of newsToUpdate) {
                await tx.news.update({ where: { id: n.id }, data: { tags: n.tags.filter(t => t !== tag) } })
            }
            for (const p of prodsToUpdate) {
                await tx.production.update({ where: { id: p.id }, data: { tags: p.tags.filter(t => t !== tag) } })
            }
        })

        log.info('Tag deleted', { tag, newsUpdated: newsToUpdate.length, prodsUpdated: prodsToUpdate.length })

        return NextResponse.json({
            message: `Tag "${tag}" removida`,
            newsUpdated: newsToUpdate.length,
            productionsUpdated: prodsToUpdate.length,
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
        }
        log.error('Error deleting tag', { error: getErrorMessage(error) })
        return NextResponse.json({ error: 'Erro ao deletar tag' }, { status: 500 })
    }
}
