-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "allowAdultContent" BOOLEAN NOT NULL DEFAULT false,
    "allowUnclassifiedContent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "allowedRatings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_content_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_content_preferences_userId_key" ON "user_content_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_content_preferences_userId_idx" ON "user_content_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_content_preferences" ADD CONSTRAINT "user_content_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
