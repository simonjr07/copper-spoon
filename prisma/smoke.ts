import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the database smoke check.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const [settings, categoryCount, menuItemCount] = await Promise.all([
    prisma.restaurantSettings.findUnique({
      where: { id: "restaurant-settings" },
      select: { restaurantName: true, currency: true, timezone: true },
    }),
    prisma.category.count(),
    prisma.menuItem.count(),
  ]);

  console.info(
    JSON.stringify(
      {
        connected: true,
        settings,
        categoryCount,
        menuItemCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch(() => {
    console.error("Database smoke check failed; details were withheld.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
