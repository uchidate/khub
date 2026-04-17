-- AlterTable: add voteCount to Production
ALTER TABLE "Production" ADD COLUMN IF NOT EXISTS "voteCount" INTEGER;

-- AlterTable: add home post IDs to SystemSettings
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "homeFeaturedPostId" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "homeSecondaryPostIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "homeSidebarPostIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
