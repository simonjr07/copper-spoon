import { z } from "zod";

import type { PublicMenuItemDetail } from "@/features/menu/catalog";

export const CART_STORAGE_KEY = "copper-spoon:cart";
export const CART_STORAGE_VERSION = 1 as const;
export const MAX_CART_QUANTITY = 99;

export type CartSelectedOption = {
  optionGroupId: string;
  optionGroupName: string;
  optionId: string;
  optionName: string;
  priceAdjustmentCents: number;
};

export type CartLine = {
  id: string;
  menuItemId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  basePriceCents: number;
  currency: string;
  selectedOptions: CartSelectedOption[];
  quantity: number;
};

export type CartState = {
  lines: CartLine[];
};

export type CartAction =
  | { type: "add"; line: CartLine }
  | { type: "hydrate"; state: CartState }
  | { type: "set-quantity"; lineId: string; quantity: number }
  | { type: "remove"; lineId: string }
  | { type: "clear" };

export type OptionSelections = Record<string, string[]>;
export type ConfigurationErrors = Record<string, string>;

export const emptyCartState: CartState = { lines: [] };

const localImagePath = /^\/images\/[a-z0-9/_-]+\.(?:avif|jpe?g|png|webp)$/i;
const centsSchema = z.number().int().min(-10_000_000).max(10_000_000);

const selectedOptionSchema = z
  .object({
    optionGroupId: z.string().min(1).max(200),
    optionGroupName: z.string().min(1).max(120),
    optionId: z.string().min(1).max(200),
    optionName: z.string().min(1).max(120),
    priceAdjustmentCents: centsSchema,
  })
  .strict();

const cartLineSchema = z
  .object({
    id: z.string().min(1).max(2000),
    menuItemId: z.string().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    name: z.string().min(1).max(120),
    imageUrl: z.string().regex(localImagePath).nullable(),
    basePriceCents: z.number().int().min(0).max(10_000_000),
    currency: z.string().regex(/^[A-Z]{3}$/),
    selectedOptions: z.array(selectedOptionSchema).max(50),
    quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
  })
  .strict();

const storedCartSchema = z
  .object({
    version: z.literal(CART_STORAGE_VERSION),
    lines: z.array(cartLineSchema).max(100),
  })
  .strict();

export function createCartLineId(
  menuItemId: string,
  selectedOptions: readonly Pick<
    CartSelectedOption,
    "optionGroupId" | "optionId"
  >[],
) {
  const configuration = selectedOptions
    .map((option) => `${option.optionGroupId}=${option.optionId}`)
    .toSorted()
    .join("&");

  return configuration ? `${menuItemId}::${configuration}` : menuItemId;
}

export function getConfiguredUnitPrice(line: Pick<CartLine, "basePriceCents" | "selectedOptions">) {
  return line.selectedOptions.reduce(
    (total, option) => total + option.priceAdjustmentCents,
    line.basePriceCents,
  );
}

export function getLineTotal(line: CartLine) {
  return getConfiguredUnitPrice(line) * line.quantity;
}

export function getCartSubtotal(state: CartState) {
  return state.lines.reduce((total, line) => total + getLineTotal(line), 0);
}

export function getCartItemCount(state: CartState) {
  return state.lines.reduce((total, line) => total + line.quantity, 0);
}

export function getSelectedOptions(
  item: PublicMenuItemDetail,
  selections: OptionSelections,
): CartSelectedOption[] {
  return item.optionGroups
    .flatMap((group) => {
      const selectedIds = new Set(selections[group.id] ?? []);

      return group.options
        .filter((option) => selectedIds.has(option.id))
        .map((option) => ({
          optionGroupId: group.id,
          optionGroupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceAdjustmentCents: option.priceAdjustmentCents,
        }));
    })
    .toSorted((left, right) =>
      `${left.optionGroupId}:${left.optionId}`.localeCompare(
        `${right.optionGroupId}:${right.optionId}`,
      ),
    );
}

