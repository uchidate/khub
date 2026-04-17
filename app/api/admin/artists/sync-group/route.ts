/**
 * POST /api/admin/artists/sync-group
 *
 * Sincroniza o grupo musical de um único artista via MusicBrainz.
 * Replica a lógica do sync em lote, mas para um artista por vez.
 *
 * Body: { artistId: string }
 * Returns:
 *   { ok: true, reason: 'found', groupName: string, groupId: string }
 *   { ok: true, reason: 'solo' | 'not_found' }
 *   { error: string } (status 400/404/500)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getMusicBrainzService } from '@/lib/services/musicbrainz-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const artistId: string | undefined = body.artistId

  if (!artistId) {
    return NextResponse.json({ error: 'artistId obrigatório' }, { status: 400 })
  }

  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
    select: { id: true, nameRomanized: true, nameHangul: true, mbid: true },
  })

  if (!artist) {
    return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
  }

  try {
    const mb = getMusicBrainzService()
    let mbid = artist.mbid

    // Search MusicBrainz if no mbid saved yet
    if (!mbid) {
      mbid = await mb.searchArtist(artist.nameRomanized)
      if (!mbid && artist.nameHangul) {
        mbid = await mb.searchArtist(artist.nameHangul)
      }
      if (mbid) {
        await prisma.artist.update({ where: { id: artistId }, data: { mbid } })
      }
    }

    if (!mbid) {
      await prisma.artist.update({ where: { id: artistId }, data: { groupSyncAt: new Date() } })
      return NextResponse.json({ ok: true, reason: 'not_found' })
    }

    const groupData = await mb.getArtistGroup(mbid)

    if (!groupData) {
      await prisma.artist.update({ where: { id: artistId }, data: { groupSyncAt: new Date() } })
      return NextResponse.json({ ok: true, reason: 'solo' })
    }

    // Upsert group (fetch debut date only if not already set)
    const existingGroup = await prisma.musicalGroup.findUnique({
      where: { mbid: groupData.mbid },
      select: { id: true, debutDate: true },
    })
    const debutDate = (!existingGroup?.debutDate)
      ? await mb.getGroupDebutDate(groupData.mbid)
      : null

    const group = await prisma.musicalGroup.upsert({
      where: { mbid: groupData.mbid },
      create: { name: groupData.name, mbid: groupData.mbid, ...(debutDate ? { debutDate } : {}) },
      update: { name: groupData.name, ...(debutDate ? { debutDate } : {}) },
    })

    // Create/activate membership, deactivate any previous group
    await prisma.artistGroupMembership.upsert({
      where: { artistId_groupId: { artistId, groupId: group.id } },
      create: { artistId, groupId: group.id, isActive: true },
      update: { isActive: true, leaveDate: null },
    })
    await prisma.artistGroupMembership.updateMany({
      where: { artistId, groupId: { not: group.id } },
      data: { isActive: false },
    })

    await prisma.artist.update({ where: { id: artistId }, data: { groupSyncAt: new Date() } })

    return NextResponse.json({ ok: true, reason: 'found', groupName: group.name, groupId: group.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
