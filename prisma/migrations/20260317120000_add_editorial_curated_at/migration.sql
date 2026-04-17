-- AddColumn: editorialCuratedAt on Artist
ALTER TABLE "Artist" ADD COLUMN IF NOT EXISTS "editorialCuratedAt" TIMESTAMP(3);
