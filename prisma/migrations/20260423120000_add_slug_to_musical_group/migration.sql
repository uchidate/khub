-- Add slug field to MusicalGroup (nullable initially, populated by script before unique constraint)
ALTER TABLE "MusicalGroup" ADD COLUMN "slug" TEXT;

-- Unique index applied after slug population via script
CREATE UNIQUE INDEX "MusicalGroup_slug_key" ON "MusicalGroup"("slug");
