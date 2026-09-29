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
  mode?: string | undefined;
  confirmation?: string | undefined;
  name: string | undefined;
  email: string | undefined;
  password: string | undefined;
};

export class AdminProvisionError extends Error {}

const productionConfirmation = "CREATE_PRODUCTION_ADMIN";

export async function provisionAdmin(
  environment: ProvisionEnvironment,
  repository: AdminProvisionRepository,
) {
  const mode = environment.mode ?? "development";

  if (mode === "development") {
    if (environment.nodeEnv !== "development") {
      throw new AdminProvisionError(
        "Development admin provisioning requires NODE_ENV=development.",
      );
    }
  } else if (mode === "production") {
    if (
      environment.nodeEnv !== "production" ||
      environment.confirmation !== productionConfirmation
    ) {
      throw new AdminProvisionError(
        "Production admin provisioning requires NODE_ENV=production and the exact confirmation value.",
      );
    }
  } else {
    throw new AdminProvisionError(
      "ADMIN_PROVISION_MODE must be development or production.",
    );
  }

  return createAdmin(environment, repository);
}

export async function provisionDevelopmentAdmin(
  environment: ProvisionEnvironment,
  repository: AdminProvisionRepository,
) {
  return provisionAdmin(
    { ...environment, mode: "development" },
    repository,
  );
}

async function createAdmin(
  environment: ProvisionEnvironment,
  repository: AdminProvisionRepository,
) {
  const parsedInput = adminProvisionSchema.safeParse({
    name: environment.name,
    email: environment.email,
    password: environment.password,
  });

  if (!parsedInput.success) {
    throw new AdminProvisionError(
      "Invalid provisioning input. Check the name, email, and password requirements.",
    );
  }

  const input = parsedInput.data;

  const existingUser = await repository.findByEmail(input.email);

  if (existingUser) {
    throw new AdminProvisionError(
      "A user with that email already exists; no changes were made.",
    );
  }

  const passwordHash = await hashPassword(input.password);

  return repository.createAdmin({
    name: input.name,
    email: input.email,
    passwordHash,
  });
}
