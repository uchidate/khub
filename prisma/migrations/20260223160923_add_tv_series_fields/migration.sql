-- AlterTable
ALTER TABLE "Production" ADD COLUMN     "episodeCount" INTEGER,
ADD COLUMN     "episodeRuntime" INTEGER,
ADD COLUMN     "network" TEXT,
ADD COLUMN     "productionStatus" TEXT,
ADD COLUMN     "seasonCount" INTEGER;
