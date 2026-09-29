import "server-only";

import { headers } from "next/headers";

import {
  consumeRateLimit,
  hashRateLimitIdentity,
  type RateLimitAction,
  type RateLimitRepository,
} from "@/features/security/rate-limit";
import { prisma } from "@/server/db/prisma";

const globalRateLimit = globalThis as typeof globalThis & {
  copperSpoonRateLimitCleanupAt?: number;
};

export async function checkRequestRateLimit(
  action: RateLimitAction,
  secondaryIdentity?: string,
) {
  const requestHeaders = await headers();
  const forwarded =
    requestHeaders.get("x-vercel-forwarded-for") ??
    requestHeaders.get("x-forwarded-for") ??
    requestHeaders.get("x-real-ip");
  const clientIdentity = normalizeIdentity(
    forwarded?.split(",")[0] ?? "unknown-client",
  );
  const identities = secondaryIdentity
    ? [
        `client:${clientIdentity}`,
        `secondary:${normalizeIdentity(secondaryIdentity)}`,
      ]
    : [`client:${clientIdentity}`];
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Rate limiting requires RATE_LIMIT_SECRET or AUTH_SECRET with at least 32 characters.",
    );
  }

  await pruneExpiredBuckets();

  return consumeRateLimit(
    action,
    identities.map((identity) =>
      hashRateLimitIdentity(secret, action, identity),
    ),
    prismaRateLimitRepository,
  );
}

const prismaRateLimitRepository: RateLimitRepository = {
  async consume(input) {
    const rows = await prisma.$queryRaw<
      Array<{ attemptCount: number; expiresAt: Date }>
    >`
      INSERT INTO "RateLimitBucket" (
        "keyHash", "action", "windowStartedAt", "attemptCount", "expiresAt"
      ) VALUES (
        ${input.keyHash}, ${input.action}, ${input.windowStartedAt}, 1, ${input.expiresAt}
      )
      ON CONFLICT ("keyHash", "action") DO UPDATE SET
        "attemptCount" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" < EXCLUDED."windowStartedAt" THEN 1
          ELSE "RateLimitBucket"."attemptCount" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" < EXCLUDED."windowStartedAt" THEN EXCLUDED."windowStartedAt"
          ELSE "RateLimitBucket"."windowStartedAt"
        END,
        "expiresAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" < EXCLUDED."windowStartedAt" THEN EXCLUDED."expiresAt"
          ELSE "RateLimitBucket"."expiresAt"
        END
      RETURNING "attemptCount", "expiresAt"
    `;

    const result = rows[0];
    if (!result) {
      throw new Error("Rate-limit bucket update returned no result.");
    }
    return result;
  },
};

async function pruneExpiredBuckets(now = new Date()) {
  const lastCleanup = globalRateLimit.copperSpoonRateLimitCleanupAt ?? 0;
  if (now.getTime() - lastCleanup < 15 * 60 * 1000) return;

  globalRateLimit.copperSpoonRateLimitCleanupAt = now.getTime();
  await prisma.rateLimitBucket.deleteMany({
    where: { expiresAt: { lt: now } },
  });
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase().slice(0, 254) || "unknown-client";
}
