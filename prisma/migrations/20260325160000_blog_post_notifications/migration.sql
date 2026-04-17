-- Make newsId optional and add blogPostId to NotificationHistory

ALTER TABLE "NotificationHistory" ALTER COLUMN "newsId" DROP NOT NULL;

ALTER TABLE "NotificationHistory" ADD COLUMN "blogPostId" TEXT;

ALTER TABLE "NotificationHistory" ADD CONSTRAINT "NotificationHistory_blogPostId_fkey"
  FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "NotificationHistory_blogPostId_idx" ON "NotificationHistory"("blogPostId");
