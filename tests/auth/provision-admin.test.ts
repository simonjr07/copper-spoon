import bcrypt from "bcrypt";
import { describe, expect, it, vi } from "vitest";

import {
  provisionDevelopmentAdmin,
  type AdminProvisionRepository,
} from "@/server/auth/provision-admin";

function createRepository(existing: { id: string } | null = null) {
  const repository: AdminProvisionRepository = {
    findByEmail: vi.fn().mockResolvedValue(existing),
    createAdmin: vi.fn().mockImplementation(async (input) => ({
      id: "created-admin",
      name: input.name,
      email: input.email,
      role: "ADMIN",
      status: "ACTIVE",
    })),
  };

  return repository;
}

const validEnvironment = {
  nodeEnv: "development",
  name: "Fictional Admin",
  email: "ADMIN@COPPERSPOON.EXAMPLE",
  password: "Development-only-42!",
};

describe("development admin provisioning", () => {
  it("refuses to run outside development", async () => {
    const repository = createRepository();

    await expect(
      provisionDevelopmentAdmin(
        { ...validEnvironment, nodeEnv: "production" },
        repository,
      ),
    ).rejects.toThrow("only when NODE_ENV=development");
    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.createAdmin).not.toHaveBeenCalled();
  });

  it("refuses an existing email without changing the user", async () => {
    const repository = createRepository({ id: "existing-user" });

    await expect(
      provisionDevelopmentAdmin(validEnvironment, repository),
    ).rejects.toThrow("already exists");
    expect(repository.createAdmin).not.toHaveBeenCalled();
  });

  it("rejects invalid input without echoing sensitive values", async () => {
    const repository = createRepository();
    const password = "too-short";

    await expect(
      provisionDevelopmentAdmin(
        { ...validEnvironment, password },
        repository,
      ),
    ).rejects.toThrow(
      "Invalid provisioning input. Check the name, email, and password requirements.",
    );
    expect(repository.findByEmail).not.toHaveBeenCalled();
    expect(repository.createAdmin).not.toHaveBeenCalled();
  });

  it("normalizes input and creates an ACTIVE ADMIN with a cost-12 hash", async () => {
    const repository = createRepository();

    const result = await provisionDevelopmentAdmin(
      validEnvironment,
      repository,
    );

    expect(result.role).toBe("ADMIN");
    expect(result.status).toBe("ACTIVE");
    expect(repository.createAdmin).toHaveBeenCalledOnce();

    const createInput = vi.mocked(repository.createAdmin).mock.calls[0]?.[0];
    expect(createInput?.email).toBe("admin@copperspoon.example");
    expect(createInput?.passwordHash).not.toBe(validEnvironment.password);
    expect(bcrypt.getRounds(createInput?.passwordHash ?? "")).toBe(12);
  });
});
