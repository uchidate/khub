import { NextRequest, NextResponse } from 'next/server'
import { requireEditorOrAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { notifyUsersAboutBlogPost } from '@/lib/services/blog-notification-service'

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

  // Vincula artistas e dispara notificações apenas na primeira publicação
  if (publish && !post.publishedAt) {
    await linkArtistsAndNotify(updated.id, post.blocks as { type: string; artistId?: string }[] | null)
    // Email para assinantes (fire-and-forget)
    notifyUsersAboutBlogPost(updated.id).catch(err =>
      console.error('[publish] blog notification error:', err)
    )
  }

  return NextResponse.json(updated)
}

async function linkArtistsAndNotify(
  postId: string,
  blocks: { type: string; artistId?: string }[] | null,
) {
  if (!Array.isArray(blocks) || blocks.length === 0) return

  // Coleta IDs únicos de artistas mencionados via blog_artist_card
  const artistIds = Array.from(new Set(
    blocks
      .filter(b => b.type === 'blog_artist_card' && b.artistId)
      .map(b => b.artistId as string)
  ))

  if (artistIds.length === 0) return

  // Cria vínculos BlogPostArtist (ignora duplicatas)
  await prisma.blogPostArtist.createMany({
    data: artistIds.map(artistId => ({ blogPostId: postId, artistId })),
    skipDuplicates: true,
  })

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
