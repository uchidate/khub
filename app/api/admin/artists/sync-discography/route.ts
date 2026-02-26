/**
 * POST /api/admin/artists/sync-discography
 *
 * Sincroniza a discografia de um único artista via MusicBrainz (com fallback AI).
 * Replica a lógica do sync em lote, mas para um artista por vez.
 *
 * Body: { artistId: string, clearFirst?: boolean }
 *   clearFirst: se true, deleta todos os álbuns do artista antes de sincronizar.
 *              Útil para corrigir vinculações erradas.
 *
 * Returns:
 *   { ok: true, addedCount: number, source: string, clearedCount?: number }
 *   { error: string } (status 400/404/500)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getDiscographySyncService } from '@/lib/services/discography-sync-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const artistId: string | undefined = body.artistId
  const clearFirst: boolean = body.clearFirst === true

  if (!artistId) {
    return NextResponse.json({ error: 'artistId obrigatório' }, { status: 400 })
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, nameRomanized: true },
  })

  if (!artist) {
    return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
  }

  let clearedCount = 0

  if (clearFirst) {
    const deleted = await prisma.album.deleteMany({ where: { artistId } })
    clearedCount = deleted.count
    // Reset sync timestamp so the service doesn't think it's up-to-date
    await prisma.artist.update({
      where: { id: artistId },
      data: { discographySyncAt: null },
    })
  }

  try {
    const service = getDiscographySyncService()
    const result = await service.syncArtistDiscography(artistId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors[0] ?? 'Falha na sincronização' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      addedCount: result.addedCount,
      source: result.source,
      ...(clearFirst ? { clearedCount } : {}),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
