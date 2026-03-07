-- AlterTable User: add bio field
ALTER TABLE "User" ADD COLUMN "bio" VARCHAR(300);

-- AlterTable NotificationHistory: add readAt field + new index
ALTER TABLE "NotificationHistory" ADD COLUMN "readAt" TIMESTAMP(3);
CREATE INDEX "NotificationHistory_userId_type_readAt_idx" ON "NotificationHistory"("userId", "type", "readAt");

-- CreateTable UserList
CREATE TABLE "user_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserListItem
CREATE TABLE "user_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "note" VARCHAR(300),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_lists_userId_idx" ON "user_lists"("userId");

-- CreateIndex
CREATE INDEX "user_list_items_listId_idx" ON "user_list_items"("listId");

-- CreateIndex
CREATE INDEX "user_list_items_entityId_idx" ON "user_list_items"("entityId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "user_list_items_listId_entityType_entityId_key" ON "user_list_items"("listId", "entityType", "entityId");

-- AddForeignKey UserList -> User
ALTER TABLE "user_lists" ADD CONSTRAINT "user_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey UserListItem -> UserList
ALTER TABLE "user_list_items" ADD CONSTRAINT "user_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "user_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
