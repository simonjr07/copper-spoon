import type { SafeStaffUser, SessionIdentity } from "@/server/auth/types";

export type ActiveUserRepository = {
  findSafeUserById(userId: string): Promise<SafeStaffUser | null>;
};

export async function resolveActiveUser(
  identity: SessionIdentity,
  repository: ActiveUserRepository,
) {
  if (!identity?.id) {
    return null;
  }

  const user = await repository.findSafeUserById(identity.id);

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}
