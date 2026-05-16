-- AddColumn musicalStyle, fanInfo, awards, destaques, enrichedAt to Artist
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "musicalStyle" TEXT,
  ADD COLUMN IF NOT EXISTS "fanInfo"      JSONB,
  ADD COLUMN IF NOT EXISTS "awards"       JSONB,
  ADD COLUMN IF NOT EXISTS "destaques"    JSONB,
  ADD COLUMN IF NOT EXISTS "enrichedAt"   TIMESTAMP(3);
