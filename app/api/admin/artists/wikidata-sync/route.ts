/**
 * POST /api/admin/artists/wikidata-sync
 *
 * Sincroniza redes sociais de um artista individual via Wikidata.
 * Busca por nome romanizado e hangul; mescla com links já existentes
 * (os existentes têm prioridade).
 *
 * Body: { artistId: string }
 * Retorna: { ok: true, links: Record<string, string>, updated: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { findArtistSocialLinks } from '@/lib/services/wikidata-social-links'
import prisma from '@/lib/prisma'

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
    select: { id: true, nameRomanized: true, nameHangul: true, socialLinks: true },
  })

  if (!artist) {
    return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
  }

  const found = await findArtistSocialLinks(artist.nameRomanized, artist.nameHangul)

  if (Object.keys(found).length === 0) {
    // Ainda atualiza o timestamp para não reprocessar em breve
    await prisma.artist.update({
      where: { id: artistId },
      data: { socialLinksUpdatedAt: new Date() },
    })
    return NextResponse.json({ ok: true, links: {}, updated: false })
  }

  const existing = (artist.socialLinks as Record<string, string> | null) ?? {}
  const merged = { ...found, ...existing } // existing takes priority

  await prisma.artist.update({
    where: { id: artistId },
    data: { socialLinks: merged, socialLinksUpdatedAt: new Date() },
  })

  return NextResponse.json({ ok: true, links: merged, updated: true })
}
