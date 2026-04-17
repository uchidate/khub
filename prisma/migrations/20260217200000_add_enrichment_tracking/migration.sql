-- Migration: Add enrichment tracking fields
-- Adds tracking fields for cast sync, MusicBrainz, social links, and discography

-- Production: cast sync tracking
ALTER TABLE "Production" ADD COLUMN "castSyncAt" TIMESTAMP(3);
CREATE INDEX "Production_castSyncAt_idx" ON "Production"("castSyncAt");

-- Artist: enrichment tracking fields
ALTER TABLE "Artist" ADD COLUMN "mbid" TEXT;
ALTER TABLE "Artist" ADD COLUMN "discographySyncAt" TIMESTAMP(3);
ALTER TABLE "Artist" ADD COLUMN "socialLinksUpdatedAt" TIMESTAMP(3);
CREATE INDEX "Artist_discographySyncAt_idx" ON "Artist"("discographySyncAt");
CREATE INDEX "Artist_socialLinksUpdatedAt_idx" ON "Artist"("socialLinksUpdatedAt");

-- Album: MusicBrainz release-group ID for deduplication
ALTER TABLE "Album" ADD COLUMN "mbid" TEXT;
CREATE INDEX "Album_mbid_idx" ON "Album"("mbid");
