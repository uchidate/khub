/**
 * POST /api/admin/artists/mb-enrich
 *
 * Enriquece um artista com dados do MusicBrainz via URL relationships:
 * - Redes sociais (Instagram, Twitter, YouTube, Spotify, Weibo, TikTok)
 * - TMDB ID (se ainda não definido)
 * - URLs de streaming do artista (Spotify, Apple Music)
 *
 * Não sobrescreve dados existentes — apenas preenche campos vazios.
 *
 * Body: { artistId: string }
 * Returns: { ok: true, found: MBArtistEnrichment, applied: { socialLinks: number, tmdbId: boolean } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getMusicBrainzService } from '@/lib/services/musicbrainz-service'
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
    select: { id: true, nameRomanized: true, mbid: true, tmdbId: true, socialLinks: true },
  })

  if (!artist) {
    return NextResponse.json({ error: 'Artista não encontrado' }, { status: 404 })
  }

  if (!artist.mbid) {
    return NextResponse.json({ error: 'Artista não tem MusicBrainz ID. Vincule um MBID primeiro.' }, { status: 422 })
  }

  const mb = getMusicBrainzService()
  const enrichment = await mb.getArtistEnrichment(artist.mbid)

  const applied = { socialLinksAdded: 0, tmdbId: false }
  const updateData: Record<string, unknown> = {}

  // Merge social links (existing take priority, fill missing platforms)
  const existingLinks = (artist.socialLinks as Record<string, string> | null) ?? {}
  const newLinks = { ...enrichment.socialLinks, ...existingLinks } // existing wins
  const addedCount = Object.keys(newLinks).length - Object.keys(existingLinks).length

  if (addedCount > 0) {
    updateData.socialLinks = newLinks
    updateData.socialLinksUpdatedAt = new Date()
    applied.socialLinksAdded = addedCount
  }

  // Set TMDB ID only if not already defined
  if (!artist.tmdbId && enrichment.tmdbId) {
    updateData.tmdbId = enrichment.tmdbId
    applied.tmdbId = true
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.artist.update({
      where: { id: artistId },
      data: updateData,
    })
  }

  return NextResponse.json({
    ok: true,
    found: enrichment,
    applied,
  })
}
