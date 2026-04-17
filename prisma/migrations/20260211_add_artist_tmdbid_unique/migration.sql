-- AddUniqueConstraint
-- NOTE: If there are existing duplicate tmdbId values, this migration will fail.
-- Run scripts/deduplicate-artists.ts first if needed.
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_tmdbId_key" UNIQUE ("tmdbId");
