import { z } from "zod";

import { strongPasswordSchema } from "@/features/auth/schemas";

const userId = z.string().trim().min(1).max(64);
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.").max(254));

export const createStaffUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email,
  password: strongPasswordSchema,
  role: z.enum(["ADMIN", "STAFF"]),
});

export const editStaffUserSchema = z.object({
  id: userId,
  name: z.string().trim().min(2).max(120),
  email,
  role: z.enum(["ADMIN", "STAFF"]),
});

export const setStaffStatusSchema = z.object({
  id: userId,
  status: z.enum(["ACTIVE", "DISABLED"]),
});

export const resetStaffPasswordSchema = z.object({
  id: userId,
  password: strongPasswordSchema,
});

export type StaffRole = "ADMIN" | "STAFF";
export type StaffStatus = "ACTIVE" | "DISABLED";
export type StaffActor = { id: string; role: StaffRole };
export type SafeManagedUser = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
};

export type StaffMutationState = {
  status?: "success";
  message?: string;
  userId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export class StaffManagementError extends Error {
  constructor(
    public readonly code:
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "EMAIL_CONFLICT"
      | "SELF_STATUS_CHANGE"
      | "SELF_ROLE_CHANGE"
      | "SELF_PASSWORD_RESET"
      | "LAST_ACTIVE_ADMIN"
      | "CONCURRENT_CHANGE",
    message: string,
  ) {
    super(message);
    this.name = "StaffManagementError";
  }
}

export function requireAdminActor(actor: StaffActor) {
  if (actor.role !== "ADMIN") {
    throw new StaffManagementError("FORBIDDEN", "Administrator access is required.");
  }
}

export function enforceSelfRoleProtection(actorId: string, target: SafeManagedUser, requestedRole: StaffRole) {
  if (actorId === target.id && requestedRole !== target.role) {
    throw new StaffManagementError("SELF_ROLE_CHANGE", "You cannot change your own role.");
  }
}

export function enforceSelfStatusProtection(actorId: string, targetId: string, requestedStatus: StaffStatus) {
  if (actorId === targetId && requestedStatus !== "ACTIVE") {
    throw new StaffManagementError("SELF_STATUS_CHANGE", "You cannot disable your own account.");
  }
}

export function enforceLastActiveAdmin(
  target: SafeManagedUser,
  next: { role: StaffRole; status: StaffStatus },
  activeAdminCount: number,
) {
  const removesActiveAdmin = target.role === "ADMIN" && target.status === "ACTIVE" && (next.role !== "ADMIN" || next.status !== "ACTIVE");
  if (removesActiveAdmin && activeAdminCount <= 1) {
    throw new StaffManagementError("LAST_ACTIVE_ADMIN", "At least one active administrator must remain.");
  }
}

export function staffPersistenceError(error: unknown) {
  if (error instanceof StaffManagementError) return error;
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002") return new StaffManagementError("EMAIL_CONFLICT", "Another account already uses that email address.");
    if (error.code === "P2025") return new StaffManagementError("NOT_FOUND", "The staff account no longer exists.");
    if (error.code === "P2034") return new StaffManagementError("CONCURRENT_CHANGE", "Another administrator changed staff access at the same time. Review the current account and try again.");
  }
  return null;
}

