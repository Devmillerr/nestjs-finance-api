CREATE TABLE "idempotency_keys" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "responseBody" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("userId", "key", "route")
);
CREATE INDEX "idempotency_keys_userId_idx" ON "idempotency_keys"("userId");

ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;
