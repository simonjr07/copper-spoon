import { createHmac } from "node:crypto";

export type RateLimitAction = "LOGIN" | "CHECKOUT" | "ORDER_LOOKUP";

type RateLimitPolicy = {
  maximumAttempts: number;
  windowMs: number;
};

export type RateLimitRepository = {
  consume(input: {
    action: RateLimitAction;
    keyHash: string;
    windowStartedAt: Date;
    expiresAt: Date;
  }): Promise<{ attemptCount: number; expiresAt: Date }>;
};

const policies: Record<RateLimitAction, RateLimitPolicy> = {
  LOGIN: { maximumAttempts: 10, windowMs: 15 * 60 * 1000 },
  CHECKOUT: { maximumAttempts: 12, windowMs: 10 * 60 * 1000 },
  ORDER_LOOKUP: { maximumAttempts: 60, windowMs: 10 * 60 * 1000 },
};

export async function consumeRateLimit(
  action: RateLimitAction,
  keyHashes: string[],
  repository: RateLimitRepository,
  now = new Date(),
) {
  const policy = policies[action];
  const windowStartedAt = new Date(
    Math.floor(now.getTime() / policy.windowMs) * policy.windowMs,
  );
  const expiresAt = new Date(windowStartedAt.getTime() + policy.windowMs);
  const results = await Promise.all(
    keyHashes.map((keyHash) =>
      repository.consume({ action, keyHash, windowStartedAt, expiresAt }),
    ),
  );
  const blocked = results.find(
    (result) => result.attemptCount > policy.maximumAttempts,
  );

  return {
    allowed: !blocked,
    retryAt: blocked?.expiresAt ?? expiresAt,
  };
}

export function hashRateLimitIdentity(
  secret: string,
  action: RateLimitAction,
  identity: string,
) {
  return createHmac("sha256", secret)
    .update(`${action}:${identity}`)
    .digest("hex");
}
