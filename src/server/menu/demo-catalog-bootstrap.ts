import type { Prisma } from "@/generated/prisma/client";
import { OptionSelectionType } from "@/generated/prisma/client";

type DemoCatalogClient = Pick<
  Prisma.TransactionClient,
  "category" | "menuItem" | "menuItemOptionGroup" | "menuItemOption"
>;

type DemoOptionGroup = {
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

type DemoMenuItem = {
  categorySlug: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  priceCents: number;
  sortOrder: number;
  isAvailable?: boolean;
  optionGroups?: DemoOptionGroup[];
};

const categories = [
  {
    slug: "small-plates",
    name: "Small Plates",
    description: "Bright, shareable starters from the fictional Copper Spoon kitchen.",
    sortOrder: 10,
  },
  {
    slug: "mains",
    name: "Mains",
    description: "Comforting plates built for lunch or dinner.",
    sortOrder: 20,
  },
  {
    slug: "sides",
    name: "Sides",
    description: "Small accompaniments with plenty of character.",
    sortOrder: 30,
  },
  {
    slug: "desserts",
    name: "Desserts",
    description: "A restrained sweet finish from the pastry counter.",
    sortOrder: 40,
  },
  {
    slug: "drinks",
    name: "Drinks",
    description: "House-made, alcohol-free refreshments.",
    sortOrder: 50,
  },
] as const;

const menuItems: DemoMenuItem[] = [
  {
    categorySlug: "small-plates",
    slug: "roasted-tomato-toast",
    name: "Roasted Tomato Toast",
    description: "Slow-roasted tomatoes, whipped herb cheese, and toasted sourdough.",
    imageUrl: "/images/menu/roasted-tomato-toast.webp",
    priceCents: 850,
    sortOrder: 10,
  },
  {
    categorySlug: "mains",
    slug: "copper-spoon-burger",
    name: "Copper Spoon Burger",
    description: "A grilled beef patty, copper sauce, crisp leaves, and a toasted bun.",
    imageUrl: "/images/menu/copper-spoon-burger.webp",
    priceCents: 1450,
    sortOrder: 10,
    optionGroups: [
      {
        name: "Choose a side",
        selectionType: OptionSelectionType.SINGLE,
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 10,
        options: [
          { name: "Herb fries", priceAdjustmentCents: 0, sortOrder: 10 },
          { name: "Garden salad", priceAdjustmentCents: 100, sortOrder: 20 },
        ],
      },
      {
        name: "Add extras",
        selectionType: OptionSelectionType.MULTIPLE,
        minSelections: 0,
        maxSelections: 2,
        sortOrder: 20,
        options: [
          { name: "Smoked cheddar", priceAdjustmentCents: 150, sortOrder: 10 },
          { name: "Caramelized onions", priceAdjustmentCents: 100, sortOrder: 20 },
        ],
      },
    ],
  },
  {
    categorySlug: "mains",
    slug: "garden-grain-bowl",
    name: "Garden Grain Bowl",
    description: "Herbed grains, roasted vegetables, greens, and lemon tahini.",
    imageUrl: "/images/menu/garden-grain-bowl.webp",
    priceCents: 1250,
    sortOrder: 20,
  },
  {
    categorySlug: "sides",
    slug: "ember-herb-fries",
    name: "Ember Herb Fries",
    description: "Crisp skin-on fries, charred scallion salt, and roasted garlic dip.",
    imageUrl: "/images/menu/ember-herb-fries.webp",
    priceCents: 600,
    sortOrder: 10,
  },
  {
    categorySlug: "sides",
    slug: "charred-seasonal-greens",
    name: "Charred Seasonal Greens",
    description: "Market greens, toasted seeds, preserved lemon, and warm herb oil.",
    imageUrl: "/images/menu/charred-seasonal-greens.webp",
    priceCents: 675,
    sortOrder: 20,
  },
  {
    categorySlug: "desserts",
    slug: "dark-chocolate-torte",
    name: "Dark Chocolate Torte",
    description: "Bittersweet chocolate, toasted hazelnut, and a spoon of cultured cream.",
    imageUrl: "/images/menu/dark-chocolate-torte.webp",
    priceCents: 775,
    sortOrder: 10,
    isAvailable: false,
  },
  {
    categorySlug: "drinks",
    slug: "citrus-sparkler",
    name: "Citrus Sparkler",
    description: "Fresh citrus, rosemary syrup, and sparkling water.",
    imageUrl: "/images/menu/citrus-sparkler.webp",
    priceCents: 450,
    sortOrder: 10,
    optionGroups: [
      {
        name: "Choose a size",
        selectionType: OptionSelectionType.SINGLE,
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 10,
        options: [
          { name: "Regular", priceAdjustmentCents: 0, sortOrder: 10 },
          { name: "Large", priceAdjustmentCents: 125, sortOrder: 20 },
        ],
      },
    ],
  },
];

export const productionDemoCatalogSummary = {
  categoryCount: categories.length,
  menuItemCount: menuItems.length,
  optionGroupCount: menuItems.reduce(
    (count, item) => count + (item.optionGroups?.length ?? 0),
    0,
  ),
  optionCount: menuItems.reduce(
    (count, item) =>
      count +
      (item.optionGroups?.reduce(
        (optionCount, group) => optionCount + group.options.length,
        0,
      ) ?? 0),
    0,
  ),
} as const;

export async function bootstrapProductionDemoCatalog(
  database: DemoCatalogClient,
) {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const record = await database.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        ...category,
        isPublished: true,
      },
      select: { id: true },
    });
    categoryIds.set(category.slug, record.id);
  }

  for (const item of menuItems) {
    const categoryId = categoryIds.get(item.categorySlug);
    if (!categoryId) {
      throw new Error("Demo catalog category mapping is incomplete.");
    }

    const record = await database.menuItem.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        categoryId,
        slug: item.slug,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        priceCents: item.priceCents,
        sortOrder: item.sortOrder,
        isPublished: true,
        isAvailable: item.isAvailable ?? true,
      },
      select: { id: true },
    });

    for (const group of item.optionGroups ?? []) {
      const optionGroup = await database.menuItemOptionGroup.upsert({
        where: {
          menuItemId_name: {
            menuItemId: record.id,
            name: group.name,
          },
        },
        update: {},
        create: {
          menuItemId: record.id,
          name: group.name,
          selectionType: group.selectionType,
          minSelections: group.minSelections,
          maxSelections: group.maxSelections,
          sortOrder: group.sortOrder,
          isActive: true,
        },
        select: { id: true },
      });

      for (const option of group.options) {
        await database.menuItemOption.upsert({
          where: {
            optionGroupId_name: {
              optionGroupId: optionGroup.id,
              name: option.name,
            },
          },
          update: {},
          create: {
            optionGroupId: optionGroup.id,
            ...option,
            isAvailable: true,
          },
          select: { id: true },
        });
      }
    }
  }

  return productionDemoCatalogSummary;
}
