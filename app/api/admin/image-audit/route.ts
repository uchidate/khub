import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import type { BlogBlock } from '@/lib/types/blocks'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

type ImageRef = { postId: string; slug: string; title: string; url: string; blockType: string }
type AuditResult = ImageRef & { ok: boolean; status: number | null }

function extractImageUrls(blocks: BlogBlock[], postId: string, slug: string, title: string): ImageRef[] {
    const refs: ImageRef[] = []
    for (const block of blocks) {
        if (block.type === 'blog_image' && block.url) {
            refs.push({ postId, slug, title, url: block.url, blockType: 'blog_image' })
        } else if (block.type === 'blog_gallery' && block.urls) {
            for (const url of block.urls) {
                if (url) refs.push({ postId, slug, title, url, blockType: 'blog_gallery' })
            }
        }
    }
    return refs
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number | null }> {
    try {
        const res = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'HallyuHub-ImageAudit/1.0' },
        })
        return { ok: res.ok, status: res.status }
    } catch {
        return { ok: false, status: null }
    }
}

export async function GET(req: Request) {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const postId = searchParams.get('postId')
    const stream = searchParams.get('stream') === '1'

    const where = postId
        ? { id: postId, status: 'PUBLISHED' as const }
        : { status: 'PUBLISHED' as const, isPrivate: false }

    const posts = await prisma.blogPost.findMany({
        where,
        select: { id: true, slug: true, title: true, blocks: true, coverImageUrl: true },
        orderBy: { publishedAt: 'desc' },
    })

    const allRefs: ImageRef[] = []
    for (const post of posts) {
        // Cover image
        if (post.coverImageUrl) {
            allRefs.push({ postId: post.id, slug: post.slug, title: post.title, url: post.coverImageUrl, blockType: 'cover' })
        }
        // Block images
        const blocks = Array.isArray(post.blocks) ? (post.blocks as BlogBlock[]) : []
        allRefs.push(...extractImageUrls(blocks, post.id, post.slug, post.title))
    }

    if (!stream) {
        // Non-streaming fallback (legacy)
        const CONCURRENCY = 10
        const results: AuditResult[] = []
        for (let i = 0; i < allRefs.length; i += CONCURRENCY) {
            const batch = allRefs.slice(i, i + CONCURRENCY)
            const checked = await Promise.all(batch.map(async ref => ({
                ...ref, ...(await checkUrl(ref.url)),
            })))
            results.push(...checked)
        }
        const broken = results.filter(r => !r.ok)
        return NextResponse.json({ total: results.length, broken: broken.length, ok: results.length - broken.length, items: broken })
    }

    // SSE streaming mode
    const encoder = new TextEncoder()
    const total = allRefs.length

    const readable = new ReadableStream({
        async start(controller) {
            const send = (data: object) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
            }

            send({ type: 'start', total })

            const CONCURRENCY = 8
            let checked = 0
            const broken: AuditResult[] = []
            const all: AuditResult[] = []

            for (let i = 0; i < allRefs.length; i += CONCURRENCY) {
                const batch = allRefs.slice(i, i + CONCURRENCY)
                const results = await Promise.all(batch.map(async ref => ({
                    ...ref, ...(await checkUrl(ref.url)),
                })))
                for (const r of results) {
                    checked++
                    all.push(r)
                    if (!r.ok) {
                        broken.push(r)
                        send({ type: 'broken', item: r })
                    }
                    send({ type: 'progress', checked, total })
                }
            }

            send({ type: 'done', total, broken: broken.length, ok: total - broken.length, items: broken, allItems: all })
            controller.close()
        },
    })

    return new Response(readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
