import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (post.authorId !== session!.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (post.status !== 'DRAFT') return NextResponse.json({ error: 'Only drafts can be submitted' }, { status: 400 })

  const updated = await prisma.blogPost.update({ where: { id }, data: { status: 'PENDING_REVIEW' } })
  return NextResponse.json(updated)
}
