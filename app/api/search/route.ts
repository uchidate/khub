import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

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

    // Search artists
    const artists = await prisma.artist.findMany({
      where: {
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
        agency: {
          select: { name: true },
        },
      },
      take: 5,
    })

    // Search productions
    const productions = await prisma.production.findMany({
      where: {
        OR: [
          { titlePt: { contains: query, mode: 'insensitive' } },
          { titleKr: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        titlePt: true,
        titleKr: true,
        type: true,
        year: true,
        imageUrl: true,
      },
      take: 5,
    })

    // Search news
    const news = await prisma.news.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        publishedAt: true,
      },
      take: 5,
    })

    // Format results
    const results = [
      ...artists.map(a => ({
        id: a.id,
        type: 'artist' as const,
        title: a.nameRomanized,
        subtitle: a.agency?.name || a.nameHangul,
        imageUrl: a.primaryImageUrl,
      })),
      ...productions.map(p => ({
        id: p.id,
        type: 'production' as const,
        title: p.titlePt,
        subtitle: `${p.type} • ${p.year}`,
        imageUrl: p.imageUrl,
      })),
      ...news.map(n => ({
        id: n.id,
        type: 'news' as const,
        title: n.title,
        subtitle: new Date(n.publishedAt).toLocaleDateString('pt-BR'),
        imageUrl: n.imageUrl,
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
