import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireEditorOrAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const publish = body.publish !== false // default: publish=true

  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      status: publish ? 'PUBLISHED' : 'ARCHIVED',
      publishedAt: publish ? (post.publishedAt ?? new Date()) : post.publishedAt,
    },
  })
  return NextResponse.json(updated)
}
