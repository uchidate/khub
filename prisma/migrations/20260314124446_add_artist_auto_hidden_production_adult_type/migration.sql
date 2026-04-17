-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "autoHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "adultContentType" TEXT;

-- CreateIndex
CREATE INDEX "Artist_autoHidden_idx" ON "Artist"("autoHidden");

-- CreateIndex
CREATE INDEX "Artist_isHidden_autoHidden_idx" ON "Artist"("isHidden", "autoHidden");

-- CreateIndex
CREATE INDEX "Production_adultContentType_idx" ON "Production"("adultContentType");
