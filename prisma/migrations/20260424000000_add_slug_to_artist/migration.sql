-- Add slug field to Artist (nullable initially, populated by script)
ALTER TABLE "Artist" ADD COLUMN "slug" TEXT;

CREATE UNIQUE INDEX "Artist_slug_key" ON "Artist"("slug");
