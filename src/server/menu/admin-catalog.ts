import "server-only";

import {
  catalogPersistenceError,
  MenuManagementError,
  validateActiveGroupBounds,
  validateOptionRelationship,
} from "@/features/menu-management/menu-management";
import { prisma } from "@/server/db/prisma";

export async function getAdminCatalog() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, isPublished: true, sortOrder: true,
      _count: { select: { menuItems: true } },
      menuItems: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, slug: true, priceCents: true, currency: true, imageUrl: true, isPublished: true, isAvailable: true, isArchived: true, sortOrder: true },
      },
    },
  });
}

export function getAdminCategories() {
  return prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, description: true, isPublished: true, sortOrder: true, _count: { select: { menuItems: true } } } });
}

export function getAdminCategory(id: string) {
  return prisma.category.findUnique({ where: { id }, select: { id: true, name: true, slug: true, description: true, isPublished: true, sortOrder: true, _count: { select: { menuItems: true } } } });
}

export function getAdminMenuItem(id: string) {
  return prisma.menuItem.findUnique({
    where: { id },
    select: {
      id: true, categoryId: true, name: true, slug: true, description: true, priceCents: true, currency: true, imageUrl: true, sortOrder: true, isPublished: true, isAvailable: true, isArchived: true,
      optionGroups: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, selectionType: true, minSelections: true, maxSelections: true, sortOrder: true, isActive: true, options: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, priceAdjustmentCents: true, sortOrder: true, isAvailable: true } } } },
    },
  });
}

export async function saveCategory(input: { id?: string; name: string; slug: string; description: string | null; sortOrder: number; isPublished: boolean }) {
  const data = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    sortOrder: input.sortOrder,
    isPublished: input.isPublished,
  };
  try {
    return input.id
      ? await prisma.category.update({ where: { id: input.id }, data, select: { id: true } })
      : await prisma.category.create({ data, select: { id: true } });
  } catch (error) { throw mapCatalogError(error, "category"); }
}

export async function saveMenuItem(input: { id?: string; categoryId: string; name: string; slug: string; description: string; priceCents: number; imageUrl: string | null; sortOrder: number; isPublished: boolean; isAvailable: boolean }) {
  const settings = await prisma.restaurantSettings.findUnique({ where: { id: "restaurant-settings" }, select: { currency: true } });
  const { id, ...data } = input;
  try {
    return id
      ? await prisma.menuItem.update({ where: { id }, data, select: { id: true } })
      : await prisma.menuItem.create({ data: { ...data, currency: settings?.currency ?? "USD", isArchived: false }, select: { id: true } });
  } catch (error) { throw mapCatalogError(error, "menu item"); }
}

export async function archiveMenuItem(id: string) {
  try { return await prisma.menuItem.update({ where: { id }, data: { isArchived: true, isPublished: false }, select: { id: true } }); }
  catch (error) { throw mapCatalogError(error, "menu item"); }
}

export async function saveOptionGroup(input: { id?: string; menuItemId: string; name: string; selectionType: "SINGLE" | "MULTIPLE"; minSelections: number; maxSelections: number; sortOrder: number; isActive: boolean }) {
  return prisma.$transaction(async (database) => {
    const item = await database.menuItem.findUnique({ where: { id: input.menuItemId }, select: { id: true } });
    if (!item) throw new MenuManagementError("INVALID_RELATIONSHIP", "The menu item no longer exists.");
    if (input.id) {
      const existing = await database.menuItemOptionGroup.findFirst({ where: { id: input.id, menuItemId: input.menuItemId }, select: { id: true, _count: { select: { options: { where: { isAvailable: true } } } } } });
      if (!existing) throw new MenuManagementError("INVALID_RELATIONSHIP", "That option group does not belong to this item.");
      validateActiveGroupBounds({ ...input, availableOptionCount: existing._count.options });
      const data = { name: input.name, selectionType: input.selectionType, minSelections: input.minSelections, maxSelections: input.maxSelections, sortOrder: input.sortOrder, isActive: input.isActive };
      try { return await database.menuItemOptionGroup.update({ where: { id: input.id }, data, select: { id: true } }); }
      catch (error) { throw mapCatalogError(error, "option group"); }
    }
    validateActiveGroupBounds({ ...input, availableOptionCount: 0 });
    try { return await database.menuItemOptionGroup.create({ data: input, select: { id: true } }); }
    catch (error) { throw mapCatalogError(error, "option group"); }
  });
}

export async function saveMenuOption(input: { id?: string; optionGroupId: string; menuItemId: string; name: string; priceAdjustmentCents: number; sortOrder: number; isAvailable: boolean }) {
  return prisma.$transaction(async (database) => {
    const group = await database.menuItemOptionGroup.findUnique({ where: { id: input.optionGroupId }, select: { id: true, menuItemId: true, isActive: true, minSelections: true, maxSelections: true, options: { select: { id: true, isAvailable: true } } } });
    validateOptionRelationship(
      group ? { menuItemId: group.menuItemId, optionIds: group.options.map((option) => option.id) } : null,
      input.menuItemId,
      input.id,
    );
    if (!group) throw new MenuManagementError("INVALID_RELATIONSHIP", "That option group does not belong to this item.");
    const availableCount = group.options.filter((option) => option.isAvailable && option.id !== input.id).length + (input.isAvailable ? 1 : 0);
    validateActiveGroupBounds({ ...group, availableOptionCount: availableCount });
    const data = {
      optionGroupId: input.optionGroupId,
      name: input.name,
      priceAdjustmentCents: input.priceAdjustmentCents,
      sortOrder: input.sortOrder,
      isAvailable: input.isAvailable,
    };
    try {
      return input.id
        ? await database.menuItemOption.update({ where: { id: input.id }, data, select: { id: true } })
        : await database.menuItemOption.create({ data, select: { id: true } });
    } catch (error) { throw mapCatalogError(error, "option"); }
  });
}

function mapCatalogError(error: unknown, entity: string) {
  return catalogPersistenceError(error, entity) ?? error;
}
