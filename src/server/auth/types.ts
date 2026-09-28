import type { UserRole, UserStatus } from "@/generated/prisma/client";

export type SafeStaffUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

export type CredentialUser = SafeStaffUser & {
  passwordHash: string;
};

export type SessionIdentity = {
  id?: string;
} | null;
