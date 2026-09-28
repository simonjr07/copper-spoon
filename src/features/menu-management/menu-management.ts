import { z } from "zod";

import { normalizePublicImagePath } from "@/features/menu/catalog";

const checkbox = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean(),
);

const identifier = z.string().trim().min(1).max(64);
const sortOrder = z.coerce.number().int().min(0).max(100_000);

export function normalizeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const slugInput = z
  .string()
  .trim()
  .min(1, "Enter a slug.")
  .max(120)
  .transform(normalizeSlug)
  .pipe(z.string().min(1, "Use at least one letter or number.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));

export function parseCurrencyToCents(value: string) {
  const normalized = value.trim();
  if (!/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

const moneyInput = z.string().superRefine((value, context) => {
  if (parseCurrencyToCents(value) === null) {
    context.addIssue({ code: "custom", message: "Enter a valid amount such as 12.99." });
  }
});

export const categoryInputSchema = z.object({
  id: identifier.optional(),
  name: z.string().trim().min(1).max(100),
  slug: slugInput,
  description: z.string().trim().max(500).transform((value) => value || null),
  sortOrder,
  isPublished: checkbox,
});

export const menuItemInputSchema = z.object({
  id: identifier.optional(),
  categoryId: identifier,
  name: z.string().trim().min(1).max(120),
  slug: slugInput,
  description: z.string().trim().min(1).max(1000),
  price: moneyInput,
  imageUrl: z.string().trim().max(2048).superRefine((value, context) => {
    if (value && normalizePublicImagePath(value) !== value) {
      context.addIssue({ code: "custom", message: "Use a safe repository path such as /images/menu/dish.webp." });
    }
  }).transform((value) => value || null),
  sortOrder,
  isPublished: checkbox,
  isAvailable: checkbox,
}).transform((value) => ({ ...value, priceCents: parseCurrencyToCents(value.price)! }));

export const optionGroupInputSchema = z.object({
  id: identifier.optional(),
  menuItemId: identifier,
  name: z.string().trim().min(1).max(120),
  selectionType: z.enum(["SINGLE", "MULTIPLE"]),
  minSelections: z.coerce.number().int().min(0).max(100),
  maxSelections: z.coerce.number().int().min(1).max(100),
  sortOrder,
  isActive: checkbox,
}).superRefine((value, context) => {
  if (value.minSelections > value.maxSelections) {
    context.addIssue({ code: "custom", path: ["minSelections"], message: "Minimum cannot exceed maximum." });
  }
  if (value.selectionType === "SINGLE" && value.maxSelections !== 1) {
    context.addIssue({ code: "custom", path: ["maxSelections"], message: "Single-choice groups must have a maximum of 1." });
  }
});

export const menuOptionInputSchema = z.object({
  id: identifier.optional(),
  optionGroupId: identifier,
  menuItemId: identifier,
  name: z.string().trim().min(1).max(120),
  priceAdjustment: moneyInput,
  sortOrder,
  isAvailable: checkbox,
}).transform((value) => ({ ...value, priceAdjustmentCents: parseCurrencyToCents(value.priceAdjustment)! }));

export type MenuMutationState = {
  status?: "success";
  message?: string;
  entityId?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export class MenuManagementError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "SLUG_CONFLICT" | "NAME_CONFLICT" | "INVALID_RELATIONSHIP" | "INVALID_BOUNDS",
    message: string,
  ) {
    super(message);
    this.name = "MenuManagementError";
  }
}

export function validateActiveGroupBounds(input: {
  isActive: boolean;
  minSelections: number;
  maxSelections: number;
  availableOptionCount: number;
}) {
  if (input.isActive && (input.minSelections > input.availableOptionCount || input.maxSelections > input.availableOptionCount)) {
    throw new MenuManagementError(
      "INVALID_BOUNDS",
      "An active group's minimum and maximum cannot exceed its available choices.",
    );
  }
}

export function validateOptionRelationship(
  group: { menuItemId: string; optionIds: string[] } | null,
  menuItemId: string,
  optionId?: string,
) {
  if (!group || group.menuItemId !== menuItemId) {
    throw new MenuManagementError(
      "INVALID_RELATIONSHIP",
      "That option group does not belong to this item.",
    );
  }
  if (optionId && !group.optionIds.includes(optionId)) {
    throw new MenuManagementError(
      "INVALID_RELATIONSHIP",
      "That option does not belong to this group.",
    );
  }
}

export async function runCatalogMutation<T>(
  mutation: () => Promise<T>,
  invalidatePublicMenu: () => void,
) {
  const result = await mutation();
  invalidatePublicMenu();
  return result;
}

export function catalogPersistenceError(
  error: unknown,
  entity: string,
) {
  if (error instanceof MenuManagementError) return error;
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  if (error.code === "P2002") {
    const rawTarget = "meta" in error && error.meta && typeof error.meta === "object" && "target" in error.meta ? error.meta.target : "";
    const target = Array.isArray(rawTarget) ? rawTarget.join(" ") : String(rawTarget);
    return new MenuManagementError(
      target.includes("slug") ? "SLUG_CONFLICT" : "NAME_CONFLICT",
      `Another ${entity} already uses that ${target.includes("slug") ? "slug" : "name"}.`,
    );
  }
  if (error.code === "P2025") return new MenuManagementError("NOT_FOUND", `The ${entity} no longer exists.`);
  if (error.code === "P2003") return new MenuManagementError("INVALID_RELATIONSHIP", "The selected related record is unavailable.");
  return null;
}
