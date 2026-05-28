-- Migrate Comment from News to BlogPost
-- Since news pages were never publicly exposed, there are no real user comments to preserve.
-- We truncate and recreate the constraint.

TRUNCATE TABLE "Comment";

ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_newsId_fkey";
ALTER TABLE "Comment" DROP COLUMN IF EXISTS "newsId";

ALTER TABLE "Comment" ADD COLUMN "blogPostId" TEXT NOT NULL DEFAULT '';
-- Remove the temporary default after adding the column
ALTER TABLE "Comment" ALTER COLUMN "blogPostId" DROP DEFAULT;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_blogPostId_fkey"
  FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old index, add new ones
DROP INDEX IF EXISTS "Comment_newsId_idx";
DROP INDEX IF EXISTS "Comment_newsId_createdAt_idx";

CREATE INDEX IF NOT EXISTS "Comment_blogPostId_idx" ON "Comment"("blogPostId");
CREATE INDEX IF NOT EXISTS "Comment_blogPostId_createdAt_idx" ON "Comment"("blogPostId", "createdAt");
