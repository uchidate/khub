import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const { skip, take, search, orderBy } = buildQueryOptions(searchParams)
  const status = searchParams.get('status') || undefined

  const where = {
    ...(status ? { status: status as 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED' } : {}),
    ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' as const } }] } : {}),
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
    prisma.blogPost.count({ where }),
  ])

  return paginatedResponse(
    posts,
    total,
    parseInt(searchParams.get('page') || '1'),
    parseInt(searchParams.get('limit') || '20'),
  )
}
