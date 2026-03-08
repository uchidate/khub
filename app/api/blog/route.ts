import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '9')))
  const category = searchParams.get('category') || undefined
  const tag = searchParams.get('tag') || undefined
  const featured = searchParams.get('featured') === '1'

  const where = {
    status: 'PUBLISHED' as const,
    ...(category ? { category: { slug: category } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(featured ? { featured: true } : {}),
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, slug: true, title: true, excerpt: true,
        coverImageUrl: true, featured: true, viewCount: true,
        readingTimeMin: true, tags: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true, image: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ])

  return NextResponse.json({
    data: posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
