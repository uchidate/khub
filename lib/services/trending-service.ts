import prisma from '@/lib/prisma'

interface TrendingFactors {
  viewCount: number        // Peso: 0.3
  favoriteCount: number    // Peso: 0.4
  recentActivity: number   // Peso: 0.2 (novos na última semana)
  completeness: number     // Peso: 0.1 (tem bio, imagem, filmografia)
}

export class TrendingService {
  private static instance: TrendingService

  static getInstance(): TrendingService {
    if (!TrendingService.instance) {
      TrendingService.instance = new TrendingService()
    }
    return TrendingService.instance
  }

  async calculateTrendingScore(artistId: string): Promise<number> {
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      include: {
        _count: {
          select: { productions: true }
        }
      }
    })

    if (!artist) return 0

    // Normalize factors (0-1 scale)
    const maxViews = 10000
    const maxFavorites = 1000

    const viewScore = Math.min(artist.viewCount / maxViews, 1) * 0.3
    const favoriteScore = Math.min(artist.favoriteCount / maxFavorites, 1) * 0.4

    // Recent activity (created in last 7 days)
    const daysSinceCreated = (Date.now() - artist.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    const recentScore = daysSinceCreated < 7 ? (1 - daysSinceCreated / 7) * 0.2 : 0

    // Completeness (has bio, image, filmography)
    const hasBio = !!artist.bio
    const hasImage = !!artist.primaryImageUrl
    const hasFilmography = artist._count.productions > 0
    const completenessScore = ((hasBio ? 1 : 0) + (hasImage ? 1 : 0) + (hasFilmography ? 1 : 0)) / 3 * 0.1

    return viewScore + favoriteScore + recentScore + completenessScore
  }

  async updateAllTrendingScores(): Promise<void> {
    console.log('📈 Iniciando atualização de trending scores...')

    const artists = await prisma.artist.findMany({ select: { id: true, nameRomanized: true } })
    console.log(`   Encontrados ${artists.length} artistas`)

    let updated = 0
    for (const artist of artists) {
      const score = await this.calculateTrendingScore(artist.id)
      await prisma.artist.update({
        where: { id: artist.id },
        data: {
          trendingScore: score,
          lastTrendingUpdate: new Date()
        }
      })
      updated++

      if (updated % 10 === 0) {
        console.log(`   Processados ${updated}/${artists.length} artistas...`)
      }
    }

    console.log(`✅ Trending scores atualizados para ${updated} artistas`)
  }

  async getTrendingArtists(limit: number = 6) {
    return await prisma.artist.findMany({
      take: limit,
      orderBy: { trendingScore: 'desc' },
      include: {
        agency: { select: { name: true } },
        _count: { select: { productions: true } }
      }
    })
  }

  async incrementViewCount(artistId: string): Promise<void> {
    await prisma.artist.update({
      where: { id: artistId },
      data: { viewCount: { increment: 1 } }
    })
  }

  async incrementFavoriteCount(artistId: string): Promise<void> {
    await prisma.artist.update({
      where: { id: artistId },
      data: { favoriteCount: { increment: 1 } }
    })
  }

  async decrementFavoriteCount(artistId: string): Promise<void> {
    await prisma.artist.update({
      where: { id: artistId },
      data: { favoriteCount: { decrement: 1 } }
    })
  }
}
