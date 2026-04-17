-- CreateEnum
CREATE TYPE "KpoppingSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "kpopping_membership_suggestions" (
    "id" TEXT NOT NULL,
    "kpoppingIdolId" TEXT NOT NULL,
    "kpoppingGroupId" TEXT NOT NULL,
    "idolName" TEXT NOT NULL,
    "idolNameHangul" TEXT,
    "idolBirthday" TIMESTAMP(3),
    "idolImageUrl" TEXT,
    "idolHeight" INTEGER,
    "idolBloodType" TEXT,
    "idolPosition" TEXT,
    "idolIsActive" BOOLEAN NOT NULL,
    "idolProfileUrl" TEXT,
    "groupName" TEXT NOT NULL,
    "groupNameHangul" TEXT,
    "groupImageUrl" TEXT,
    "groupDebutDate" TIMESTAMP(3),
    "groupAgency" TEXT,
    "groupStatus" TEXT,
    "artistId" TEXT,
    "musicalGroupId" TEXT,
    "artistMatchScore" DOUBLE PRECISION,
    "artistMatchReason" TEXT,
    "groupMatchScore" DOUBLE PRECISION,
    "groupMatchReason" TEXT,
    "status" "KpoppingSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpopping_membership_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpopping_membership_suggestions_status_idx" ON "kpopping_membership_suggestions"("status");

-- CreateIndex
CREATE INDEX "kpopping_membership_suggestions_artistId_idx" ON "kpopping_membership_suggestions"("artistId");

-- CreateIndex
CREATE INDEX "kpopping_membership_suggestions_musicalGroupId_idx" ON "kpopping_membership_suggestions"("musicalGroupId");

-- CreateIndex
CREATE INDEX "kpopping_membership_suggestions_status_createdAt_idx" ON "kpopping_membership_suggestions"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "kpopping_membership_suggestions_kpoppingIdolId_kpoppingGrou_key" ON "kpopping_membership_suggestions"("kpoppingIdolId", "kpoppingGroupId");

-- AddForeignKey
ALTER TABLE "kpopping_membership_suggestions" ADD CONSTRAINT "kpopping_membership_suggestions_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpopping_membership_suggestions" ADD CONSTRAINT "kpopping_membership_suggestions_musicalGroupId_fkey" FOREIGN KEY ("musicalGroupId") REFERENCES "MusicalGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
