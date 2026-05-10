import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/blog/revalidate
// Body: { slug?: string } — omitir slug revalida todos os posts publicados
export async function POST(req: NextRequest) {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await req.json().catch(() => ({}))
    const { slug } = body as { slug?: string }

    const revalidated: string[] = []

    if (slug) {
        revalidatePath(`/blog/${slug}`)
        revalidated.push(`/blog/${slug}`)
    } else {
        const posts = await prisma.blogPost.findMany({
            where: { status: 'PUBLISHED' },
            select: { slug: true },
        })
        for (const post of posts) {
            revalidatePath(`/blog/${post.slug}`)
            revalidated.push(`/blog/${post.slug}`)
        }
    }

    revalidatePath('/blog')

    return NextResponse.json({ revalidated, count: revalidated.length })
}
