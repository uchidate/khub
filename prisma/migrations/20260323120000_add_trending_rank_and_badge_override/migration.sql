-- Add trending rank tracking and badge override to Artist
-- trendingRank: current rank in trending cycle (1 = top)
-- trendingRankPrev: previous cycle rank (used to detect "SUBINDO" velocity)
-- trendingBadgeOverride: manual admin badge ('HOT' | 'SUBINDO' | 'NOVO' | NULL)

ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "trendingRank"         INTEGER,
  ADD COLUMN IF NOT EXISTS "trendingRankPrev"      INTEGER,
  ADD COLUMN IF NOT EXISTS "trendingBadgeOverride" TEXT;

-- Seed initial ranks from current trendingScore ordering
-- (so the first cron run has a baseline for prev rank)
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY "trendingScore" DESC) AS rn
  FROM "Artist"
)
UPDATE "Artist" a
SET "trendingRank" = r.rn
FROM ranked r
WHERE a.id = r.id;
