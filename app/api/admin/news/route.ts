import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, buildQueryOptions, paginatedResponse } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { logAudit } from '@/lib/services/audit-service'
import { getNewsNotificationService } from '@/lib/services/news-notification-service'

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
        include: {
          artists: {
            include: {
              artist: {
                select: { id: true, nameRomanized: true, primaryImageUrl: true },
              },
            },
            take: 6,
          },
        },
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
    const { error, session } = await requireAdmin()
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

    await logAudit({ adminId: session!.user.id, action: 'CREATE', entity: 'News', entityId: news.id, details: `Criou notícia "${news.title}"` })
    // Fire-and-forget IN_APP notifications
    void getNewsNotificationService().notifyInAppForNews(news.id).catch(
      (e: Error) => log.warn('IN_APP notify failed (non-blocking)', { error: e.message })
    )
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
    const { error, session } = await requireAdmin()
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

    await logAudit({ adminId: session!.user.id, action: 'UPDATE', entity: 'News', entityId: newsId, details: `Editou notícia "${news.title}"` })
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
    const { error, session } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(body)

    const result = await prisma.news.deleteMany({
      where: { id: { in: ids } },
    })

    await logAudit({ adminId: session!.user.id, action: 'DELETE', entity: 'News', details: `Deletou ${result.count} notícia(s)` })
    return NextResponse.json({ message: `${result.count} notícia(s) deletada(s)` })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.issues }, { status: 400 })
    }

    log.error('Delete news error', { error: getErrorMessage(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
