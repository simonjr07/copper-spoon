import type { UserRole } from "@/generated/prisma/client";

export const staffPermissions = [
  "orders:read",
  "orders:update-status",
  "menu:read",
] as const;

export const adminPermissions = [
  ...staffPermissions,
  "menu:write",
  "categories:write",
  "staff:manage",
  "settings:write",
  "analytics:read",
] as const;

export type Permission = (typeof adminPermissions)[number];

const permissionsByRole: Record<UserRole, readonly Permission[]> = {
  ADMIN: adminPermissions,
  STAFF: staffPermissions,
};

export function roleHasPermission(role: UserRole, permission: Permission) {
  return permissionsByRole[role].includes(permission);
}

export function roleIsAllowed(role: UserRole, allowedRoles: readonly UserRole[]) {
  return allowedRoles.includes(role);
}
