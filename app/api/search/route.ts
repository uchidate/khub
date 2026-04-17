import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'
import { applyAgeRatingFilter } from '@/lib/utils/age-rating-filter'
import { searchProductionsUnaccent, searchGroupsUnaccent } from '@/lib/utils/search-unaccent'

const log = createLogger('SEARCH')

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const limited = checkRateLimit(request, RateLimitPresets.SEARCH)
  if (limited) return limited

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Aplicar filtro de classificação etária
    const ageRatingFilter = await applyAgeRatingFilter()

    // Search artists, productions e groups com unaccent (accent-insensitive)
    const [artists, productions, groups] = await Promise.all([
      prisma.artist.findMany({
        where: {
          flaggedAsNonKorean: false,
          isHidden: false,
          autoHidden: false,
          OR: [
            { nameRomanized: { contains: query, mode: 'insensitive' } },
            { nameHangul: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          primaryImageUrl: true,
          agency: { select: { name: true } },
        },
        take: 5,
      }),
      searchProductionsUnaccent(query, { limit: 5, ageRatingFilter }),
      searchGroupsUnaccent(query, 3),
    ])

    // Format results
    const results = [
      ...artists.map(a => ({
        id: a.id,
        type: 'artist' as const,
        title: a.nameRomanized,
        subtitle: a.agency?.name || a.nameHangul,
        imageUrl: a.primaryImageUrl,
      })),
      ...groups.map(g => ({
        id: g.id,
        type: 'group' as const,
        title: g.name,
        subtitle: g.nameHangul,
        imageUrl: g.profileImageUrl,
      })),
      ...productions.map(p => ({
        id: p.id,
        type: 'production' as const,
        title: p.titlePt,
        subtitle: `${p.type} • ${p.year}`,
        imageUrl: p.imageUrl,
      })),
    ]

    return NextResponse.json(results)
  } catch (error) {
    log.error('Search error', { error: getErrorMessage(error) })
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
