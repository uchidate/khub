-- AlterTable
ALTER TABLE "Production" ADD COLUMN "needsCuration" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Production_needsCuration_idx" ON "Production"("needsCuration");
