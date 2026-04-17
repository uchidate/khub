import prisma from '../prisma'
import { createLogger } from '../utils/logger'

const log = createLogger('TRENDING')

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
   * Batch update de trending scores usando SQL com normalização global [0, 100].
   *
   * Fórmula:
   *   raw   = viewCount × 0.6 + favoriteCount × 0.3
   *           + Σ StreamingTrendSignal.score × STREAMING_WEIGHT   (somente não expirados)
   *   score = (raw / MAX(raw) global) × 100   →  normalizado [0, 100]
   *
   * STREAMING_WEIGHT = 200 garante que protagonistas das top 10 produções
   * de streaming dominam o Trending Now mesmo com baixo engajamento orgânico.
   */
  async updateAllTrendingScores(): Promise<void> {
    log.info('Iniciando atualização de trending scores (batch SQL)...')

    const count = await prisma.artist.count()

    await prisma.$executeRaw`
      UPDATE "Artist" a
      SET
        "trendingScore" = scores.normalized,
        "lastTrendingUpdate" = NOW(),
        "updatedAt" = NOW()
      FROM (
        SELECT
          id,
          ROUND(
            (raw / NULLIF(MAX(raw) OVER (), 0)) * 100 * 100
          ) / 100.0 AS normalized
        FROM (
          SELECT
            a.id,
            -- Engajamento orgânico
            (COALESCE(a."viewCount", 0) * 0.6 + COALESCE(a."favoriteCount", 0) * 0.3)
            -- Boost streaming (somente protagonistas, sinais não expirados, ×200)
            + COALESCE((
                SELECT SUM(s.score) * 200
                FROM streaming_trend_signal s
                WHERE s."artistId" = a.id AND s."expiresAt" > NOW()
              ), 0)
            AS raw
          FROM "Artist" a
        ) raw_scores
      ) scores
      WHERE a.id = scores.id
    `

    log.info(`Trending scores atualizados para ${count} artistas (batch SQL)`, { count })
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
