import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-helpers'
import { getTMDBArtistService } from '@/lib/services/tmdb-artist-service'
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
    const response = await fetch(
      `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=pt-BR&include_adult=false`
    )

    if (!response.ok) {
      return NextResponse.json({ error: `TMDB API error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const results = (data.results || []).slice(0, 5)

    const tmdbService = getTMDBArtistService()

    const items = await Promise.all(
      results.map(async (person: {
        id: number
        name: string
        profile_path: string | null
        known_for_department: string
        popularity: number
        known_for?: { title?: string; name?: string; media_type: string }[]
      }) => {
        const alreadyExists = await tmdbService.checkDuplicate(person.name, person.id)
        return {
          tmdbId: person.id,
          name: person.name,
          profilePath: person.profile_path ? `${TMDB_IMAGE_BASE}${person.profile_path}` : null,
          knownForDepartment: person.known_for_department,
          popularity: person.popularity,
          knownFor: (person.known_for || [])
            .slice(0, 2)
            .map((k) => k.title ?? k.name ?? '')
            .filter(Boolean),
          alreadyExists,
        }
      })
    )

    return NextResponse.json({ items })
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
