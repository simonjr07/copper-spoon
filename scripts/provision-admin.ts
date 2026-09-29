import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  AdminProvisionError,
  provisionAdmin,
} from "../src/server/auth/provision-admin";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for admin provisioning.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const mode = process.env.ADMIN_PROVISION_MODE ?? "development";
  const admin = await provisionAdmin(
    {
      nodeEnv: process.env.NODE_ENV,
      mode,
      confirmation: process.env.ADMIN_PROVISION_CONFIRM,
      name: process.env.ADMIN_PROVISION_NAME,
      email: process.env.ADMIN_PROVISION_EMAIL,
      password: process.env.ADMIN_PROVISION_PASSWORD,
    },
    {
      findByEmail(email) {
        return prisma.user.findUnique({
          where: { email },
          select: { id: true },
        });
      },
      createAdmin(input) {
        return prisma.user.create({
          data: {
            ...input,
            role: "ADMIN",
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        });
      },
    },
  );

  console.info(
    `Created ${mode} ADMIN ${admin.email}. No password was logged.`,
  );
}

main()
  .catch((error: unknown) => {
    const message =
      error instanceof AdminProvisionError
        ? error.message
        : "Unexpected provisioning failure; no database details were logged.";
    console.error(`Admin provisioning failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
