import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove } from '@/lib/admin-helpers'
import { calcReadingTime } from '@/lib/utils/slug'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  contentMd: z.string().min(10).optional(),
  excerpt: z.string().max(600).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).max(10).optional(),
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

  const data: Record<string, unknown> = { ...validated }
  if (validated.contentMd) data.readingTimeMin = calcReadingTime(validated.contentMd)
  // Reset to DRAFT when contributor edits a pending post
  if (post.status === 'PENDING_REVIEW' && !isAdmin) data.status = 'DRAFT'

  const updated = await prisma.blogPost.update({ where: { id }, data })
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
