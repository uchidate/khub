-- CreateEnum
CREATE TYPE "TakedownReason" AS ENUM ('DMCA', 'COPYRIGHT', 'LEGAL_NOTICE', 'MANUAL');

-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "isTakenDown" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "production_takedowns" (
    "id" TEXT NOT NULL,
    "productionId" TEXT NOT NULL,
    "reason" "TakedownReason" NOT NULL,
    "noticeReference" VARCHAR(500),
    "noticeDate" TIMESTAMP(3),
    "hiddenById" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredById" TEXT,
    "restoredAt" TIMESTAMP(3),
    "restoredReason" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_takedowns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "production_takedowns_productionId_idx" ON "production_takedowns"("productionId");

-- CreateIndex
CREATE INDEX "production_takedowns_isActive_idx" ON "production_takedowns"("isActive");

-- CreateIndex
CREATE INDEX "production_takedowns_productionId_isActive_idx" ON "production_takedowns"("productionId", "isActive");

-- CreateIndex
CREATE INDEX "Production_isTakenDown_idx" ON "Production"("isTakenDown");

-- CreateIndex
CREATE INDEX "Production_isTakenDown_isHidden_idx" ON "Production"("isTakenDown", "isHidden");

-- AddForeignKey
ALTER TABLE "production_takedowns" ADD CONSTRAINT "production_takedowns_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_takedowns" ADD CONSTRAINT "production_takedowns_hiddenById_fkey" FOREIGN KEY ("hiddenById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_takedowns" ADD CONSTRAINT "production_takedowns_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
