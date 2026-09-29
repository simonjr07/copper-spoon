CREATE TABLE "RateLimitBucket" (
    "keyHash" VARCHAR(64) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("keyHash", "action"),
    CONSTRAINT "RateLimitBucket_attemptCount_check" CHECK ("attemptCount" >= 1),
    CONSTRAINT "RateLimitBucket_expiry_check" CHECK ("expiresAt" > "windowStartedAt")
);

CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");
