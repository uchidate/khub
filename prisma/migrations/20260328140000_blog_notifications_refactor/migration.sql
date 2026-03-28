-- Migration: blog_notifications_refactor
-- Renames emailOnNewNews → emailOnNewBlog and removes article-filter fields
-- that are not applicable to blog post notifications.

-- 1. Add new column, inheriting current value
ALTER TABLE "UserNotificationSettings" ADD COLUMN "emailOnNewBlog" BOOLEAN NOT NULL DEFAULT true;
UPDATE "UserNotificationSettings" SET "emailOnNewBlog" = "emailOnNewNews";

-- 2. Drop obsolete columns
ALTER TABLE "UserNotificationSettings" DROP COLUMN "emailOnNewNews";
ALTER TABLE "UserNotificationSettings" DROP COLUMN "onlyFavoriteArtists";
ALTER TABLE "UserNotificationSettings" DROP COLUMN "minNewsImportance";
