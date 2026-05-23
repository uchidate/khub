CREATE TABLE "QuizResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'all',
    "timeHistory" JSONB NOT NULL,
    "categoryBreakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuizResult_userId_idx" ON "QuizResult"("userId");
CREATE INDEX "QuizResult_difficulty_idx" ON "QuizResult"("difficulty");
CREATE INDEX "QuizResult_createdAt_idx" ON "QuizResult"("createdAt");

ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
