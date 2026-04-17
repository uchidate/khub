import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}
