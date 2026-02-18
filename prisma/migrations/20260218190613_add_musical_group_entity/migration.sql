/*
  Warnings:

  - You are about to drop the column `musicalGroup` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `musicalGroupMbid` on the `Artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "musicalGroup",
DROP COLUMN "musicalGroupMbid";

-- CreateTable
CREATE TABLE "MusicalGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHangul" TEXT,
    "mbid" TEXT,
    "bio" TEXT,
    "profileImageUrl" TEXT,
    "debutDate" TIMESTAMP(3),
    "disbandDate" TIMESTAMP(3),
    "agencyId" TEXT,
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistGroupMembership" (
    "id" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3),
    "leaveDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtistGroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MusicalGroup_name_key" ON "MusicalGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MusicalGroup_mbid_key" ON "MusicalGroup"("mbid");

-- CreateIndex
CREATE INDEX "MusicalGroup_name_idx" ON "MusicalGroup"("name");

-- CreateIndex
CREATE INDEX "MusicalGroup_agencyId_idx" ON "MusicalGroup"("agencyId");

-- CreateIndex
CREATE INDEX "ArtistGroupMembership_groupId_idx" ON "ArtistGroupMembership"("groupId");

-- CreateIndex
CREATE INDEX "ArtistGroupMembership_artistId_idx" ON "ArtistGroupMembership"("artistId");

-- CreateIndex
CREATE UNIQUE INDEX "ArtistGroupMembership_artistId_groupId_key" ON "ArtistGroupMembership"("artistId", "groupId");

-- AddForeignKey
ALTER TABLE "MusicalGroup" ADD CONSTRAINT "MusicalGroup_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistGroupMembership" ADD CONSTRAINT "ArtistGroupMembership_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistGroupMembership" ADD CONSTRAINT "ArtistGroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "MusicalGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
