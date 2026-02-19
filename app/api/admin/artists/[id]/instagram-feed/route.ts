import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** PATCH /api/admin/artists/[id]/instagram-feed — salva a URL do feed RSS.app */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdmin()
  if (error) return error

  const { feedUrl } = await req.json() as { feedUrl?: string }

  await prisma.artist.update({
    where: { id: params.id },
    data: { instagramFeedUrl: feedUrl?.trim() || null },
  })

  return NextResponse.json({ ok: true })
}
