import { describe, expect, it, vi } from "vitest";

import { resolveActiveUser } from "@/server/auth/active-user";
import {
  roleHasPermission,
  roleIsAllowed,
} from "@/server/auth/permissions";
import type { SafeStaffUser } from "@/server/auth/types";

const admin: SafeStaffUser = {
  id: "admin-id",
  name: "Fictional Admin",
  email: "admin@copperspoon.example",
  role: "ADMIN",
  status: "ACTIVE",
};

describe("authorization policy", () => {
  it("allows ADMIN capabilities", () => {
    expect(roleHasPermission("ADMIN", "staff:manage")).toBe(true);
    expect(roleHasPermission("ADMIN", "settings:write")).toBe(true);
    expect(roleIsAllowed("ADMIN", ["ADMIN"])).toBe(true);
  });

  it("blocks STAFF from ADMIN-only capabilities", () => {
    expect(roleHasPermission("STAFF", "staff:manage")).toBe(false);
    expect(roleHasPermission("STAFF", "settings:write")).toBe(false);
    expect(roleHasPermission("STAFF", "orders:update-status")).toBe(true);
    expect(roleIsAllowed("STAFF", ["ADMIN"])).toBe(false);
  });
});

describe("resolveActiveUser", () => {
  it("rejects a request without an authenticated identity", async () => {
    const repository = { findSafeUserById: vi.fn() };

    await expect(resolveActiveUser(null, repository)).resolves.toBeNull();
    expect(repository.findSafeUserById).not.toHaveBeenCalled();
  });

  it("rechecks and returns the current ACTIVE database user", async () => {
    const repository = {
      findSafeUserById: vi.fn().mockResolvedValue(admin),
    };

    await expect(
      resolveActiveUser({ id: admin.id }, repository),
    ).resolves.toEqual(admin);
    expect(repository.findSafeUserById).toHaveBeenCalledWith(admin.id);
  });

  it("rejects a stale session for a user now marked DISABLED", async () => {
    const repository = {
      findSafeUserById: vi.fn().mockResolvedValue({
        ...admin,
        status: "DISABLED",
      }),
    };

    await expect(
      resolveActiveUser({ id: admin.id }, repository),
    ).resolves.toBeNull();
  });
});
