import { describe, expect, it } from "vitest";

import {
  createPublicMenu,
  createPublicMenuItemDetail,
  filterPublicMenu,
  normalizePublicImagePath,
  type CatalogCategoryRecord,
  type CatalogItemDetailRecord,
  type CatalogItemRecord,
} from "@/features/menu/catalog";

function item(
  overrides: Partial<CatalogItemRecord> & Pick<CatalogItemRecord, "id" | "name">,
): CatalogItemRecord {
  return {
    slug: overrides.name.toLocaleLowerCase().replaceAll(" ", "-"),
    description: `${overrides.name} description`,
    priceCents: 1299,
    currency: "USD",
    imageUrl: null,
    sortOrder: 10,
    isPublished: true,
    isAvailable: true,
    isArchived: false,
    ...overrides,
  };
}

const categories: CatalogCategoryRecord[] = [
  {
    id: "later",
    slug: "desserts",
    name: "Desserts",
    description: "Sweet finishes",
    sortOrder: 20,
    isPublished: true,
    menuItems: [
      item({ id: "sold-out", name: "Chocolate Torte", isAvailable: false }),
    ],
  },
  {
    id: "hidden-category",
    slug: "drafts",
    name: "Drafts",
    description: null,
    sortOrder: 1,
    isPublished: false,
    menuItems: [item({ id: "hidden-by-category", name: "Secret Plate" })],
  },
  {
    id: "first",
    slug: "mains",
    name: "Mains",
    description: "Comforting plates",
    sortOrder: 10,
    isPublished: true,
    menuItems: [
      item({ id: "second-item", name: "Grain Bowl", sortOrder: 20 }),
      item({ id: "draft-item", name: "Draft Burger", isPublished: false }),
      item({ id: "archived-item", name: "Old Burger", isArchived: true }),
      item({
        id: "first-item",
        name: "Copper Burger",
        description: "Beef, crisp leaves, and copper sauce",
        sortOrder: 10,
      }),
    ],
  },
];

const settings = {
  restaurantName: "Copper Spoon Test Kitchen",
  currency: "USD",
};

describe("public catalog policy", () => {
  it("returns only published categories in stored sort order", () => {
    const menu = createPublicMenu(categories, settings);

    expect(menu.categories.map((category) => category.slug)).toEqual([
      "mains",
      "desserts",
    ]);
  });

  it("exposes only published, non-archived items in stored sort order", () => {
    const menu = createPublicMenu(categories, settings);

    expect(menu.categories[0]?.items.map((entry) => entry.id)).toEqual([
      "first-item",
      "second-item",
    ]);
  });

  it("keeps a published sold-out item visible and marked unavailable", () => {
    const menu = createPublicMenu(categories, settings);
    const soldOut = menu.categories[1]?.items[0];

    expect(soldOut?.name).toBe("Chocolate Torte");
    expect(soldOut?.isAvailable).toBe(false);
  });

  it("exposes only safe repository-local image paths", () => {
    const withImage = categories.map((category) => ({
      ...category,
      menuItems: category.menuItems.map((entry) =>
        entry.id === "first-item"
          ? { ...entry, imageUrl: "/images/menu/copper-burger.webp" }
          : entry,
      ),
    }));
    const menu = createPublicMenu(withImage, settings);

    expect(menu.categories[0]?.items[0]?.imageUrl).toBe(
      "/images/menu/copper-burger.webp",
    );
    expect(normalizePublicImagePath("https://example.com/dish.webp")).toBeNull();
    expect(normalizePublicImagePath("/images/../private/dish.webp")).toBeNull();
    expect(normalizePublicImagePath(null)).toBeNull();
  });

  it("searches item names, descriptions, and category names", () => {
    const menu = createPublicMenu(categories, settings);

    expect(filterPublicMenu(menu, "copper sauce", null)[0]?.items[0]?.id).toBe(
      "first-item",
    );
    expect(filterPublicMenu(menu, "desserts", null)[0]?.slug).toBe("desserts");
  });

  it("combines category filtering with search and returns a clean empty result", () => {
    const menu = createPublicMenu(categories, settings);

    expect(filterPublicMenu(menu, "grain", "mains")[0]?.items[0]?.id).toBe(
      "second-item",
    );
    expect(filterPublicMenu(menu, "torte", "mains")).toEqual([]);
  });
});

describe("public menu item detail policy", () => {
  function detail(
    overrides: Partial<CatalogItemDetailRecord> = {},
  ): CatalogItemDetailRecord {
    return {
      ...item({ id: "detail", name: "Copper Burger" }),
      category: { slug: "mains", name: "Mains", isPublished: true },
      optionGroups: [
        {
          id: "group",
          name: "Choose a side",
          selectionType: "SINGLE",
          minSelections: 1,
          maxSelections: 1,
          sortOrder: 10,
          isActive: true,
          options: [
            {
              id: "available-option",
              name: "Herb fries",
              priceAdjustmentCents: 0,
              sortOrder: 10,
              isAvailable: true,
            },
            {
              id: "unavailable-option",
              name: "Unavailable salad",
              priceAdjustmentCents: 100,
              sortOrder: 20,
              isAvailable: false,
            },
          ],
        },
      ],
      ...overrides,
    };
  }

  it("does not expose unknown, unpublished, archived, or hidden-category details", () => {
    expect(createPublicMenuItemDetail(null, "USD")).toBeNull();
    expect(
      createPublicMenuItemDetail(detail({ isPublished: false }), "USD"),
    ).toBeNull();
    expect(
      createPublicMenuItemDetail(detail({ isArchived: true }), "USD"),
    ).toBeNull();
    expect(
      createPublicMenuItemDetail(
        detail({
          category: { slug: "hidden", name: "Hidden", isPublished: false },
        }),
        "USD",
      ),
    ).toBeNull();
  });

  it("returns only active groups and available option choices", () => {
    const publicItem = createPublicMenuItemDetail(detail(), "USD");

    expect(publicItem?.optionGroups).toHaveLength(1);
    expect(publicItem?.optionGroups[0]?.options.map((option) => option.id)).toEqual([
      "available-option",
    ]);
  });
});
