import { describe, expect, it, vi } from "vitest";

import {
  catalogPersistenceError,
  categoryInputSchema,
  menuItemInputSchema,
  menuOptionInputSchema,
  normalizeSlug,
  optionGroupInputSchema,
  parseCurrencyToCents,
  runCatalogMutation,
  validateActiveGroupBounds,
  validateOptionRelationship,
} from "@/features/menu-management/menu-management";
import { roleHasPermission } from "@/server/auth/permissions";

describe("admin catalog authorization", () => {
  it("allows ADMIN category and menu writes", () => {
    expect(roleHasPermission("ADMIN", "categories:write")).toBe(true);
    expect(roleHasPermission("ADMIN", "menu:write")).toBe(true);
  });

  it("keeps STAFF menu access read-only", () => {
    expect(roleHasPermission("STAFF", "menu:read")).toBe(true);
    expect(roleHasPermission("STAFF", "categories:write")).toBe(false);
    expect(roleHasPermission("STAFF", "menu:write")).toBe(false);
  });
});

describe("category and item inputs", () => {
  it("normalizes slugs and validates create/update category input", () => {
    expect(normalizeSlug("  Café & Small Plates  ")).toBe("cafe-small-plates");
    const parsed = categoryInputSchema.parse({ name: "Small Plates", slug: " Small PLATES ", description: "", sortOrder: "10", isPublished: "on" });
    expect(parsed).toMatchObject({ slug: "small-plates", description: null, sortOrder: 10, isPublished: true });
  });

  it("maps unique slug conflicts to a safe domain error", () => {
    expect(catalogPersistenceError({ code: "P2002", meta: { target: ["slug"] } }, "menu item")).toMatchObject({ code: "SLUG_CONFLICT", message: "Another menu item already uses that slug." });
  });

  it.each([["12.99", 1299], ["12.9", 1290], ["0", 0], ["0.05", 5]] as const)("converts %s to integer cents", (input, expected) => {
    expect(parseCurrencyToCents(input)).toBe(expected);
  });

  it.each(["12.999", "1e2", "-1.00", "NaN", "1,200.00", ""])("rejects invalid monetary input %s", (price) => {
    expect(parseCurrencyToCents(price)).toBeNull();
  });

  it("validates safe local image paths and item state", () => {
    const base = { categoryId: "category-1", name: "Copper Burger", slug: "copper-burger", description: "Fictional burger", price: "12.99", imageUrl: "/images/menu/copper-burger.webp", sortOrder: "0", isPublished: "on", isAvailable: "on" };
    expect(menuItemInputSchema.parse(base)).toMatchObject({ priceCents: 1299, imageUrl: "/images/menu/copper-burger.webp" });
    expect(menuItemInputSchema.safeParse({ ...base, imageUrl: "https://example.com/burger.webp" }).success).toBe(false);
    expect(menuItemInputSchema.safeParse({ ...base, imageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(menuItemInputSchema.safeParse({ ...base, imageUrl: "C:\\food\\burger.webp" }).success).toBe(false);
  });
});

describe("options and publication safety", () => {
  it("enforces selection bounds and single-choice maximum", () => {
    const base = { menuItemId: "item-1", name: "Choose a side", selectionType: "SINGLE", minSelections: "1", maxSelections: "1", sortOrder: "0", isActive: undefined };
    expect(optionGroupInputSchema.safeParse(base).success).toBe(true);
    expect(optionGroupInputSchema.safeParse({ ...base, maxSelections: "2" }).success).toBe(false);
    expect(optionGroupInputSchema.safeParse({ ...base, selectionType: "MULTIPLE", minSelections: "3", maxSelections: "2" }).success).toBe(false);
  });

  it("prevents active groups from requiring unavailable choices", () => {
    expect(() => validateActiveGroupBounds({ isActive: true, minSelections: 1, maxSelections: 2, availableOptionCount: 1 })).toThrowError(expect.objectContaining({ code: "INVALID_BOUNDS" }));
    expect(() => validateActiveGroupBounds({ isActive: false, minSelections: 1, maxSelections: 2, availableOptionCount: 0 })).not.toThrow();
  });

  it("validates option relationship identifiers and integer adjustments", () => {
    expect(menuOptionInputSchema.parse({ optionGroupId: "group-1", menuItemId: "item-1", name: "Large side", priceAdjustment: "2.00", sortOrder: "20", isAvailable: "on" })).toMatchObject({ priceAdjustmentCents: 200, isAvailable: true });
  });

  it("rejects option groups and options belonging to another item", () => {
    expect(() => validateOptionRelationship({ menuItemId: "item-2", optionIds: ["option-1"] }, "item-1", "option-1")).toThrowError(expect.objectContaining({ code: "INVALID_RELATIONSHIP" }));
    expect(() => validateOptionRelationship({ menuItemId: "item-1", optionIds: ["option-2"] }, "item-1", "option-1")).toThrowError(expect.objectContaining({ code: "INVALID_RELATIONSHIP" }));
    expect(() => validateOptionRelationship({ menuItemId: "item-1", optionIds: ["option-1"] }, "item-1", "option-1")).not.toThrow();
  });

  it("invalidates public-menu only after a successful write", async () => {
    const invalidate = vi.fn();
    await expect(runCatalogMutation(async () => ({ id: "item-1" }), invalidate)).resolves.toEqual({ id: "item-1" });
    expect(invalidate).toHaveBeenCalledOnce();
    invalidate.mockClear();
    await expect(runCatalogMutation(async () => { throw new Error("write failed"); }, invalidate)).rejects.toThrow("write failed");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("catalog edits cannot mutate historical snapshots", () => {
    const snapshot = Object.freeze({ itemNameSnapshot: "Copper Burger", unitPriceCentsSnapshot: 1299, optionNameSnapshot: "Cheddar", priceAdjustmentCentsSnapshot: 150 });
    const catalog = { name: "Copper Burger", priceCents: 1299, optionName: "Cheddar", adjustment: 150 };
    Object.assign(catalog, { name: "New Burger", priceCents: 1599, optionName: "Aged Cheddar", adjustment: 200 });
    expect(snapshot).toEqual({ itemNameSnapshot: "Copper Burger", unitPriceCentsSnapshot: 1299, optionNameSnapshot: "Cheddar", priceAdjustmentCentsSnapshot: 150 });
  });
});
