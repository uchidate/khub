-- DropIndex
DROP INDEX "NotificationHistory_userId_newsId_type_idx";

-- DropIndex
DROP INDEX "Production_categoryId_idx";

-- AlterTable
ALTER TABLE "StoreProduct" ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "seo_meta" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "system_settings" ALTER COLUMN "homeSecondaryPostIds" DROP DEFAULT,
ALTER COLUMN "homeSidebarPostIds" DROP DEFAULT,
ALTER COLUMN "homeCarouselPostIds" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BlogPostVersion" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" VARCHAR(600),
    "contentMd" TEXT NOT NULL,
    "blocks" JSONB,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedById" TEXT NOT NULL,
    "note" VARCHAR(300),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "label" VARCHAR(100),

    CONSTRAINT "BlogPostVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogPostVersion_blogPostId_savedAt_idx" ON "BlogPostVersion"("blogPostId", "savedAt");

-- CreateIndex
CREATE INDEX "BlogPost_status_isPrivate_publishedAt_idx" ON "BlogPost"("status", "isPrivate", "publishedAt");

-- AddForeignKey
ALTER TABLE "BlogPostVersion" ADD CONSTRAINT "BlogPostVersion_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostVersion" ADD CONSTRAINT "BlogPostVersion_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
