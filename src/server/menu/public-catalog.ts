import "server-only";

import { unstable_cache } from "next/cache";

import {
  createPublicMenu,
  createPublicMenuItemDetail,
} from "@/features/menu/catalog";
import { prisma } from "@/server/db/prisma";

const FALLBACK_SETTINGS = {
  restaurantName: "Copper Spoon",
  currency: "USD",
};

export const getPublicMenu = unstable_cache(
  async () => {
    const [settings, categories] = await Promise.all([
      prisma.restaurantSettings.findUnique({
        where: { id: "restaurant-settings" },
        select: { restaurantName: true, currency: true },
      }),
      prisma.category.findMany({
        where: { isPublished: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          sortOrder: true,
          isPublished: true,
          menuItems: {
            where: { isPublished: true, isArchived: false },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
              priceCents: true,
              currency: true,
              imageUrl: true,
              sortOrder: true,
              isPublished: true,
              isAvailable: true,
              isArchived: true,
            },
          },
        },
      }),
    ]);

    return createPublicMenu(categories, settings ?? FALLBACK_SETTINGS);
  },
  ["public-menu"],
  { tags: ["public-menu", "restaurant-settings"], revalidate: 300 },
);

export const getPublicMenuItem = unstable_cache(
  async (slug: string) => {
    const [settings, item] = await Promise.all([
      prisma.restaurantSettings.findUnique({
        where: { id: "restaurant-settings" },
        select: { currency: true },
      }),
      prisma.menuItem.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          priceCents: true,
          currency: true,
          imageUrl: true,
          sortOrder: true,
          isPublished: true,
          isAvailable: true,
          isArchived: true,
          category: {
            select: { slug: true, name: true, isPublished: true },
          },
          optionGroups: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              selectionType: true,
              minSelections: true,
              maxSelections: true,
              sortOrder: true,
              isActive: true,
              options: {
                where: { isAvailable: true },
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                select: {
                  id: true,
                  name: true,
                  priceAdjustmentCents: true,
                  sortOrder: true,
                  isAvailable: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return createPublicMenuItemDetail(
      item,
      settings?.currency ?? FALLBACK_SETTINGS.currency,
    );
  },
  ["public-menu-item"],
  { tags: ["public-menu", "restaurant-settings"], revalidate: 300 },
);
