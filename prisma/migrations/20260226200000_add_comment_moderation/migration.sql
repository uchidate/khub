-- AddColumn: status, moderationNote, moderatedById, moderatedAt to Comment
ALTER TABLE "Comment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Comment" ADD COLUMN "moderationNote" TEXT;
ALTER TABLE "Comment" ADD COLUMN "moderatedById" TEXT;
ALTER TABLE "Comment" ADD COLUMN "moderatedAt" TIMESTAMP(3);

-- CreateIndex: status
CREATE INDEX "Comment_status_idx" ON "Comment"("status");
