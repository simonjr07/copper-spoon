import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  OptionSelectionType,
  PrismaClient,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type SeedOptionGroup = {
  name: string;
  selectionType: OptionSelectionType;
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  options: Array<{
    name: string;
    priceAdjustmentCents: number;
    sortOrder: number;
  }>;
};

async function seedOptionGroup(menuItemId: string, group: SeedOptionGroup) {
  const optionGroup = await prisma.menuItemOptionGroup.upsert({
    where: {
      menuItemId_name: {
        menuItemId,
        name: group.name,
      },
    },
    update: {
      selectionType: group.selectionType,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      sortOrder: group.sortOrder,
      isActive: true,
    },
    create: {
      menuItemId,
      name: group.name,
      selectionType: group.selectionType,
      minSelections: group.minSelections,
      maxSelections: group.maxSelections,
      sortOrder: group.sortOrder,
      isActive: true,
    },
  });

  for (const option of group.options) {
    await prisma.menuItemOption.upsert({
      where: {
        optionGroupId_name: {
          optionGroupId: optionGroup.id,
          name: option.name,
        },
      },
      update: {
        priceAdjustmentCents: option.priceAdjustmentCents,
        sortOrder: option.sortOrder,
        isAvailable: true,
      },
      create: {
        optionGroupId: optionGroup.id,
        name: option.name,
        priceAdjustmentCents: option.priceAdjustmentCents,
        sortOrder: option.sortOrder,
        isAvailable: true,
      },
    });
  }
}

async function main() {
  await prisma.restaurantSettings.upsert({
    where: { id: "restaurant-settings" },
    update: {
      restaurantName: "Copper Spoon Demo Kitchen",
      contactEmail: "hello@copperspoon.example",
      contactPhone: "+1 202-555-0147",
      currency: "USD",
      timezone: "America/New_York",
      pickupEnabled: true,
      deliveryEnabled: true,
      payOnPickupEnabled: true,
      payOnDeliveryEnabled: true,
      demoCardEnabled: true,
      deliveryFeeCents: 350,
      minimumDeliveryOrderCents: 1800,
    },
    create: {
      id: "restaurant-settings",
      restaurantName: "Copper Spoon Demo Kitchen",
      contactEmail: "hello@copperspoon.example",
      contactPhone: "+1 202-555-0147",
      addressLine1: "42 Market Lane",
      city: "Example Harbor",
      region: "NY",
      postalCode: "10001",
      country: "US",
      currency: "USD",
      timezone: "America/New_York",
      pickupEnabled: true,
      deliveryEnabled: true,
      payOnPickupEnabled: true,
      payOnDeliveryEnabled: true,
      demoCardEnabled: true,
      deliveryFeeCents: 350,
      minimumDeliveryOrderCents: 1800,
    },
  });

  const smallPlates = await prisma.category.upsert({
    where: { slug: "small-plates" },
    update: { name: "Small Plates", sortOrder: 10, isPublished: true },
    create: {
      slug: "small-plates",
      name: "Small Plates",
      description: "Bright, shareable starters from the fictional Copper Spoon kitchen.",
      sortOrder: 10,
      isPublished: true,
    },
  });

  const mains = await prisma.category.upsert({
    where: { slug: "mains" },
    update: { name: "Mains", sortOrder: 20, isPublished: true },
    create: {
      slug: "mains",
      name: "Mains",
      description: "Comforting plates built for lunch or dinner.",
      sortOrder: 20,
      isPublished: true,
    },
  });

  const drinks = await prisma.category.upsert({
    where: { slug: "drinks" },
    update: { name: "Drinks", sortOrder: 30, isPublished: true },
    create: {
      slug: "drinks",
      name: "Drinks",
      description: "House-made, alcohol-free refreshments.",
      sortOrder: 30,
      isPublished: true,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "roasted-tomato-toast" },
    update: {
      categoryId: smallPlates.id,
      name: "Roasted Tomato Toast",
      priceCents: 850,
      sortOrder: 10,
      isPublished: true,
      isAvailable: true,
      isArchived: false,
    },
    create: {
      categoryId: smallPlates.id,
      slug: "roasted-tomato-toast",
      name: "Roasted Tomato Toast",
      description: "Slow-roasted tomatoes, whipped herb cheese, and toasted sourdough.",
      priceCents: 850,
      sortOrder: 10,
      isPublished: true,
    },
  });

  const burger = await prisma.menuItem.upsert({
    where: { slug: "copper-spoon-burger" },
    update: {
      categoryId: mains.id,
      name: "Copper Spoon Burger",
      priceCents: 1450,
      sortOrder: 10,
      isPublished: true,
      isAvailable: true,
      isArchived: false,
    },
    create: {
      categoryId: mains.id,
      slug: "copper-spoon-burger",
      name: "Copper Spoon Burger",
      description: "A grilled beef patty, copper sauce, crisp leaves, and a toasted bun.",
      priceCents: 1450,
      sortOrder: 10,
      isPublished: true,
    },
  });

  await seedOptionGroup(burger.id, {
    name: "Choose a side",
    selectionType: OptionSelectionType.SINGLE,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 10,
    options: [
      { name: "Herb fries", priceAdjustmentCents: 0, sortOrder: 10 },
      { name: "Garden salad", priceAdjustmentCents: 100, sortOrder: 20 },
    ],
  });

  await seedOptionGroup(burger.id, {
    name: "Add extras",
    selectionType: OptionSelectionType.MULTIPLE,
    minSelections: 0,
    maxSelections: 2,
    sortOrder: 20,
    options: [
      { name: "Smoked cheddar", priceAdjustmentCents: 150, sortOrder: 10 },
      { name: "Caramelized onions", priceAdjustmentCents: 100, sortOrder: 20 },
    ],
  });

  await prisma.menuItem.upsert({
    where: { slug: "garden-grain-bowl" },
    update: {
      categoryId: mains.id,
      name: "Garden Grain Bowl",
      priceCents: 1250,
      sortOrder: 20,
      isPublished: true,
      isAvailable: true,
      isArchived: false,
    },
    create: {
      categoryId: mains.id,
      slug: "garden-grain-bowl",
      name: "Garden Grain Bowl",
      description: "Herbed grains, roasted vegetables, greens, and lemon tahini.",
      priceCents: 1250,
      sortOrder: 20,
      isPublished: true,
    },
  });

  const sparkler = await prisma.menuItem.upsert({
    where: { slug: "citrus-sparkler" },
    update: {
      categoryId: drinks.id,
      name: "Citrus Sparkler",
      priceCents: 450,
      sortOrder: 10,
      isPublished: true,
      isAvailable: true,
      isArchived: false,
    },
    create: {
      categoryId: drinks.id,
      slug: "citrus-sparkler",
      name: "Citrus Sparkler",
      description: "Fresh citrus, rosemary syrup, and sparkling water.",
      priceCents: 450,
      sortOrder: 10,
      isPublished: true,
    },
  });

  await seedOptionGroup(sparkler.id, {
    name: "Choose a size",
    selectionType: OptionSelectionType.SINGLE,
    minSelections: 1,
    maxSelections: 1,
    sortOrder: 10,
    options: [
      { name: "Regular", priceAdjustmentCents: 0, sortOrder: 10 },
      { name: "Large", priceAdjustmentCents: 125, sortOrder: 20 },
    ],
  });

  console.info("Seeded fictional Copper Spoon restaurant, categories, menu items, and options.");
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed the local development database.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
