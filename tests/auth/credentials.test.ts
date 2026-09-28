import bcrypt from "bcrypt";
import { describe, expect, it, vi } from "vitest";

import {
  authenticateCredentials,
  type CredentialRepository,
} from "@/server/auth/credentials";
import type { CredentialUser } from "@/server/auth/types";

const activeAdmin: CredentialUser = {
  id: "user_admin",
  name: "Fictional Admin",
  email: "admin@copperspoon.example",
  passwordHash: "",
  role: "ADMIN",
  status: "ACTIVE",
};

function createRepository(user: CredentialUser | null): CredentialRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(user),
    recordSuccessfulLogin: vi.fn().mockResolvedValue(undefined),
  };
}

describe("authenticateCredentials", () => {
  it("authenticates valid credentials and returns no password hash", async () => {
    const repository = createRepository({
      ...activeAdmin,
      passwordHash: await bcrypt.hash("Valid-password-42!", 4),
    });

    const result = await authenticateCredentials(
      {
        email: "  ADMIN@COPPERSPOON.EXAMPLE ",
        password: "Valid-password-42!",
      },
      repository,
    );

    expect(result).toEqual({
      id: activeAdmin.id,
      name: activeAdmin.name,
      email: activeAdmin.email,
      role: "ADMIN",
      status: "ACTIVE",
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(repository.findByEmail).toHaveBeenCalledWith(activeAdmin.email);
    expect(repository.recordSuccessfulLogin).toHaveBeenCalledOnce();
  });

  it("rejects an invalid password", async () => {
    const repository = createRepository({
      ...activeAdmin,
      passwordHash: await bcrypt.hash("Valid-password-42!", 4),
    });

    await expect(
      authenticateCredentials(
        { email: activeAdmin.email, password: "wrong-password" },
        repository,
      ),
    ).resolves.toBeNull();
    expect(repository.recordSuccessfulLogin).not.toHaveBeenCalled();
  });

  it("rejects an unknown email with the same public result", async () => {
    const repository = createRepository(null);

    await expect(
      authenticateCredentials(
        {
          email: "unknown@copperspoon.example",
          password: "Valid-password-42!",
        },
        repository,
      ),
    ).resolves.toBeNull();
    expect(repository.recordSuccessfulLogin).not.toHaveBeenCalled();
  });

  it("rejects a disabled account even with the correct password", async () => {
    const repository = createRepository({
      ...activeAdmin,
      status: "DISABLED",
      passwordHash: await bcrypt.hash("Valid-password-42!", 4),
    });

    await expect(
      authenticateCredentials(
        {
          email: activeAdmin.email,
          password: "Valid-password-42!",
        },
        repository,
      ),
    ).resolves.toBeNull();
    expect(repository.recordSuccessfulLogin).not.toHaveBeenCalled();
  });
});
