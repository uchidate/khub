/**
 * POST /api/admin/artists/mb-import
 *
 * Creates a new artist in HallyuHub from MusicBrainz data.
 * Fetches artist details from MB (name, type, birth date) and creates
 * a minimal artist record with the MBID linked.
 *
 * Body: { mbid: string, nameOverride?: string }
 * Response:
 *   201: { ok: true, artist: { id, nameRomanized } }
 *   409: { error: 'Artista com este MBID já existe', artistId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getMusicBrainzService } from '@/lib/services/musicbrainz-service'
import prisma from '@/lib/prisma'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('MB-IMPORT')

export const dynamic = 'force-dynamic'
export const maxDuration = 20

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await request.json().catch(() => ({}))
  const mbid: string | undefined = body.mbid
  const nameOverride: string | undefined = body.nameOverride?.trim() || undefined

  if (!mbid) {
    return NextResponse.json({ error: 'mbid obrigatório' }, { status: 400 })
  }

  // Check if MBID already exists in DB
  const existing = await prisma.artist.findFirst({
    where: { mbid },
    select: { id: true, nameRomanized: true },
  })

  if (existing) {
    return NextResponse.json(
      { error: 'Artista com este MBID já existe', artistId: existing.id },
      { status: 409 }
    )
  }

  // Fetch artist details from MusicBrainz
  try {
    const mb = getMusicBrainzService()
    // Use internal fetch via searchArtistCandidates approach — but here we need direct lookup
    // Fetch directly via the service's private fetch (workaround: call enrichment which uses same base)
    // Actually we expose a direct fetch via getArtistGroup which hits /artist/{mbid}
    // Instead, use getGroupDebutDate as a pattern — it calls /artist/{mbid}?fmt=json
    // We replicate the same approach here inline:
    const mbUrl = `https://musicbrainz.org/ws/2/artist/${mbid}?fmt=json`
    const mbResponse = await fetch(mbUrl, {
      headers: {
        'User-Agent': 'HallyuHub/1.0 (https://hallyuhub.com.br)',
        'Accept': 'application/json',
      },
    })

    if (!mbResponse.ok) {
      if (mbResponse.status === 404) {
        return NextResponse.json({ error: 'Artista não encontrado no MusicBrainz' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro ao consultar MusicBrainz' }, { status: 502 })
    }

    const mbData = await mbResponse.json()
    const nameRomanized = nameOverride || mbData.name

    if (!nameRomanized) {
      return NextResponse.json({ error: 'Nome do artista não encontrado no MusicBrainz' }, { status: 422 })
    }

    // Parse birth date if available and complete (YYYY-MM-DD)
    let birthDate: Date | undefined
    const lifeSpanBegin: string | undefined = mbData['life-span']?.begin
    if (lifeSpanBegin) {
      const normalized =
        lifeSpanBegin.length === 10 ? lifeSpanBegin :
        lifeSpanBegin.length === 7 ? `${lifeSpanBegin}-01` :
        lifeSpanBegin.length === 4 ? `${lifeSpanBegin}-01-01` : null
      if (normalized) {
        const parsed = new Date(normalized)
        if (!isNaN(parsed.getTime())) birthDate = parsed
      }
    }

    const artist = await prisma.artist.create({
      data: {
        nameRomanized,
        mbid,
        ...(birthDate ? { birthDate } : {}),
      },
      select: { id: true, nameRomanized: true },
    })

    log.info('Artist imported from MusicBrainz', { mbid, artistId: artist.id, nameRomanized: artist.nameRomanized })

    return NextResponse.json({ ok: true, artist }, { status: 201 })
  } catch (err) {
    log.error('MB import error', { mbid, error: getErrorMessage(err) })
    return NextResponse.json({ error: 'Erro interno ao importar artista' }, { status: 500 })
  }
}
