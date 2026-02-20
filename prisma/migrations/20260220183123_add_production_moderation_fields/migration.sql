-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "flaggedAsNonKorean" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flaggedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Production_flaggedAsNonKorean_idx" ON "Production"("flaggedAsNonKorean");
