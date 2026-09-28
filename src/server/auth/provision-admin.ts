import { adminProvisionSchema } from "@/features/auth/schemas";
import { hashPassword } from "@/server/auth/password";
import type { SafeStaffUser } from "@/server/auth/types";

export type AdminProvisionRepository = {
  findByEmail(email: string): Promise<{ id: string } | null>;
  createAdmin(input: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<SafeStaffUser>;
};

type ProvisionEnvironment = {
  nodeEnv: string | undefined;
  name: string | undefined;
  email: string | undefined;
  password: string | undefined;
};

export async function provisionDevelopmentAdmin(
  environment: ProvisionEnvironment,
  repository: AdminProvisionRepository,
) {
  if (environment.nodeEnv !== "development") {
    throw new Error("Admin provisioning is allowed only when NODE_ENV=development.");
  }

  const parsedInput = adminProvisionSchema.safeParse({
    name: environment.name,
    email: environment.email,
    password: environment.password,
  });

  if (!parsedInput.success) {
    throw new Error(
      "Invalid provisioning input. Check the name, email, and password requirements.",
    );
  }

  const input = parsedInput.data;

  const existingUser = await repository.findByEmail(input.email);

  if (existingUser) {
    throw new Error("A user with that email already exists; no changes were made.");
  }

  const passwordHash = await hashPassword(input.password);

  return repository.createAdmin({
    name: input.name,
    email: input.email,
    passwordHash,
  });
}
