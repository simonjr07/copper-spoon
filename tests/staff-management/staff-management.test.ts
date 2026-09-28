import bcrypt from "bcrypt";
import { describe, expect, it, vi } from "vitest";

import {
  createStaffUserSchema,
  type SafeManagedUser,
} from "@/features/staff-management/staff-management";
import {
  createManagedUser,
  editManagedUser,
  resetManagedUserPassword,
  setManagedUserStatus,
  type StaffManagementRepository,
} from "@/features/staff-management/staff-service";
import { BCRYPT_COST, hashPassword } from "@/server/auth/password";

const admin = (id = "admin-1"): SafeManagedUser => ({ id, name: "Fictional Admin", email: `${id}@copperspoon.example`, role: "ADMIN", status: "ACTIVE" });
const staff = (id = "staff-1"): SafeManagedUser => ({ id, name: "Fictional Staff", email: `${id}@copperspoon.example`, role: "STAFF", status: "ACTIVE" });

describe("staff-management input and password security", () => {
  it("normalizes email and enforces the existing strong password policy", () => {
    const valid = createStaffUserSchema.parse({ name: "Fictional Staff", email: " STAFF@COPPERSPOON.EXAMPLE ", password: "Strong-password-42!", role: "STAFF" });
    expect(valid.email).toBe("staff@copperspoon.example");
    expect(createStaffUserSchema.safeParse({ ...valid, password: "weak" }).success).toBe(false);
  });

  it("uses bcrypt cost 12 without retaining plaintext", async () => {
    const plaintext = "Strong-password-42!";
    const hash = await hashPassword(plaintext);
    expect(BCRYPT_COST).toBe(12);
    expect(hash).not.toBe(plaintext);
    expect(bcrypt.getRounds(hash)).toBe(12);
  });
});

