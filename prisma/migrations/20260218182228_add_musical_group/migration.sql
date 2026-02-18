-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "groupSyncAt" TIMESTAMP(3),
ADD COLUMN     "musicalGroup" TEXT,
ADD COLUMN     "musicalGroupMbid" TEXT;
