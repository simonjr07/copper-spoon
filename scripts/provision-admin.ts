import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { provisionDevelopmentAdmin } from "../src/server/auth/provision-admin";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required for development admin provisioning.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const admin = await provisionDevelopmentAdmin(
    {
      nodeEnv: process.env.NODE_ENV,
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
    `Created development ADMIN ${admin.email}. No password was logged.`,
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Development admin provisioning failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
