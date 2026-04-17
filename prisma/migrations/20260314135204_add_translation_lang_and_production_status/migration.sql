-- AlterTable
ALTER TABLE "ContentTranslation" ADD COLUMN     "sourceLang" TEXT;

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "translatedAt" TIMESTAMP(3),
ADD COLUMN     "translationStatus" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "Production_translationStatus_idx" ON "Production"("translationStatus");

-- CreateIndex
CREATE INDEX "Production_translationStatus_synopsis_idx" ON "Production"("translationStatus", "synopsis");

-- Backfill: produções com sinopse já em PT-BR (tmdb_pt) ou traduzida por AI → completed
UPDATE "Production" SET "translationStatus" = 'completed' WHERE "synopsisSource" IN ('tmdb_pt', 'ai');
-- Produções sem sinopse não precisam de tradução → completed também
UPDATE "Production" SET "translationStatus" = 'completed' WHERE "synopsis" IS NULL;