export function validateItemConfiguration(
  item: PublicMenuItemDetail,
  selections: OptionSelections,
) {
  const errors: ConfigurationErrors = {};

  if (!item.isAvailable) {
    errors._item = "This item is currently sold out.";
  }

  const groupIds = new Set(item.optionGroups.map((group) => group.id));
  if (Object.keys(selections).some((groupId) => !groupIds.has(groupId))) {
    errors._configuration = "The selected configuration is no longer available.";
  }

  for (const group of item.optionGroups) {
    const selectedIds = [...new Set(selections[group.id] ?? [])];
    const availableIds = new Set(group.options.map((option) => option.id));

    if (selectedIds.some((optionId) => !availableIds.has(optionId))) {
      errors[group.id] = "One or more selected choices are unavailable.";
      continue;
    }

    if (group.selectionType === "SINGLE" && selectedIds.length > 1) {
      errors[group.id] = "Choose only one option.";
      continue;
    }

    if (selectedIds.length < group.minSelections) {
      errors[group.id] =
        group.minSelections === 1
          ? "Choose one option to continue."
          : `Choose at least ${group.minSelections} options.`;
      continue;
    }

    if (selectedIds.length > group.maxSelections) {
      errors[group.id] = `Choose no more than ${group.maxSelections} options.`;
    }
  }

  return errors;
}

export function buildCartLine(
  item: PublicMenuItemDetail,
  selections: OptionSelections,
  quantity: number,
): { ok: true; line: CartLine } | { ok: false; errors: ConfigurationErrors } {
  const errors = validateItemConfiguration(item, selections);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_CART_QUANTITY) {
    errors._quantity = `Quantity must be between 1 and ${MAX_CART_QUANTITY}.`;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const selectedOptions = getSelectedOptions(item, selections);
  const line: CartLine = {
    id: createCartLineId(item.id, selectedOptions),
    menuItemId: item.id,
    slug: item.slug,
    name: item.name,
    imageUrl: item.imageUrl,
    basePriceCents: item.priceCents,
    currency: item.currency,
    selectedOptions,
    quantity,
  };

  if (getConfiguredUnitPrice(line) < 0) {
    return {
      ok: false,
      errors: { _configuration: "This configuration has an invalid price." },
    };
  }

  return { ok: true, line };
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "add": {
      if (
        state.lines.length > 0 &&
        state.lines.some((line) => line.currency !== action.line.currency)
      ) {
        return state;
      }

      const existing = state.lines.find((line) => line.id === action.line.id);

      if (!existing) {
        return { lines: [...state.lines, action.line] };
      }

      return {
        lines: state.lines.map((line) =>
          line.id === action.line.id
            ? {
                ...line,
                quantity: Math.min(
                  MAX_CART_QUANTITY,
                  line.quantity + action.line.quantity,
                ),
              }
            : line,
        ),
      };
    }

    case "set-quantity":
      if (!Number.isInteger(action.quantity)) {
        return state;
      }

      return {
        lines: state.lines.map((line) =>
          line.id === action.lineId
            ? {
                ...line,
                quantity: Math.min(
                  MAX_CART_QUANTITY,
                  Math.max(1, action.quantity),
                ),
              }
            : line,
        ),
      };

    case "remove":
      return { lines: state.lines.filter((line) => line.id !== action.lineId) };

    case "clear":
      return emptyCartState;
  }
}

export function serializeCart(state: CartState) {
  return JSON.stringify({ version: CART_STORAGE_VERSION, lines: state.lines });
}

export function deserializeCart(serialized: string | null): CartState {
  if (!serialized) {
    return emptyCartState;
  }

  try {
    const parsed = storedCartSchema.safeParse(JSON.parse(serialized));

    if (!parsed.success) {
      return emptyCartState;
    }

    const currencies = new Set(parsed.data.lines.map((line) => line.currency));
    if (currencies.size > 1) {
      return emptyCartState;
    }

    const normalizedLines: CartLine[] = [];

    for (const persistedLine of parsed.data.lines) {
      const selectedOptions = persistedLine.selectedOptions.toSorted(
        (left, right) =>
          `${left.optionGroupId}:${left.optionId}`.localeCompare(
            `${right.optionGroupId}:${right.optionId}`,
          ),
      );
      const optionKeys = selectedOptions.map(
        (option) => `${option.optionGroupId}:${option.optionId}`,
      );

      if (new Set(optionKeys).size !== optionKeys.length) {
        return emptyCartState;
      }

      const line: CartLine = {
        ...persistedLine,
        selectedOptions,
        id: createCartLineId(persistedLine.menuItemId, selectedOptions),
      };

      if (getConfiguredUnitPrice(line) < 0) {
        return emptyCartState;
      }

      normalizedLines.push(line);
    }

    return normalizedLines.reduce<CartState>((state, line) => {
      return cartReducer(state, { type: "add", line });
    }, emptyCartState);
  } catch {
    return emptyCartState;
  }
}
