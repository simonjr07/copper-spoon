import { describe, expect, it, vi } from "vitest";

import {
  consumeRateLimit,
  hashRateLimitIdentity,
  type RateLimitRepository,
} from "@/features/security/rate-limit";

describe("durable rate limiting", () => {
  it("allows requests through the configured threshold and blocks the next one", async () => {
    let attempts = 0;
    const repository: RateLimitRepository = {
      consume: vi.fn(async ({ expiresAt }) => ({
        attemptCount: ++attempts,
        expiresAt,
      })),
    };
    const now = new Date("2026-09-29T00:01:00Z");

    for (let index = 0; index < 10; index += 1) {
      await expect(
        consumeRateLimit("LOGIN", ["hashed-client"], repository, now),
      ).resolves.toMatchObject({ allowed: true });
    }
    await expect(
      consumeRateLimit("LOGIN", ["hashed-client"], repository, now),
    ).resolves.toMatchObject({ allowed: false });
  });

  it("consumes both client and secondary login identities", async () => {
    const repository: RateLimitRepository = {
      consume: vi.fn(async ({ expiresAt }) => ({
        attemptCount: 1,
        expiresAt,
      })),
    };
    await consumeRateLimit(
      "LOGIN",
      ["client-hash", "account-hash"],
      repository,
      new Date("2026-09-29T00:01:00Z"),
    );
    expect(repository.consume).toHaveBeenCalledTimes(2);
  });

  it("stores a stable keyed digest rather than the raw identity", () => {
    const identity = "private@example.test";
    const secret = "a-secure-test-secret-with-32-characters";
    const digest = hashRateLimitIdentity(secret, "LOGIN", identity);

    expect(digest).toHaveLength(64);
    expect(digest).not.toContain(identity);
    expect(digest).toBe(hashRateLimitIdentity(secret, "LOGIN", identity));
    expect(digest).not.toBe(
      hashRateLimitIdentity(secret, "CHECKOUT", identity),
    );
  });
});
