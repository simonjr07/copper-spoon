import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import {
  bootstrapProductionDemoCatalog,
  productionDemoCatalogSummary,
} from "../src/server/menu/demo-catalog-bootstrap";

const expectedConfirmation = "BOOTSTRAP_PRODUCTION_DEMO_CATALOG";
const bootstrapTransactionOptions = {
  maxWait: 10_000,
  timeout: 60_000,
} as const;

const connectionFailureCodes = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
]);
const constraintFailureCodes = new Set([
  "P2002",
  "P2003",
  "P2004",
  "P2011",
  "P2014",
]);

function getSafeFailureCategory(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "connection failure";
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2028") {
      return "transaction timeout or transaction API failure";
    }
    if (connectionFailureCodes.has(error.code)) {
      return "connection failure";
    }
    if (constraintFailureCodes.has(error.code)) {
      return "constraint failure";
    }
  }

  return "unexpected failure";
}

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
    const result = await prisma.$transaction(
      (transaction) => bootstrapProductionDemoCatalog(transaction),
      bootstrapTransactionOptions,
    );

    console.info(
      `Production demo catalog bootstrap completed: ${result.categoryCount} categories, ${result.menuItemCount} menu items, ${result.optionGroupCount} option groups, and ${result.optionCount} options are present. Existing matching records were left unchanged.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    `Production demo catalog bootstrap failed (${getSafeFailureCategory(error)}). No database details were logged. Expected catalog: ${productionDemoCatalogSummary.categoryCount} categories and ${productionDemoCatalogSummary.menuItemCount} menu items.`,
  );
  process.exitCode = 1;
});
