import { describe, expect, it } from "vitest";

import {
  buildCartLine,
  cartReducer,
  createCartLineId,
  deserializeCart,
  emptyCartState,
  getCartItemCount,
  getCartSubtotal,
  getConfiguredUnitPrice,
  getLineTotal,
  serializeCart,
  validateItemConfiguration,
  type CartLine,
} from "@/features/cart/cart";
import type { PublicMenuItemDetail } from "@/features/menu/catalog";

const burger: PublicMenuItemDetail = {
  id: "burger",
  slug: "copper-burger",
  name: "Copper Burger",
  description: "A test burger.",
  priceCents: 1_450,
  currency: "USD",
  imageUrl: "/images/menu/copper-burger.webp",
  isAvailable: true,
  category: { slug: "mains", name: "Mains" },
  optionGroups: [
    {
      id: "side",
      name: "Choose a side",
      selectionType: "SINGLE",
      minSelections: 1,
      maxSelections: 1,
      options: [
        { id: "fries", name: "Herb fries", priceAdjustmentCents: 0 },
        { id: "salad", name: "Garden salad", priceAdjustmentCents: 100 },
      ],
    },
    {
      id: "extras",
      name: "Add extras",
      selectionType: "MULTIPLE",
      minSelections: 0,
      maxSelections: 2,
      options: [
        { id: "cheddar", name: "Cheddar", priceAdjustmentCents: 150 },
        { id: "onion", name: "Crisp onion", priceAdjustmentCents: 100 },
        { id: "avocado", name: "Avocado", priceAdjustmentCents: 200 },
      ],
    },
  ],
};

function configuredLine(
  selections: Record<string, string[]> = {
    side: ["fries"],
    extras: ["cheddar", "onion"],
  },
  quantity = 1,
) {
  const result = buildCartLine(burger, selections, quantity);
  if (!result.ok) {
    throw new Error("Test fixture should create a valid cart line.");
  }

  return result.line;
}

describe("cart configuration and pricing", () => {
  it("prices a configured item in integer cents", () => {
    const line = configuredLine();

    expect(getConfiguredUnitPrice(line)).toBe(1_700);
    expect(line.selectedOptions.map((option) => option.optionId)).toEqual([
      "cheddar",
      "onion",
      "fries",
    ]);
  });

  it("calculates quantity-aware line totals and cart subtotals", () => {
    const burgerLine = configuredLine(undefined, 3);
    const saladLine = configuredLine({ side: ["salad"] }, 2);

    expect(getLineTotal(burgerLine)).toBe(5_100);
    expect(getCartSubtotal({ lines: [burgerLine, saladLine] })).toBe(8_200);
    expect(getCartItemCount({ lines: [burgerLine, saladLine] })).toBe(5);
  });

  it("keeps distinct configurations separate and merges identical ones", () => {
    const fries = configuredLine({ side: ["fries"] });
    const salad = configuredLine({ side: ["salad"] });
    let state = cartReducer(emptyCartState, { type: "add", line: fries });
    state = cartReducer(state, { type: "add", line: salad });
    state = cartReducer(state, { type: "add", line: fries });

    expect(fries.id).not.toBe(salad.id);
    expect(state.lines).toHaveLength(2);
    expect(state.lines.find((line) => line.id === fries.id)?.quantity).toBe(2);
  });

  it("builds stable identities regardless of option order", () => {
    const first = createCartLineId("burger", [
      { optionGroupId: "extras", optionId: "onion" },
      { optionGroupId: "side", optionId: "fries" },
    ]);
    const second = createCartLineId("burger", [
      { optionGroupId: "side", optionId: "fries" },
      { optionGroupId: "extras", optionId: "onion" },
    ]);

    expect(first).toBe(second);
  });

  it("enforces required, single-select, minimum, and maximum rules", () => {
    expect(validateItemConfiguration(burger, {})).toEqual({
      side: "Choose one option to continue.",
    });
    expect(
      validateItemConfiguration(burger, { side: ["fries", "salad"] }),
    ).toEqual({ side: "Choose only one option." });
    expect(
      validateItemConfiguration(burger, {
        side: ["fries"],
        extras: ["cheddar", "onion", "avocado"],
      }),
    ).toEqual({ extras: "Choose no more than 2 options." });

    const minimumTwo: PublicMenuItemDetail = {
      ...burger,
      optionGroups: [
        {
          ...burger.optionGroups[1]!,
          minSelections: 2,
          maxSelections: 2,
        },
      ],
    };
    expect(validateItemConfiguration(minimumTwo, { extras: ["cheddar"] })).toEqual({
      extras: "Choose at least 2 options.",
    });
  });

  it("rejects sold-out items, stale choices, and invalid quantities", () => {
    const soldOut = buildCartLine(
      { ...burger, isAvailable: false },
      { side: ["fries"] },
      1,
    );
    const stale = buildCartLine(burger, { side: ["removed-option"] }, 1);
    const badQuantity = buildCartLine(burger, { side: ["fries"] }, 0);

    expect(soldOut).toEqual({
      ok: false,
      errors: { _item: "This item is currently sold out." },
    });
    expect(stale).toMatchObject({ ok: false });
    expect(badQuantity).toEqual({
      ok: false,
      errors: { _quantity: "Quantity must be between 1 and 99." },
    });
  });
});

describe("cart reducer and local persistence", () => {
  it("clamps quantity changes and removes lines", () => {
    const line = configuredLine();
    let state = cartReducer(emptyCartState, { type: "add", line });
    state = cartReducer(state, {
      type: "set-quantity",
      lineId: line.id,
      quantity: 500,
    });
    expect(state.lines[0]?.quantity).toBe(99);

    state = cartReducer(state, { type: "remove", lineId: line.id });
    expect(state).toEqual(emptyCartState);
  });

  it("round-trips a versioned cart and normalizes persisted identities", () => {
    const line: CartLine = { ...configuredLine(), id: "untrusted-id" };
    const restored = deserializeCart(serializeCart({ lines: [line] }));

    expect(restored.lines).toHaveLength(1);
    expect(restored.lines[0]?.id).toBe(
      createCartLineId(line.menuItemId, line.selectedOptions),
    );
    expect(getCartSubtotal(restored)).toBe(1_700);
  });

  it("fails closed for malformed, stale-version, unsafe, and inconsistent data", () => {
    const line = configuredLine();
    const cases = [
      "not-json",
      JSON.stringify({ version: 2, lines: [line] }),
      JSON.stringify({
        version: 1,
        lines: [{ ...line, imageUrl: "https://example.com/tracker.webp" }],
      }),
      JSON.stringify({
        version: 1,
        lines: [line, { ...line, id: "other", menuItemId: "other", currency: "EUR" }],
      }),
      JSON.stringify({
        version: 1,
        lines: [{ ...line, slug: "../admin" }],
      }),
      JSON.stringify({
        version: 1,
        lines: [
          {
            ...line,
            selectedOptions: [line.selectedOptions[0], line.selectedOptions[0]],
          },
        ],
      }),
      JSON.stringify({
        version: 1,
        lines: [
          {
            ...line,
            basePriceCents: 0,
            selectedOptions: [
              {
                ...line.selectedOptions[0],
                priceAdjustmentCents: -1,
              },
            ],
          },
        ],
      }),
    ];

    for (const serialized of cases) {
      expect(deserializeCart(serialized)).toEqual(emptyCartState);
    }
    expect(deserializeCart(null)).toEqual(emptyCartState);
  });
});
