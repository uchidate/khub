/**
 * POST /api/cron/publish-scheduled
 *
 * Publica posts de blog agendados cujo scheduledAt <= now().
 * Convenção: status=DRAFT + scheduledAt != null + scheduledAt <= now() → PUBLISHED
 *
 * Frequência: a cada 5 minutos
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { notifyUsersAboutBlogPost } from '@/lib/services/blog-notification-service'

export const maxDuration = 30

const log = createLogger('CRON-PUBLISH-SCHEDULED')

function verifyToken(request: NextRequest): boolean {
    const authToken =
        request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.nextUrl.searchParams.get('token')
    const expectedToken = process.env.CRON_SECRET || process.env.NEXTAUTH_SECRET
    if (!expectedToken || !authToken) return false
    if (authToken.length !== expectedToken.length) return false
    try {
        return timingSafeEqual(Buffer.from(authToken), Buffer.from(expectedToken))
    } catch {
        return false
    }
}

export async function POST(request: NextRequest) {
    if (!verifyToken(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    const posts = await prisma.blogPost.findMany({
        where: {
            status: 'DRAFT',
            scheduledAt: { not: null, lte: now },
        },
        select: { id: true, slug: true, title: true, scheduledAt: true },
    })

    if (posts.length === 0) {
        return NextResponse.json({ published: 0 })
    }

    const published: string[] = []
    const errors: string[] = []

    for (const post of posts) {
        try {
            await prisma.blogPost.update({
                where: { id: post.id },
                data: {
                    status:      'PUBLISHED',
                    publishedAt: post.scheduledAt ?? now,
                    scheduledAt: null,
                },
            })
            published.push(post.id)
            log.info('Post publicado via agendamento', { id: post.id, slug: post.slug, title: post.title })
            // Email para assinantes (fire-and-forget)
            notifyUsersAboutBlogPost(post.id).catch(err =>
                log.error('Blog notification error (scheduled publish)', { id: post.id, error: String(err) })
            )
        } catch (err) {
            errors.push(post.id)
            log.error('Erro ao publicar post agendado', { id: post.id, error: String(err) })
        }
    }

    return NextResponse.json({ published: published.length, errors: errors.length, ids: published })
}

export async function GET(request: NextRequest) {
    return POST(request)
}
