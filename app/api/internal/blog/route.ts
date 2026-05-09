/**
 * /api/internal/blog — Rota de acesso programático para criação e listagem de posts.
 *
 * Autenticação: Header  Authorization: Bearer <INTERNAL_API_KEY>
 *
 * POST — Cria um novo post (status DRAFT por padrão)
 * GET  — Lista posts com filtro opcional por status/slug
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireApiKeyAuth } from '@/lib/admin-helpers'
import { slugify, uniquifySlug, calcReadingTime } from '@/lib/utils/slug'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  title: z.string().min(3).max(200),
  contentMd: z.string().min(1),
  excerpt: z.string().max(600).optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  categorySlug: z.string().optional().nullable(),
  tags: z.array(z.string()).max(15).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional().default('DRAFT'),
  isPrivate: z.boolean().optional().default(false),
  versionNote: z.string().max(300).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const { error, adminUser } = await requireApiKeyAuth(request)
  if (error) return error

  const body = await request.json()
  const validated = createSchema.parse(body)

  // Resolve categoria por slug
  let categoryId: string | null = null
  if (validated.categorySlug) {
    const cat = await prisma.blogCategory.findUnique({
      where: { slug: validated.categorySlug },
      select: { id: true },
    })
    categoryId = cat?.id ?? null
  }

  // Slug único
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
      excerpt: validated.excerpt ?? null,
      coverImageUrl: validated.coverImageUrl ?? null,
      categoryId,
      tags: validated.tags ?? [],
      readingTimeMin: calcReadingTime(validated.contentMd),
      authorId: adminUser.id,
      status: validated.status,
      blocks: Prisma.JsonNull,
      template: 'free',
      isPrivate: validated.isPrivate,
      publishedAt: validated.status === 'PUBLISHED' ? new Date() : null,
    },
  })

  // Cria versão inicial
  await prisma.blogPostVersion.create({
    data: {
      blogPostId: post.id,
      title: post.title,
      excerpt: post.excerpt,
      contentMd: post.contentMd,
      savedById: adminUser.id,
      note: validated.versionNote ?? '(criação inicial via agente)',
      pinned: true,
      label: 'criação',
    },
  })

  return NextResponse.json({ id: post.id, slug: post.slug, status: post.status }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const { error } = await requireApiKeyAuth(request)
  if (error) return error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? undefined
  const search = searchParams.get('q') ?? ''
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))

  const posts = await prisma.blogPost.findMany({
    where: {
      ...(status ? { status: status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'PENDING_REVIEW' } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      excerpt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(posts)
}
