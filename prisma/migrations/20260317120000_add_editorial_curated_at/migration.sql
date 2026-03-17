-- AddColumn: editorialCuratedAt on Artist
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "editorialCuratedAt" TIMESTAMP(3);
