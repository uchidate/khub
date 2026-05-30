ALTER TABLE "Production" ADD COLUMN IF NOT EXISTS "suspicionDismissedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Production_suspicionDismissedAt_idx" ON "Production"("suspicionDismissedAt");
