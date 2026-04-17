/**
 * /api/internal/blog/[id] — Leitura e atualização de post por ID.
 *
 * Autenticação: Header  Authorization: Bearer <INTERNAL_API_KEY>
 *
 * GET   — Retorna o post com conteúdo completo
 * PATCH — Atualiza campos do post e cria snapshot de versão
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireApiKeyAuth } from '@/lib/admin-helpers'
import { calcReadingTime } from '@/lib/utils/slug'
import prisma from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { error } = await requireApiKeyAuth(request)
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: { select: { name: true, slug: true } } },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

const updateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  contentMd: z.string().min(1).optional(),
  excerpt: z.string().max(600).optional().nullable(),
  coverImageUrl: z.string().url().optional().nullable().or(z.literal('')),
  categorySlug: z.string().optional().nullable(),
  tags: z.array(z.string()).max(15).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  isPrivate: z.boolean().optional(),
  versionNote: z.string().max(300).optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, adminUser } = await requireApiKeyAuth(request)
  if (error) return error

  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { versionNote, categorySlug, ...fields } = updateSchema.parse(body)

  // Resolve categoria
  let categoryId: string | null | undefined = undefined
  if (categorySlug !== undefined) {
    if (!categorySlug) {
      categoryId = null
    } else {
      const cat = await prisma.blogCategory.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      })
      categoryId = cat?.id ?? null
    }
  }

  const data: Record<string, unknown> = { ...fields }
  if (categoryId !== undefined) data.categoryId = categoryId
  if (fields.contentMd) data.readingTimeMin = calcReadingTime(fields.contentMd)
  if (fields.status === 'PUBLISHED' && post.publishedAt === null) {
    data.publishedAt = new Date()
  }

  const isContentChange = fields.title || fields.contentMd || fields.excerpt !== undefined
  const [updated] = await prisma.$transaction([
    prisma.blogPost.update({ where: { id }, data }),
    ...(isContentChange ? [prisma.blogPostVersion.create({
      data: {
        blogPostId: id,
        title: fields.title ?? post.title,
        excerpt: fields.excerpt !== undefined ? fields.excerpt : post.excerpt,
        contentMd: fields.contentMd ?? post.contentMd,
        savedById: adminUser.id,
        note: versionNote ?? '(atualização via agente)',
      },
    })] : []),
  ])

  return NextResponse.json({ id: updated.id, slug: updated.slug, status: updated.status })
}
