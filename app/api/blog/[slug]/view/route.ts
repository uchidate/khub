import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { detectBot } from '@/lib/utils/bot-detector'
import { getErrorMessage } from '@/lib/utils/error'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('BLOG')

export async function POST(request: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  try {
    const session = await getServerSession(authOptions)
    const isBot   = !!detectBot(request.headers.get('user-agent'))
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR'

    if (!isBot && !isAdmin) {
      const post = await prisma.blogPost.findFirst({
        where: { slug, status: 'PUBLISHED' },
        select: { id: true },
      })
      if (!post) return NextResponse.json({ success: false }, { status: 404 })

      const now   = new Date()
      const today = new Date(now); today.setUTCHours(0, 0, 0, 0)
      const slot  = Math.floor(now.getUTCHours() * 4 + now.getUTCMinutes() / 15)

      await Promise.all([
        prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }),
        prisma.viewEvent.upsert({
          where: { entityType_entityId_date: { entityType: 'blog', entityId: post.id, date: today } },
          update: { count: { increment: 1 } },
          create: { entityType: 'blog', entityId: post.id, date: today, count: 1 },
        }),
        prisma.viewEventHourly.upsert({
          where: { entityType_entityId_date_slot: { entityType: 'blog', entityId: post.id, date: today, slot } },
          update: { count: { increment: 1 } },
          create: { entityType: 'blog', entityId: post.id, date: today, slot, count: 1 },
        }),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Blog view tracking error', { error: getErrorMessage(error) })
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
