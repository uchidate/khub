import prisma from '../prisma'


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

  /**
   * Batch update de trending scores usando uma única query SQL.
   * Substitui o loop N+1 anterior (~2N queries) por 1 query.
   */
  async updateAllTrendingScores(): Promise<void> {
    console.log('📈 Iniciando atualização de trending scores (batch SQL)...')

    const count = await prisma.artist.count()
    console.log(`   Encontrados ${count} artistas`)

    // Única query que calcula e atualiza todos os scores de uma vez
    // Fórmula: viewScore(30%) + favoriteScore(40%) + recentScore(20%) + completenessScore(10%)
    await prisma.$executeRaw`
      UPDATE "Artist" SET
        "trendingScore" = (
          -- View score: min(viewCount/10000, 1) * 0.3
          LEAST(COALESCE("viewCount", 0)::float / 10000.0, 1.0) * 0.3
          +
          -- Favorite score: min(favoriteCount/1000, 1) * 0.4
          LEAST(COALESCE("favoriteCount", 0)::float / 1000.0, 1.0) * 0.4
          +
          -- Recent score: if created < 7 days ago, (1 - days/7) * 0.2
          CASE
            WHEN "createdAt" > NOW() - INTERVAL '7 days'
            THEN (1.0 - EXTRACT(EPOCH FROM (NOW() - "createdAt")) / (7.0 * 86400.0)) * 0.2
            ELSE 0.0
          END
          +
          -- Completeness score: (hasBio + hasImage + hasFilmography) / 3 * 0.1
          (
            (CASE WHEN "bio" IS NOT NULL AND "bio" != '' THEN 1.0 ELSE 0.0 END)
            + (CASE WHEN "primaryImageUrl" IS NOT NULL AND "primaryImageUrl" != '' THEN 1.0 ELSE 0.0 END)
            + (CASE WHEN EXISTS (
                SELECT 1 FROM "ArtistProduction" ap WHERE ap."artistId" = "Artist"."id"
              ) THEN 1.0 ELSE 0.0 END)
          ) / 3.0 * 0.1
        ),
        "lastTrendingUpdate" = NOW(),
        "updatedAt" = NOW()
    `

    console.log(`✅ Trending scores atualizados para ${count} artistas (batch SQL)`)
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
