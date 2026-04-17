-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "adultCheckedAt" TIMESTAMP(3),
ADD COLUMN     "isAdultContent" BOOLEAN;

-- CreateIndex
CREATE INDEX "Production_isAdultContent_idx" ON "Production"("isAdultContent");

-- CreateIndex
CREATE INDEX "Production_adultCheckedAt_idx" ON "Production"("adultCheckedAt");
