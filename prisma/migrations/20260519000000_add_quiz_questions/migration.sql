-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "relatedHref" TEXT,
    "relatedLabel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizQuestion_category_difficulty_isActive_idx" ON "QuizQuestion"("category", "difficulty", "isActive");

-- CreateIndex
CREATE INDEX "QuizQuestion_isActive_idx" ON "QuizQuestion"("isActive");
