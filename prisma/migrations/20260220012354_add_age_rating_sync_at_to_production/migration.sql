-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "ageRatingSyncAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Production_ageRatingSyncAt_idx" ON "Production"("ageRatingSyncAt");
