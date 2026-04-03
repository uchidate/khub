import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { notifyUsersAboutBlogPost } from '@/lib/services/blog-notification-service'
import { syncBlogPostEntityLinks } from '@/lib/services/blog-entity-links'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireEditorOrAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const publish = body.publish !== false // default: publish=true

  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.blogPost.update({
    where: { id },
    data: {
      status: publish ? 'PUBLISHED' : 'ARCHIVED',
      publishedAt: publish ? (post.publishedAt ?? new Date()) : post.publishedAt,
    },
  })

  let artistIdsForNotification: string[] = []
  if (publish) {
    const synced = await syncBlogPostEntityLinks(updated.id, post.blocks)
    artistIdsForNotification = synced.artistIds
  }

  // Vincula artistas e dispara notificações apenas na primeira publicação
  if (publish && !post.publishedAt) {
    await notifyFavoriteUsersForArtists(updated.id, artistIdsForNotification)
    // Email para assinantes (fire-and-forget)
    notifyUsersAboutBlogPost(updated.id).catch(err =>
      console.error('[publish] blog notification error:', err)
    )
  }

  return NextResponse.json(updated)
}

async function notifyFavoriteUsersForArtists(
  postId: string,
  artistIds: string[],
) {
  if (artistIds.length === 0) return

  // Usuários que favoritaram pelo menos um dos artistas mencionados
  const favorites = await prisma.favorite.findMany({
    where: { artistId: { in: artistIds } },
    select: { userId: true },
    distinct: ['userId'],
  })

  if (favorites.length === 0) return

  const userIds = favorites.map(f => f.userId)

  // Evita duplicatas: pula usuários que já receberam notificação deste post
  const existing = await prisma.notificationHistory.findMany({
    where: { blogPostId: postId, userId: { in: userIds }, type: 'IN_APP' },
    select: { userId: true },
  })
  const alreadyNotified = new Set(existing.map(e => e.userId))
  const toNotify = userIds.filter(uid => !alreadyNotified.has(uid))

  if (toNotify.length === 0) return

  await prisma.notificationHistory.createMany({
    data: toNotify.map(userId => ({
      userId,
      blogPostId: postId,
      type: 'IN_APP',
      status: 'SENT',
      sentAt: new Date(),
    })),
    skipDuplicates: true,
  })
}
