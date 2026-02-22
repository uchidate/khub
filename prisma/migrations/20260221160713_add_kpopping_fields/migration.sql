-- AlterTable
ALTER TABLE "Artist" ADD COLUMN     "debutDate" TIMESTAMP(3),
ADD COLUMN     "education" TEXT,
ADD COLUMN     "kpoppingLastSync" TIMESTAMP(3),
ADD COLUMN     "mbti" TEXT,
ADD COLUMN     "weight" TEXT;
