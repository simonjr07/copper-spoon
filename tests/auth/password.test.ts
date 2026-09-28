import bcrypt from "bcrypt";
import { describe, expect, it } from "vitest";

import {
  BCRYPT_COST,
  hashPassword,
  verifyPassword,
} from "@/server/auth/password";

describe("password hashing", () => {
  it("hashes with bcrypt cost 12 and verifies without storing plaintext", async () => {
    const password = "Development-only-42!";
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toContain(password);
    expect(bcrypt.getRounds(passwordHash)).toBe(BCRYPT_COST);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(
      verifyPassword("not-the-password", passwordHash),
    ).resolves.toBe(false);
  });
});
