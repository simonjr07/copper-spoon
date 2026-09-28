import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/client";

import { auth } from "@/auth";
import { resolveActiveUser } from "@/server/auth/active-user";
import { prisma } from "@/server/db/prisma";
import {
  roleHasPermission,
  roleIsAllowed,
  type Permission,
} from "@/server/auth/permissions";

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Authentication is required.");
    this.name = "AuthenticationRequiredError";
  }
}

export class AuthorizationDeniedError extends Error {
  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationDeniedError";
  }
}

const activeUserRepository = {
  findSafeUserById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  },
};

export const getActiveUser = cache(async () => {
  const session = await auth();
  return resolveActiveUser(session?.user ?? null, activeUserRepository);
});

export async function requireAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthenticationRequiredError();
  }

  return session.user;
}

export async function requireActiveUser() {
  const user = await getActiveUser();

  if (!user) {
    throw new AuthenticationRequiredError();
  }

  return user;
}

export async function requireActiveUserForPage() {
  const user = await getActiveUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export async function requireRole(...allowedRoles: UserRole[]) {
  const user = await requireActiveUser();

  if (!roleIsAllowed(user.role, allowedRoles)) {
    throw new AuthorizationDeniedError();
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireActiveUser();

  if (!roleHasPermission(user.role, permission)) {
    throw new AuthorizationDeniedError();
  }

  return user;
}
