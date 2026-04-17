import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import prisma from '@/lib/prisma'
import { getErrorMessage } from '@/lib/utils/error'

export const dynamic = 'force-dynamic'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185'

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] })
  }

  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: 'TMDB_API_KEY não configurado' }, { status: 500 })
  }

  try {
    // Use /search/multi to catch TV shows, movies and persons named like the group
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=pt-BR&include_adult=false`
    )

    if (!response.ok) {
      return NextResponse.json({ error: `TMDB API error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const results = (data.results || []).slice(0, 5) as Array<{
      id: number
      media_type: 'tv' | 'movie' | 'person'
      name?: string
      title?: string
      profile_path?: string | null
      poster_path?: string | null
      first_air_date?: string
      release_date?: string
      known_for_department?: string
      popularity: number
      overview?: string
    }>

    // Check which names already exist in HallyuHub as MusicalGroup
    const items = await Promise.all(
      results.map(async (r) => {
        const displayName = r.name ?? r.title ?? ''
        const imagePath = r.profile_path ?? r.poster_path ?? null

        const existing = await prisma.musicalGroup.findFirst({
          where: { name: { equals: displayName, mode: 'insensitive' } },
          select: { id: true, name: true },
        })

        return {
          tmdbId: r.id,
          mediaType: r.media_type,
          name: displayName,
          imagePath: imagePath ? `${TMDB_IMAGE_BASE}${imagePath}` : null,
          firstAirDate: r.first_air_date ?? r.release_date ?? null,
          popularity: r.popularity,
          existingGroupId: existing?.id ?? null,
          existingGroupName: existing?.name ?? null,
        }
      })
    )

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
