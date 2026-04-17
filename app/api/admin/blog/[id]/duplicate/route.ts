import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/blog/[id]/duplicate
 * Cria uma cópia do post como DRAFT com título "[CÓPIA] ..."
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error, session } = await requireAdmin()
    if (error) return error

    const { id } = await params
    const source = await prisma.blogPost.findUnique({ where: { id } })
    if (!source) return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 })

    // Gera slug único baseado no original
    const baseSlug = `${source.slug}-copia`
    let slug = baseSlug
    let i = 1
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${i++}`
    }

    const copy = await prisma.blogPost.create({
        data: {
            slug,
            title:          `[CÓPIA] ${source.title}`,
            excerpt:        source.excerpt,
            contentMd:      source.contentMd,
            blocks:         source.blocks ?? undefined,
            template:       source.template,
            coverImageUrl:  source.coverImageUrl,
            tags:           source.tags,
            categoryId:     source.categoryId,
            readingTimeMin: source.readingTimeMin,
            status:         'DRAFT',
            featured:       false,
            authorId:       session!.user.id,
        },
    })

    return NextResponse.json({ id: copy.id, slug: copy.slug })
}
