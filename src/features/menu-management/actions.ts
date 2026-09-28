"use server";

import { revalidatePath, updateTag } from "next/cache";

import {
  categoryInputSchema,
  menuItemInputSchema,
  menuOptionInputSchema,
  MenuManagementError,
  type MenuMutationState,
  optionGroupInputSchema,
  runCatalogMutation,
} from "@/features/menu-management/menu-management";
import { requirePermission } from "@/server/auth/authorization";
import {
  archiveMenuItem,
  saveCategory,
  saveMenuItem,
  saveMenuOption,
  saveOptionGroup,
} from "@/server/menu/admin-catalog";

export async function saveCategoryAction(
  _state: MenuMutationState,
  formData: FormData,
): Promise<MenuMutationState> {
  await requirePermission("categories:write");
  const parsed = categoryInputSchema.safeParse({
    id: optional(formData, "id"), name: formData.get("name"), slug: formData.get("slug"),
    description: formData.get("description"), sortOrder: formData.get("sortOrder"), isPublished: formData.get("isPublished"),
  });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  return perform(() => saveCategory(parsed.data), "/admin/menu/categories", "Category saved.");
}

export async function saveMenuItemAction(
  _state: MenuMutationState,
  formData: FormData,
): Promise<MenuMutationState> {
  await requirePermission("menu:write");
  const parsed = menuItemInputSchema.safeParse({
    id: optional(formData, "id"), categoryId: formData.get("categoryId"), name: formData.get("name"), slug: formData.get("slug"),
    description: formData.get("description"), price: formData.get("price"), imageUrl: formData.get("imageUrl"), sortOrder: formData.get("sortOrder"),
    isPublished: formData.get("isPublished"), isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const input = {
    id: parsed.data.id,
    categoryId: parsed.data.categoryId,
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    priceCents: parsed.data.priceCents,
    imageUrl: parsed.data.imageUrl,
    sortOrder: parsed.data.sortOrder,
    isPublished: parsed.data.isPublished,
    isAvailable: parsed.data.isAvailable,
  };
  return perform(() => saveMenuItem(input), "/admin/menu", "Menu item saved.");
}

export async function saveOptionGroupAction(
  _state: MenuMutationState,
  formData: FormData,
): Promise<MenuMutationState> {
  await requirePermission("menu:write");
  const parsed = optionGroupInputSchema.safeParse({
    id: optional(formData, "id"), menuItemId: formData.get("menuItemId"), name: formData.get("name"), selectionType: formData.get("selectionType"),
    minSelections: formData.get("minSelections"), maxSelections: formData.get("maxSelections"), sortOrder: formData.get("sortOrder"), isActive: formData.get("isActive"),
  });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  return perform(() => saveOptionGroup(parsed.data), `/admin/menu/items/${parsed.data.menuItemId}/edit`, "Option group saved.");
}

export async function saveMenuOptionAction(
  _state: MenuMutationState,
  formData: FormData,
): Promise<MenuMutationState> {
  await requirePermission("menu:write");
  const parsed = menuOptionInputSchema.safeParse({
    id: optional(formData, "id"), optionGroupId: formData.get("optionGroupId"), menuItemId: formData.get("menuItemId"), name: formData.get("name"),
    priceAdjustment: formData.get("priceAdjustment"), sortOrder: formData.get("sortOrder"), isAvailable: formData.get("isAvailable"),
  });
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);
  const input = {
    id: parsed.data.id,
    optionGroupId: parsed.data.optionGroupId,
    menuItemId: parsed.data.menuItemId,
    name: parsed.data.name,
    priceAdjustmentCents: parsed.data.priceAdjustmentCents,
    sortOrder: parsed.data.sortOrder,
    isAvailable: parsed.data.isAvailable,
  };
  return perform(() => saveMenuOption(input), `/admin/menu/items/${parsed.data.menuItemId}/edit`, "Option saved.");
}

export async function archiveMenuItemAction(
  _state: MenuMutationState,
  formData: FormData,
): Promise<MenuMutationState> {
  await requirePermission("menu:write");
  const id = String(formData.get("id") ?? "").trim();
  if (!id || id.length > 64) return { message: "The menu item identifier is invalid." };
  return perform(() => archiveMenuItem(id), `/admin/menu/items/${id}/edit`, "Item archived and unpublished.");
}

async function perform(
  mutation: () => Promise<{ id: string }>,
  path: string,
  message: string,
): Promise<MenuMutationState> {
  try {
    const result = await runCatalogMutation(mutation, () => updateTag("public-menu"));
    revalidatePath("/admin/menu", "layout");
    revalidatePath(path);
    return { status: "success", message, entityId: result.id };
  } catch (error) {
    if (error instanceof MenuManagementError) return { message: error.message };
    return { message: "The catalog change could not be saved. Refresh and try again." };
  }
}

function optional(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || undefined;
}

function invalid(fieldErrors: Record<string, string[] | undefined>): MenuMutationState {
  return { message: "Check the highlighted fields and try again.", fieldErrors };
}
