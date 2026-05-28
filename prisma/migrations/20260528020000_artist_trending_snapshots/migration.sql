CREATE TABLE "ArtistTrendingSnapshot" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rawScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER,
    "views1d" INTEGER NOT NULL DEFAULT 0,
    "views7d" INTEGER NOT NULL DEFAULT 0,
    "views30d" INTEGER NOT NULL DEFAULT 0,
    "previousViews7d" INTEGER NOT NULL DEFAULT 0,
    "velocityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "favorites7d" INTEGER NOT NULL DEFAULT 0,
    "streamingBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qualityBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistTrendingSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArtistTrendingSnapshot_artistId_calculatedAt_idx" ON "ArtistTrendingSnapshot"("artistId", "calculatedAt");
CREATE INDEX "ArtistTrendingSnapshot_calculatedAt_idx" ON "ArtistTrendingSnapshot"("calculatedAt");
CREATE INDEX "ArtistTrendingSnapshot_rank_idx" ON "ArtistTrendingSnapshot"("rank");

ALTER TABLE "ArtistTrendingSnapshot" ADD CONSTRAINT "ArtistTrendingSnapshot_artistId_fkey"
    FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
