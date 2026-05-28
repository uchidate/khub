import prisma from '@/lib/prisma'

export type ArtistTrendingUpdateResult = {
  artistsUpdated: number
  snapshotsCreated: number
}

function daysAgo(days: number): Date {
  const date = new Date(Date.now() - days * 86400_000)
  date.setUTCHours(0, 0, 0, 0)
  return date
}

/**
 * Senior-data style trending:
 * - recent demand: 1d/7d/30d view windows from ViewEvent
 * - velocity: current 7d vs previous 7d
 * - intent: favorites created in 7d
 * - external signal: active streaming trend signals, capped
 * - cold-start prior: lifetime views/favorites + filmography, with low cap
 * - quality: small boost for usable public profile
 *
 * Normalization uses p95 instead of max, so one extreme outlier does not flatten
 * the rest of the ranking.
 */
export async function updateArtistTrendingScores(): Promise<ArtistTrendingUpdateResult> {
  const since1d = daysAgo(1)
  const since7d = daysAgo(7)
  const since14d = daysAgo(14)
  const since30d = daysAgo(30)

  await prisma.$executeRaw`
    UPDATE "Artist"
    SET "trendingRankPrev" = "trendingRank"
    WHERE "trendingRank" IS NOT NULL
  `

  const artistsUpdated = await prisma.$executeRaw`
    WITH features AS (
      SELECT
        a.id,
        COALESCE(v1.views, 0)::int AS views1d,
        COALESCE(v7.views, 0)::int AS views7d,
        COALESCE(v30.views, 0)::int AS views30d,
        COALESCE(prev7.views, 0)::int AS previous_views7d,
        COALESCE(f7.count, 0)::int AS favorites7d,
        COALESCE(a."viewCount", 0)::int AS lifetime_views,
        COALESCE(a."favoriteCount", 0)::int AS lifetime_favorites,
        COALESCE(prod.count, 0)::int AS production_count,
        COALESCE(sig.score, 0)::float AS streaming_signal,
        (
          CASE
            WHEN a."primaryImageUrl" IS NULL THEN 0.18
            WHEN a.bio IS NULL THEN 0.72
            ELSE 1.0
          END
        )::float AS profile_multiplier,
        (
          CASE
            WHEN COALESCE(sig.score, 0) > 0 THEN 1.0
            WHEN LOWER(COALESCE(a.nationality, '') || ' ' || COALESCE(a."placeOfBirth", '')) ~ '(korea|korean|seoul|busan|daegu|incheon|gwangju|daejeon|ulsan|jeju)' THEN 1.0
            WHEN COALESCE(a.nationality, '') <> '' OR COALESCE(a."placeOfBirth", '') <> '' THEN 0.45
            ELSE 0.82
          END
        )::float AS cultural_multiplier,
        (
          CASE WHEN a."primaryImageUrl" IS NOT NULL THEN 2 ELSE 0 END
          + CASE WHEN a.bio IS NOT NULL THEN 2 ELSE 0 END
          + CASE WHEN EXISTS (SELECT 1 FROM "ArtistProduction" ap WHERE ap."artistId" = a.id) THEN 2 ELSE 0 END
        )::float AS quality_boost
      FROM "Artist" a
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views
        FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since1d}
        GROUP BY "entityId"
      ) v1 ON v1."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views
        FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since7d}
        GROUP BY "entityId"
      ) v7 ON v7."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views
        FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since30d}
        GROUP BY "entityId"
      ) v30 ON v30."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views
        FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since14d} AND date < ${since7d}
        GROUP BY "entityId"
      ) prev7 ON prev7."entityId" = a.id
      LEFT JOIN (
        SELECT "artistId", COUNT(*)::int AS count
        FROM "Favorite"
        WHERE "artistId" IS NOT NULL AND "createdAt" >= ${since7d}
        GROUP BY "artistId"
      ) f7 ON f7."artistId" = a.id
      LEFT JOIN (
        SELECT "artistId", COUNT(*)::int AS count
        FROM "ArtistProduction"
        GROUP BY "artistId"
      ) prod ON prod."artistId" = a.id
      LEFT JOIN (
        SELECT "artistId", SUM(score)::float AS score
        FROM streaming_trend_signal
        WHERE "expiresAt" > NOW()
        GROUP BY "artistId"
      ) sig ON sig."artistId" = a.id
      WHERE a."isHidden" = false AND a."flaggedAsNonKorean" = false
    ),
    raw_scores AS (
      SELECT
        id,
        (
          (
            LN(1 + views1d) * 30
            + LN(1 + views7d) * 25
            + LN(1 + views30d) * 8
            + CASE
                WHEN views7d >= 10 THEN GREATEST(0, (views7d - previous_views7d)::float / SQRT(previous_views7d + 1)) * 12
                ELSE 0
              END
            + LN(1 + favorites7d) * 18
            + LEAST(35, LN(1 + streaming_signal) * 12)
            + LEAST(18, LN(1 + lifetime_views) * 2 + LN(1 + lifetime_favorites) * 5 + LN(1 + production_count) * 3)
            + quality_boost
          ) * profile_multiplier * cultural_multiplier
        )::float AS raw
      FROM features
    ),
    scale AS (
      SELECT COALESCE(NULLIF(percentile_cont(0.95) WITHIN GROUP (ORDER BY raw), 0), 1)::float AS p95
      FROM raw_scores
    ),
    normalized AS (
      SELECT id, ROUND((100 * (1 - EXP(-raw / scale.p95)))::numeric, 2)::float AS score
      FROM raw_scores, scale
    )
    UPDATE "Artist" a
    SET
      "trendingScore" = normalized.score,
      "lastTrendingUpdate" = NOW(),
      "updatedAt" = NOW()
    FROM normalized
    WHERE a.id = normalized.id
  `

  await prisma.$executeRaw`
    UPDATE "Artist" a
    SET "trendingRank" = ranks.rn
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY "trendingScore" DESC, "viewCount" DESC, "nameRomanized" ASC) AS rn
      FROM "Artist"
      WHERE "isHidden" = false AND "flaggedAsNonKorean" = false
    ) ranks
    WHERE a.id = ranks.id
  `

  const snapshotsCreated = await prisma.$executeRaw`
    WITH features AS (
      SELECT
        a.id,
        a."trendingScore" AS score,
        a."trendingRank" AS rank,
        COALESCE(v1.views, 0)::int AS views1d,
        COALESCE(v7.views, 0)::int AS views7d,
        COALESCE(v30.views, 0)::int AS views30d,
        COALESCE(prev7.views, 0)::int AS previous_views7d,
        COALESCE(f7.count, 0)::int AS favorites7d,
        COALESCE(a."viewCount", 0)::int AS lifetime_views,
        COALESCE(a."favoriteCount", 0)::int AS lifetime_favorites,
        COALESCE(prod.count, 0)::int AS production_count,
        COALESCE(sig.score, 0)::float AS streaming_signal,
        (
          CASE
            WHEN a."primaryImageUrl" IS NULL THEN 0.18
            WHEN a.bio IS NULL THEN 0.72
            ELSE 1.0
          END
        )::float AS profile_multiplier,
        (
          CASE
            WHEN COALESCE(sig.score, 0) > 0 THEN 1.0
            WHEN LOWER(COALESCE(a.nationality, '') || ' ' || COALESCE(a."placeOfBirth", '')) ~ '(korea|korean|seoul|busan|daegu|incheon|gwangju|daejeon|ulsan|jeju)' THEN 1.0
            WHEN COALESCE(a.nationality, '') <> '' OR COALESCE(a."placeOfBirth", '') <> '' THEN 0.45
            ELSE 0.82
          END
        )::float AS cultural_multiplier,
        (
          CASE WHEN a."primaryImageUrl" IS NOT NULL THEN 2 ELSE 0 END
          + CASE WHEN a.bio IS NOT NULL THEN 2 ELSE 0 END
          + CASE WHEN EXISTS (SELECT 1 FROM "ArtistProduction" ap WHERE ap."artistId" = a.id) THEN 2 ELSE 0 END
        )::float AS quality_boost
      FROM "Artist" a
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since1d} GROUP BY "entityId"
      ) v1 ON v1."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since7d} GROUP BY "entityId"
      ) v7 ON v7."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since30d} GROUP BY "entityId"
      ) v30 ON v30."entityId" = a.id
      LEFT JOIN (
        SELECT "entityId", SUM(count)::int AS views FROM "ViewEvent"
        WHERE "entityType" = 'artist' AND date >= ${since14d} AND date < ${since7d} GROUP BY "entityId"
      ) prev7 ON prev7."entityId" = a.id
      LEFT JOIN (
        SELECT "artistId", COUNT(*)::int AS count FROM "Favorite"
        WHERE "artistId" IS NOT NULL AND "createdAt" >= ${since7d} GROUP BY "artistId"
      ) f7 ON f7."artistId" = a.id
      LEFT JOIN (
        SELECT "artistId", COUNT(*)::int AS count FROM "ArtistProduction"
        GROUP BY "artistId"
      ) prod ON prod."artistId" = a.id
      LEFT JOIN (
        SELECT "artistId", SUM(score)::float AS score FROM streaming_trend_signal
        WHERE "expiresAt" > NOW() GROUP BY "artistId"
      ) sig ON sig."artistId" = a.id
      WHERE a."isHidden" = false AND a."flaggedAsNonKorean" = false AND a."trendingRank" <= 250
    ),
    scored AS (
      SELECT
        id,
        score,
        rank,
        views1d,
        views7d,
        views30d,
        previous_views7d,
        CASE
          WHEN views7d >= 10 THEN GREATEST(0, (views7d - previous_views7d)::float / SQRT(previous_views7d + 1)) * 12
          ELSE 0
        END AS velocity_score,
        favorites7d,
        LEAST(35, LN(1 + streaming_signal) * 12) AS streaming_boost,
        LEAST(18, LN(1 + lifetime_views) * 2 + LN(1 + lifetime_favorites) * 5 + LN(1 + production_count) * 3) AS prior_score,
        quality_boost,
        (
          (
            LN(1 + views1d) * 30
            + LN(1 + views7d) * 25
            + LN(1 + views30d) * 8
            + CASE
                WHEN views7d >= 10 THEN GREATEST(0, (views7d - previous_views7d)::float / SQRT(previous_views7d + 1)) * 12
                ELSE 0
              END
            + LN(1 + favorites7d) * 18
            + LEAST(35, LN(1 + streaming_signal) * 12)
            + LEAST(18, LN(1 + lifetime_views) * 2 + LN(1 + lifetime_favorites) * 5 + LN(1 + production_count) * 3)
            + quality_boost
          ) * profile_multiplier * cultural_multiplier
        )::float AS raw
      FROM features
    )
    INSERT INTO "ArtistTrendingSnapshot" (
      id, "artistId", score, "rawScore", rank, "views1d", "views7d", "views30d",
      "previousViews7d", "velocityScore", "favorites7d", "streamingBoost",
      "priorScore", "qualityBoost", "calculatedAt"
    )
    SELECT
      md5(random()::text || clock_timestamp()::text || id), id, score, raw, rank, views1d, views7d, views30d,
      previous_views7d, velocity_score, favorites7d, streaming_boost, prior_score, quality_boost, NOW()
    FROM scored
  `

  await prisma.artistTrendingSnapshot.deleteMany({
    where: { calculatedAt: { lt: daysAgo(90) } },
  })

  return {
    artistsUpdated: Number(artistsUpdated),
    snapshotsCreated: Number(snapshotsCreated),
  }
}
