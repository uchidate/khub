-- CreateTable: UserNotificationSettings
-- Armazena preferências de notificação de cada usuário
CREATE TABLE IF NOT EXISTS "UserNotificationSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    -- Tipos de notificação
    "emailOnNewNews" BOOLEAN NOT NULL DEFAULT true,
    "emailDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailDigestFrequency" TEXT NOT NULL DEFAULT 'DAILY', -- 'DAILY', 'WEEKLY', 'NEVER'
    "emailDigestTime" TEXT NOT NULL DEFAULT '09:00', -- HH:mm format

    -- Filtros
    "onlyFavoriteArtists" BOOLEAN NOT NULL DEFAULT true,
    "minNewsImportance" TEXT NOT NULL DEFAULT 'ALL', -- 'ALL', 'HIGH', 'CRITICAL'

    -- Metadados
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NotificationHistory
-- Registra todas as notificações enviadas para auditoria e evitar duplicatas
CREATE TABLE IF NOT EXISTS "NotificationHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newsId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'EMAIL_INSTANT', 'EMAIL_DIGEST', 'PUSH' (futuro)
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    -- Metadados
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationHistory_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: 1 configuração por usuário
CREATE UNIQUE INDEX IF NOT EXISTS "UserNotificationSettings_userId_key"
    ON "UserNotificationSettings"("userId");

-- Índices para performance
CREATE INDEX IF NOT EXISTS "UserNotificationSettings_userId_idx"
    ON "UserNotificationSettings"("userId");

CREATE INDEX IF NOT EXISTS "NotificationHistory_userId_idx"
    ON "NotificationHistory"("userId");

CREATE INDEX IF NOT EXISTS "NotificationHistory_newsId_idx"
    ON "NotificationHistory"("newsId");

CREATE INDEX IF NOT EXISTS "NotificationHistory_type_idx"
    ON "NotificationHistory"("type");

CREATE INDEX IF NOT EXISTS "NotificationHistory_status_idx"
    ON "NotificationHistory"("status");

CREATE INDEX IF NOT EXISTS "NotificationHistory_createdAt_idx"
    ON "NotificationHistory"("createdAt");

-- Índice composto para verificar duplicatas
CREATE INDEX IF NOT EXISTS "NotificationHistory_userId_newsId_type_idx"
    ON "NotificationHistory"("userId", "newsId", "type");

-- Foreign keys
ALTER TABLE "UserNotificationSettings"
    ADD CONSTRAINT "UserNotificationSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NotificationHistory"
    ADD CONSTRAINT "NotificationHistory_newsId_fkey"
    FOREIGN KEY ("newsId") REFERENCES "News"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Criar configurações padrão para usuários existentes
INSERT INTO "UserNotificationSettings" (
    "id",
    "userId",
    "emailOnNewNews",
    "emailDigestEnabled",
    "emailDigestFrequency",
    "emailDigestTime",
    "onlyFavoriteArtists",
    "minNewsImportance",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "id" as "userId",
    true,
    true,
    'DAILY',
    '09:00',
    true,
    'ALL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
    SELECT 1 FROM "UserNotificationSettings" WHERE "userId" = "User"."id"
);
