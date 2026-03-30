/**
 * lib/blog/payload-blog-service.ts
 *
 * Camada de serviço que lê posts do Payload CMS Local API e normaliza
 * para o mesmo shape que o Prisma BlogPost retornava.
 *
 * Converte o formato Payload (blockType) → BlogBlock (type) para o renderer.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { BlogBlock } from '@/lib/types/blocks'

// ── Tipos normalizados (compatíveis com o frontend existente) ─────────────────

export type NormalizedCategory = {
    id: string
    name: string
    slug: string
}

export type NormalizedPost = {
    id: string
    slug: string
    title: string
    excerpt: string | null
    coverImageUrl: string | null
    status: string
    isPrivate: boolean
    featured: boolean
    viewCount: number
    readingTimeMin: number
    publishedAt: Date | null
    createdAt: Date
    updatedAt: Date
    tags: string[]
    template: string | null
    category: NormalizedCategory | null
    blocks: BlogBlock[]
    authorId: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPayloadInstance() {
    return getPayload({ config })
}

/** Converte bloco Payload (blockType) → BlogBlock (type) para o renderer */
function normalizeBlock(block: Record<string, any>): BlogBlock {
    const { blockType, id: _id, ...rest } = block
    const type = blockType as string

    // gallery: urls é array de { url: string } no Payload → array de string no type
    if (type === 'blog_gallery' && Array.isArray(rest.urls)) {
        rest.urls = rest.urls.map((u: { url: string } | string) =>
            typeof u === 'string' ? u : u.url
        )
    }

    // heading: level é string no Payload select → número no type
    if (type === 'blog_heading' && typeof rest.level === 'string') {
        rest.level = parseInt(rest.level, 10) as 1 | 2 | 3
    }

    return { type, ...rest } as BlogBlock
}

function normalizePost(doc: Record<string, any>): NormalizedPost {
    const cat = doc.category
    return {
        id:             String(doc.id),
        slug:           doc.slug,
        title:          doc.title,
        excerpt:        doc.excerpt ?? null,
        coverImageUrl:  doc.coverImageUrl ?? null,
        status:         doc.status,
        isPrivate:      doc.isPrivate ?? false,
        featured:       doc.featured ?? false,
        viewCount:      doc.viewCount ?? 0,
        readingTimeMin: doc.readingTimeMin ?? 1,
        publishedAt:    doc.publishedAt ? new Date(doc.publishedAt) : null,
        createdAt:      new Date(doc.createdAt),
        updatedAt:      new Date(doc.updatedAt),
        tags:           (doc.tags ?? []).map((t: { tag: string } | string) =>
                            typeof t === 'string' ? t : t.tag),
        template:       doc.template ?? null,
        authorId:       doc.authorId ?? null,
        category:       cat && typeof cat === 'object' ? {
            id:   String(cat.id),
            name: cat.name,
            slug: cat.slug,
        } : null,
        blocks: Array.isArray(doc.blocks)
            ? doc.blocks.map(normalizeBlock)
            : [],
    }
}

function normalizeCategory(doc: Record<string, any>): NormalizedCategory & { postCount?: number } {
    return {
        id:        String(doc.id),
        name:      doc.name,
        slug:      doc.slug,
        postCount: doc.postCount,
    }
}

// ── API pública ───────────────────────────────────────────────────────────────

const PUBLIC_WHERE = {
    status:    { equals: 'PUBLISHED' },
    isPrivate: { equals: false },
}

export async function getPublishedPosts(opts: {
    category?: string
    tag?: string
    limit?: number
}) {
    const payload = await getPayloadInstance()
    const where: Parameters<typeof payload.find>[0]['where'] = {
        ...PUBLIC_WHERE,
        ...(opts.category ? { 'category.slug': { equals: opts.category } } : {}),
        ...(opts.tag ? { 'tags.tag': { equals: opts.tag } } : {}),
    }
    const result = await payload.find({
        collection: 'posts',
        where,
        sort:  '-publishedAt',
        limit: opts.limit ?? 18,
        depth: 1,
    })
    return result.docs.map(normalizePost)
}

export async function getHeroPost(): Promise<NormalizedPost | null> {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: PUBLIC_WHERE,
        sort:  '-publishedAt',
        limit: 1,
        depth: 1,
    })
    return result.docs[0] ? normalizePost(result.docs[0]) : null
}

export async function getMostReadPosts(limit = 5) {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: PUBLIC_WHERE,
        sort:  '-viewCount',
        limit,
        depth: 1,
        select: {
            slug: true, title: true, readingTimeMin: true,
            viewCount: true, coverImageUrl: true, publishedAt: true,
            category: true,
        },
    })
    return result.docs.map(normalizePost)
}

export async function getPostCount(opts?: { category?: string; tag?: string }) {
    const payload = await getPayloadInstance()
    const where: Parameters<typeof payload.find>[0]['where'] = {
        ...PUBLIC_WHERE,
        ...(opts?.category ? { 'category.slug': { equals: opts.category } } : {}),
        ...(opts?.tag ? { tags: { contains: opts.tag } } : {}),
    }
    const result = await payload.find({ collection: 'posts', where, limit: 0 })
    return result.totalDocs
}

export async function getPostBySlug(slug: string): Promise<NormalizedPost | null> {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: { ...PUBLIC_WHERE, slug: { equals: slug } },
        limit: 1,
        depth: 1,
    })
    return result.docs[0] ? normalizePost(result.docs[0]) : null
}

export async function getRelatedPosts(opts: {
    excludeId: string
    tags: string[]
    limit?: number
}) {
    if (opts.tags.length === 0) return []
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: {
            ...PUBLIC_WHERE,
            id:          { not_equals: opts.excludeId },
            'tags.tag':  { in: opts.tags },
        },
        sort:  '-publishedAt',
        limit: opts.limit ?? 3,
        depth: 1,
        select: {
            slug: true, title: true, excerpt: true,
            coverImageUrl: true, readingTimeMin: true, publishedAt: true, tags: true,
        },
    })
    return result.docs.map(normalizePost)
}

export async function getPublishedSlugs() {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: { status: { equals: 'PUBLISHED' } },
        limit: 1000,
        select: { slug: true },
    })
    return (result.docs as any[]).map((d) => d.slug as string)
}

export async function getCategories() {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'categories',
        sort: 'name',
        limit: 100,
    })
    return result.docs.map(normalizeCategory)
}

export async function getPopularTags(limit = 12) {
    const payload = await getPayloadInstance()
    // Buscar todos os posts publicados para agregar tags
    const result = await payload.find({
        collection: 'posts',
        where: PUBLIC_WHERE,
        limit: 500,
        select: { tags: true },
    })
    const counts = new Map<string, number>()
    for (const doc of result.docs as any[]) {
        const tags: string[] = (doc.tags ?? []).map((t: { tag: string } | string) =>
            typeof t === 'string' ? t : t.tag
        )
        for (const tag of tags) {
            counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
    }
    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag, count]) => ({ tag, count: BigInt(count) }))
}

export async function incrementViewCount(slug: string) {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        limit: 1,
    })
    const post = result.docs[0]
    if (!post) return
    await payload.update({
        collection: 'posts',
        id: post.id,
        data: { viewCount: (post.viewCount ?? 0) + 1 },
    })
}

/** Verifica se o Payload tem posts (para fallback para Prisma quando não migrado ainda) */
export async function payloadHasPosts(): Promise<boolean> {
    const payload = await getPayloadInstance()
    const result = await payload.find({ collection: 'posts', limit: 1 })
    return result.totalDocs > 0
}
