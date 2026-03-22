import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const year  = parseInt(searchParams.get('year')  || String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))

  const start = new Date(year, month - 1, 1)
  const end   = new Date(year, month, 1)

  // Fetch posts published or created in this month
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { publishedAt: { gte: start, lt: end } },
        { createdAt:   { gte: start, lt: end } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })

  return NextResponse.json(posts)
}
