import "server-only";

import { prisma } from "@/server/db/prisma";
import type { CredentialRepository } from "@/server/auth/credentials";

export const credentialRepository: CredentialRepository = {
  findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });
  },
  async recordSuccessfulLogin(userId, occurredAt) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: occurredAt },
      select: { id: true },
    });
  },
};
