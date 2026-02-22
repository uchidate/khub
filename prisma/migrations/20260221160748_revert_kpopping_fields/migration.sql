/*
  Warnings:

  - You are about to drop the column `debutDate` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `education` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `kpoppingLastSync` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `mbti` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "debutDate",
DROP COLUMN "education",
DROP COLUMN "kpoppingLastSync",
DROP COLUMN "mbti",
DROP COLUMN "weight";
