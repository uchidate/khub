import { NextRequest, NextResponse } from 'next/server'
import { requireContributorOrAbove } from '@/lib/admin-helpers'
import { slugify, uniquifySlug, calcReadingTime } from '@/lib/utils/slug'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(3).max(200),
  contentMd: z.string().min(10),
  excerpt: z.string().max(600).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).max(10).optional(),
})

export async function POST(request: NextRequest) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const body = await request.json()
  const validated = createSchema.parse(body)

  // Generate unique slug
  const baseSlug = slugify(validated.title)
  const existing = await prisma.blogPost.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  })
  const slug = uniquifySlug(baseSlug, existing.map(p => p.slug))

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title: validated.title,
      contentMd: validated.contentMd,
      excerpt: validated.excerpt || null,
      coverImageUrl: validated.coverImageUrl || null,
      categoryId: validated.categoryId || null,
      tags: validated.tags ?? [],
      readingTimeMin: calcReadingTime(validated.contentMd),
      authorId: session!.user.id,
      status: 'DRAFT',
    },
  })

  return NextResponse.json(post, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { error, session } = await requireContributorOrAbove()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = 20
  const role = session!.user.role?.toLowerCase()

  // Admins/editors see all; contributors see only their own
  const where = role === 'admin' || role === 'editor'
    ? {}
    : { authorId: session!.user.id }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { id: true, name: true, image: true } }, category: true },
    }),
    prisma.blogPost.count({ where }),
  ])

  return NextResponse.json({ data: posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
}
