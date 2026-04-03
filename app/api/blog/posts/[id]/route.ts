import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove } from '@/lib/admin-helpers'
import { calcReadingTime } from '@/lib/utils/slug'
import prisma from '@/lib/prisma'
import { syncBlogPostEntityLinks } from '@/lib/services/blog-entity-links'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  contentMd: z.string().min(1).optional(),
  excerpt: z.string().max(600).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
  blocks: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  template: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
  featured: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  versionNote: z.string().max(300).optional().nullable(), // nota editorial opcional
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, image: true } }, category: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = session!.user.role?.toLowerCase()
  const isOwner = post.authorId === session!.user.id
  const isAdmin = role === 'admin' || role === 'editor'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(post)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = session!.user.role?.toLowerCase()
  const isOwner = post.authorId === session!.user.id
  const isAdmin = role === 'admin' || role === 'editor'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Cannot edit published posts (unless admin/editor)
  if (post.status === 'PUBLISHED' && !isAdmin) {
    return NextResponse.json({ error: 'Cannot edit a published post' }, { status: 403 })
  }

  const body = await request.json()
  const validated = updateSchema.parse(body)
  const { versionNote, ...postFields } = validated

  const data: Record<string, unknown> = { ...postFields }
  const shouldSyncLinks = Object.prototype.hasOwnProperty.call(postFields, 'blocks')
  // Prioridade: blocos > markdown (posts novos usam blocos)
  if (postFields.blocks && postFields.blocks.length > 0) {
    data.readingTimeMin = calcReadingTime(postFields.blocks)
  } else if (postFields.contentMd) {
    data.readingTimeMin = calcReadingTime(postFields.contentMd)
  }
  // Reset to DRAFT when contributor edits a pending post
  if (post.status === 'PENDING_REVIEW' && !isAdmin) data.status = 'DRAFT'
  // Only admins/editors can set featured
  if (!isAdmin) delete data.featured

  // Snapshot do estado atual antes de salvar (somente se há mudança de conteúdo)
  const isContentChange = postFields.title || postFields.contentMd || postFields.blocks !== undefined || postFields.excerpt !== undefined
  const [updated] = await prisma.$transaction([
    prisma.blogPost.update({ where: { id }, data }),
    ...(isContentChange ? [prisma.blogPostVersion.create({
      data: {
        blogPostId: id,
        title: postFields.title ?? post.title,
        excerpt: postFields.excerpt ?? post.excerpt,
        contentMd: postFields.contentMd ?? post.contentMd,
        blocks: postFields.blocks !== undefined ? (postFields.blocks as object) : (post.blocks as object ?? undefined),
        savedById: session!.user.id,
        note: versionNote ?? null,
      },
    })] : []),
  ])

  if (shouldSyncLinks) {
    await syncBlogPostEntityLinks(id, postFields.blocks)
  }

  // Limite: manter no máximo 50 versões não-pinadas por post
  if (isContentChange) {
    const excess = await prisma.blogPostVersion.findMany({
      where: { blogPostId: id, pinned: false },
      orderBy: { savedAt: 'desc' },
      skip: 50,
      select: { id: true },
    })
    if (excess.length > 0) {
      await prisma.blogPostVersion.deleteMany({ where: { id: { in: excess.map(v => v.id) } } })
    }
  }

  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = session!.user.role?.toLowerCase()
  const isOwner = post.authorId === session!.user.id
  const isAdmin = role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.blogPost.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
