import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getSpotifyService } from '@/lib/services/spotify-service'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const name = new URL(request.url).searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Parâmetro "name" obrigatório' }, { status: 400 })
  }

  try {
    const artists = await getSpotifyService().searchArtists(name)
    return NextResponse.json({ artists })
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 502 })
  }
}
