CREATE TABLE "FriendMessage" (
  "id" TEXT NOT NULL,
  "friendshipId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FriendMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FriendMessage_friendshipId_idx" ON "FriendMessage"("friendshipId");
CREATE INDEX "FriendMessage_senderId_idx" ON "FriendMessage"("senderId");
CREATE INDEX "FriendMessage_createdAt_idx" ON "FriendMessage"("createdAt");

ALTER TABLE "FriendMessage" ADD CONSTRAINT "FriendMessage_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FriendMessage" ADD CONSTRAINT "FriendMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
