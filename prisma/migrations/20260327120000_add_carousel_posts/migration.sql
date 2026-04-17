-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "homeCarouselPostIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
