export type CatalogItemRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  isAvailable: boolean;
  isArchived: boolean;
};

export type CatalogCategoryRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isPublished: boolean;
  menuItems: CatalogItemRecord[];
};

export type PublicMenuItem = Pick<
  CatalogItemRecord,
  | "id"
  | "slug"
  | "name"
  | "description"
  | "priceCents"
  | "currency"
  | "imageUrl"
  | "isAvailable"
>;

export type PublicMenuCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  items: PublicMenuItem[];
};

export type PublicMenu = {
  restaurantName: string;
  currency: string;
  categories: PublicMenuCategory[];
};

export type CatalogOptionRecord = {
  id: string;
  name: string;
  priceAdjustmentCents: number;
  sortOrder: number;
  isAvailable: boolean;
};

export type CatalogOptionGroupRecord = {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
  sortOrder: number;
  isActive: boolean;
  options: CatalogOptionRecord[];
};

export type CatalogItemDetailRecord = CatalogItemRecord & {
  category: {
    slug: string;
    name: string;
    isPublished: boolean;
  };
  optionGroups: CatalogOptionGroupRecord[];
};

export type PublicMenuItemDetail = PublicMenuItem & {
  category: { slug: string; name: string };
  optionGroups: Array<{
    id: string;
    name: string;
    selectionType: "SINGLE" | "MULTIPLE";
    minSelections: number;
    maxSelections: number;
    options: Array<{
      id: string;
      name: string;
      priceAdjustmentCents: number;
    }>;
  }>;
};

function bySortOrderThenName<T extends { sortOrder: number; name: string }>(
  left: T,
  right: T,
) {
  return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
}

function toPublicItem(item: CatalogItemRecord): PublicMenuItem {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    priceCents: item.priceCents,
    currency: item.currency,
    imageUrl: normalizePublicImagePath(item.imageUrl),
    isAvailable: item.isAvailable,
  };
}

export function normalizePublicImagePath(imageUrl: string | null) {
  if (!imageUrl) {
    return null;
  }

  return /^\/images\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i.test(imageUrl)
    ? imageUrl
    : null;
}

export function createPublicMenu(
  categories: CatalogCategoryRecord[],
  settings: { restaurantName: string; currency: string },
): PublicMenu {
  return {
    ...settings,
    categories: categories
      .filter((category) => category.isPublished)
      .toSorted(bySortOrderThenName)
      .map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        description: category.description,
        items: category.menuItems
          .filter((item) => item.isPublished && !item.isArchived)
          .toSorted(bySortOrderThenName)
          .map((item) =>
            toPublicItem({ ...item, currency: settings.currency }),
          ),
      })),
  };
}

export function createPublicMenuItemDetail(
  item: CatalogItemDetailRecord | null,
  currency: string,
): PublicMenuItemDetail | null {
  if (
    !item ||
    !item.isPublished ||
    item.isArchived ||
    !item.category.isPublished
  ) {
    return null;
  }

  return {
    ...toPublicItem({ ...item, currency }),
    category: {
      slug: item.category.slug,
      name: item.category.name,
    },
    optionGroups: item.optionGroups
      .filter((group) => group.isActive)
      .toSorted(bySortOrderThenName)
      .map((group) => ({
        id: group.id,
        name: group.name,
        selectionType: group.selectionType,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        options: group.options
          .filter((option) => option.isAvailable)
          .toSorted(bySortOrderThenName)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceAdjustmentCents: option.priceAdjustmentCents,
          })),
      }))
      .filter((group) => group.options.length > 0),
  };
}

export function filterPublicMenu(
  menu: PublicMenu,
  query: string,
  categorySlug: string | null,
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  return menu.categories
    .filter((category) => !categorySlug || category.slug === categorySlug)
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        if (!normalizedQuery) {
          return true;
        }

        return [item.name, item.description, category.name].some((value) =>
          value.toLocaleLowerCase().includes(normalizedQuery),
        );
      }),
    }))
    .filter((category) => category.items.length > 0);
}
