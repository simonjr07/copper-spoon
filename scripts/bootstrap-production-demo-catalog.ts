import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import {
  bootstrapProductionDemoCatalog,
  productionDemoCatalogSummary,
} from "../src/server/menu/demo-catalog-bootstrap";

const expectedConfirmation = "BOOTSTRAP_PRODUCTION_DEMO_CATALOG";

function assertProductionConfirmation() {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Production demo catalog bootstrap requires NODE_ENV=production.");
  }

  if (process.env.PRODUCTION_DEMO_CATALOG_CONFIRM !== expectedConfirmation) {
    throw new Error(
      `Production demo catalog bootstrap requires PRODUCTION_DEMO_CATALOG_CONFIRM=${expectedConfirmation}.`,
    );
  }
}

async function main() {
  assertProductionConfirmation();

  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URL is required for production demo catalog bootstrap.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const result = await prisma.$transaction((transaction) =>
      bootstrapProductionDemoCatalog(transaction),
    );

    console.info(
      `Production demo catalog bootstrap completed: ${result.categoryCount} categories, ${result.menuItemCount} menu items, ${result.optionGroupCount} option groups, and ${result.optionCount} options are present. Existing matching records were left unchanged.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    `Production demo catalog bootstrap failed. No database details were logged. Expected catalog: ${productionDemoCatalogSummary.categoryCount} categories and ${productionDemoCatalogSummary.menuItemCount} menu items.`,
  );
  process.exitCode = 1;
});
