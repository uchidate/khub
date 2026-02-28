/**
 * GET /api/admin/artists/mb-search?name=<query>
 *
 * Searches MusicBrainz for artists matching the given name.
 * Returns multiple candidates with metadata so the admin can choose the correct one.
 *
 * Response: { artists: MBArtistCandidate[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getMusicBrainzService } from '@/lib/services/musicbrainz-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()

  if (!name) {
    return NextResponse.json({ error: 'Parâmetro "name" obrigatório' }, { status: 400 })
  }

  const mb = getMusicBrainzService()
  const artists = await mb.searchArtistCandidates(name)

  return NextResponse.json({ artists })
}
