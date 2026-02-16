import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('ADMIN-NEWS')

// Force dynamic rendering (uses auth/headers)
export const dynamic = 'force-dynamic'


const newsSchema = z.object({
  title: z.string().min(1),
  contentMd: z.string().min(1),
  sourceUrl: z.string().url(),
  imageUrl: z.string().url().optional(),
  publishedAt: z.string().optional(), // ISO date string
  tags: z.array(z.string()).optional(),
})

/**
 * GET /api/admin/news
 * List news with pagination, search, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const { skip, take, search, orderBy } = buildQueryOptions(searchParams)

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { contentMd: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.news.count({ where }),
    ])

    return paginatedResponse(
      news,
      total,
      parseInt(searchParams.get('page') || '1'),
      parseInt(searchParams.get('limit') || '20')
    )
  } catch (error) {
    log.error('Get news error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/news
 * Create a new news article
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const validated = newsSchema.parse(body)

    // Convert publishedAt string to Date if provided
    const data: Record<string, unknown> = { ...validated }
    if (validated.publishedAt) {
      data.publishedAt = new Date(validated.publishedAt)
    }

    const news = await prisma.news.create({
      data: data as Parameters<typeof prisma.news.create>[0]['data'],
    })

    return NextResponse.json(news, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Create news error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/news?id=<newsId>
 * Update a news article
 */
export async function PATCH(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { searchParams } = new URL(request.url)
    const newsId = searchParams.get('id')

    if (!newsId) {
      return NextResponse.json({ error: 'News ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = newsSchema.partial().parse(body)

    // Convert publishedAt string to Date if provided
    const data: Record<string, unknown> = { ...validated }
    if (validated.publishedAt) {
      data.publishedAt = new Date(validated.publishedAt)
    }

    const news = await prisma.news.update({
      where: { id: newsId },
      data: data as Parameters<typeof prisma.news.update>[0]['data'],
    })

    return NextResponse.json(news)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Update news error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/news
 * Delete news articles
 */
export async function DELETE(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.news.deleteMany({
      where: { id: { in: ids } },
    })

    return NextResponse.json({ message: `${result.count} notícia(s) deletada(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete news error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
