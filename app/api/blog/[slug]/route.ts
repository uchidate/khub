import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { detectBot } from '@/lib/utils/bot-detector'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Não contar views de bots ou sessões admin
  const ua      = req.headers.get('user-agent')
  const isBot   = !!detectBot(ua)
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'EDITOR'

  if (!isBot && !isAdmin) {
    const now = new Date()
    const today = new Date(now); today.setUTCHours(0, 0, 0, 0)
    const slot = Math.floor(now.getUTCHours() * 4 + now.getUTCMinutes() / 15)
    void Promise.all([
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
    ]).catch(() => {})
  }

  return NextResponse.json(post)
}
