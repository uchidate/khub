import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/instagram/status
 * Diagnóstico completo do status do Instagram de todos os artistas
 */
export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    // Buscar todos os artistas com feed configurado
    const artistsWithFeed = await prisma.artist.findMany({
      where: {
        instagramFeedUrl: { not: null },
      },
      select: {
        id: true,
        nameRomanized: true,
        instagramFeedUrl: true,
        instagramLastSync: true,
        socialLinks: true,
        _count: {
          select: { instagramPosts: true },
        },
      },
      orderBy: { nameRomanized: 'asc' },
    })

    // Artistas SEM feed configurado (não incluído na resposta por enquanto)

    // Estatísticas gerais
    const totalArtists = await prisma.artist.count()
    const totalPosts = await prisma.instagramPost.count()
    const artistsNeverSynced = artistsWithFeed.filter((a) => !a.instagramLastSync).length
    const artistsWithPosts = artistsWithFeed.filter((a) => a._count.instagramPosts > 0).length
    const artistsWithoutPosts = artistsWithFeed.filter((a) => a._count.instagramPosts === 0).length

    // Últimos posts sincronizados
    const recentPosts = await prisma.instagramPost.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        artist: {
          select: { nameRomanized: true },
        },
      },
    })

    return NextResponse.json({
      stats: {
        totalArtists,
        totalPosts,
        artistsWithFeed: artistsWithFeed.length,
        artistsWithPosts,
        artistsWithoutPosts,
        artistsNeverSynced,
      },
      artistsWithFeed: artistsWithFeed.map((a) => ({
        id: a.id,
        name: a.nameRomanized,
        feedUrl: a.instagramFeedUrl,
        lastSync: a.instagramLastSync,
        postsCount: a._count.instagramPosts,
        status:
          a._count.instagramPosts === 0 && a.instagramLastSync
            ? 'synced_no_posts'
            : a._count.instagramPosts === 0
            ? 'never_synced'
            : 'ok',
      })),
      recentPosts: recentPosts.map((p) => ({
        id: p.id,
        artist: p.artist?.nameRomanized || 'Unknown',
        postId: p.postId,
        createdAt: p.createdAt,
        postedAt: p.postedAt,
        hasImage: !!p.imageUrl,
      })),
    })
  } catch (err) {
    console.error('Failed to get Instagram status:', err)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}
