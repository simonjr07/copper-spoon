import { loginCredentialsSchema } from "@/features/auth/schemas";
import type { CredentialUser, SafeStaffUser } from "@/server/auth/types";
import { verifyPassword } from "@/server/auth/password";

const DUMMY_BCRYPT_HASH =
  "$2b$12$Y96U0eHQVXyBCyRDu3bt0.mT4Zi/y7uG8./UUKKQLR96JPdGe/NYS";

export type CredentialRepository = {
  findByEmail(email: string): Promise<CredentialUser | null>;
  recordSuccessfulLogin(userId: string, occurredAt: Date): Promise<void>;
};

export async function authenticateCredentials(
  input: unknown,
  repository: CredentialRepository,
): Promise<SafeStaffUser | null> {
  const parsed = loginCredentialsSchema.safeParse(input);

  if (!parsed.success) {
    return null;
  }

  const user = await repository.findByEmail(parsed.data.email);
  const passwordMatches = await verifyPassword(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_BCRYPT_HASH,
  );

  if (!user || !passwordMatches || user.status !== "ACTIVE") {
    return null;
  }

  await repository.recordSuccessfulLogin(user.id, new Date());

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
}