describe("admin-only account lifecycle", () => {
  it("allows an ADMIN to create an ACTIVE STAFF account with no hash in the returned DTO", async () => {
    const fake = repository([admin()]);
    const result = await createManagedUser({ name: "New Staff", email: "new@copperspoon.example", passwordHash: "secret-hash", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(result).toMatchObject({ name: "New Staff", role: "STAFF", status: "ACTIVE" });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("rejects STAFF creation attempts before repository access", async () => {
    const fake = repository([admin(), staff()]);
    await expect(createManagedUser({ name: "Other", email: "other@copperspoon.example", passwordHash: "hash", role: "STAFF" }, { id: "staff-1", role: "STAFF" }, fake.repository)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(fake.create).not.toHaveBeenCalled();
  });

  it("maps duplicate email failures safely", async () => {
    const fake = repository([admin(), staff()]);
    await expect(createManagedUser({ name: "Duplicate", email: "staff-1@copperspoon.example", passwordHash: "hash", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "EMAIL_CONFLICT" });
  });

  it("allows an ADMIN to edit, disable, and reactivate STAFF", async () => {
    const fake = repository([admin(), staff()]);
    await editManagedUser({ id: "staff-1", name: "Updated Staff", email: "updated@copperspoon.example", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(fake.user("staff-1")).toMatchObject({ name: "Updated Staff", email: "updated@copperspoon.example" });
    await setManagedUserStatus({ id: "staff-1", status: "DISABLED" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(fake.user("staff-1")?.status).toBe("DISABLED");
    await setManagedUserStatus({ id: "staff-1", status: "ACTIVE" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(fake.user("staff-1")?.status).toBe("ACTIVE");
  });

  it("prevents self-disable and self-demotion", async () => {
    const fake = repository([admin(), admin("admin-2")]);
    await expect(setManagedUserStatus({ id: "admin-1", status: "DISABLED" }, { id: "admin-1", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "SELF_STATUS_CHANGE" });
    await expect(editManagedUser({ id: "admin-1", name: "Me", email: "me@copperspoon.example", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "SELF_ROLE_CHANGE" });
  });

  it("transactionally prevents disabling or demoting the last ACTIVE ADMIN", async () => {
    const fake = repository([admin(), staff()]);
    await expect(setManagedUserStatus({ id: "admin-1", status: "DISABLED" }, { id: "admin-2", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "LAST_ACTIVE_ADMIN" });
    await expect(editManagedUser({ id: "admin-1", name: "Admin", email: "admin@copperspoon.example", role: "STAFF" }, { id: "admin-2", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "LAST_ACTIVE_ADMIN" });
    expect(fake.user("admin-1")).toMatchObject({ role: "ADMIN", status: "ACTIVE" });
    expect(fake.transactions).toBe(2);
  });

  it("allows safe role changes when another ACTIVE ADMIN remains", async () => {
    const fake = repository([admin(), admin("admin-2")]);
    await editManagedUser({ id: "admin-2", name: "Second Admin", email: "second@copperspoon.example", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(fake.user("admin-2")?.role).toBe("STAFF");
  });

  it("maps a serializable transaction conflict without weakening the invariant", async () => {
    const fake = repository([admin(), admin("admin-2")], true);
    await expect(editManagedUser({ id: "admin-2", name: "Second", email: "second@copperspoon.example", role: "STAFF" }, { id: "admin-1", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "CONCURRENT_CHANGE" });
    expect(fake.user("admin-2")?.role).toBe("ADMIN");
  });

  it("allows ADMIN password reset for another user and blocks self-reset", async () => {
    const fake = repository([admin(), staff()]);
    await resetManagedUserPassword({ id: "staff-1", passwordHash: "new-hash" }, { id: "admin-1", role: "ADMIN" }, fake.repository);
    expect(fake.updatePassword).toHaveBeenCalledWith("staff-1", "new-hash");
    await expect(resetManagedUserPassword({ id: "admin-1", passwordHash: "new-hash" }, { id: "admin-1", role: "ADMIN" }, fake.repository)).rejects.toMatchObject({ code: "SELF_PASSWORD_RESET" });
  });
});

function repository(initialUsers: SafeManagedUser[], conflict = false) {
  let users = structuredClone(initialUsers);
  let transactions = 0;
  const create = vi.fn(async (input: { name: string; email: string; passwordHash: string; role: "ADMIN" | "STAFF" }) => {
    if (users.some((user) => user.email === input.email)) throw Object.assign(new Error("unique"), { code: "P2002" });
    const created: SafeManagedUser = { id: `user-${users.length + 1}`, name: input.name, email: input.email, role: input.role, status: "ACTIVE" };
    users.push(created);
    return created;
  });
  const updatePassword = vi.fn(async (id: string) => { if (!users.some((user) => user.id === id)) throw Object.assign(new Error("missing"), { code: "P2025" }); });
  const managedRepository: StaffManagementRepository = {
    create,
    updatePassword,
    async transaction(work) {
      transactions += 1;
      const before = structuredClone(users);
      if (conflict) throw Object.assign(new Error("serialization"), { code: "P2034" });
      try {
        return await work({
          async findUser(id) { return users.find((user) => user.id === id) ?? null; },
          async countActiveAdmins() { return users.filter((user) => user.role === "ADMIN" && user.status === "ACTIVE").length; },
          async updateProfile(input) { const index = users.findIndex((user) => user.id === input.id); if (index < 0) throw Object.assign(new Error("missing"), { code: "P2025" }); users[index] = { ...users[index]!, ...input }; return users[index]!; },
          async updateStatus(input) { const index = users.findIndex((user) => user.id === input.id); if (index < 0) throw Object.assign(new Error("missing"), { code: "P2025" }); users[index] = { ...users[index]!, status: input.status }; return users[index]!; },
        });
      } catch (error) { users = before; throw error; }
    },
  };
  return { repository: managedRepository, create, updatePassword, user: (id: string) => users.find((user) => user.id === id), get transactions() { return transactions; } };
}
