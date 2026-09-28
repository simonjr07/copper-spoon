import { describe, expect, it } from "vitest";

import {
  CheckoutError,
  checkoutInputSchema,
  prepareAuthoritativeOrder,
  type CheckoutCatalogItem,
  type CheckoutInput,
  type CheckoutSettings,
  type PreparedOrder,
} from "@/features/checkout/checkout";
import {
  createAuthoritativeOrder,
  generatePublicOrderCode,
  PUBLIC_ORDER_CODE_PATTERN,
  type OrderCreationRepository,
} from "@/features/checkout/order-service";

const settings: CheckoutSettings = {
  currency: "USD",
  pickupEnabled: true,
  deliveryEnabled: true,
  payOnPickupEnabled: true,
  payOnDeliveryEnabled: true,
  demoCardEnabled: true,
  deliveryFeeCents: 350,
  minimumDeliveryOrderCents: 1_800,
};

function catalogItem(overrides: Partial<CheckoutCatalogItem> = {}): CheckoutCatalogItem {
  return {
    id: "burger",
    name: "Copper Burger",
    priceCents: 1_450,
    currency: "USD",
    isPublished: true,
    isAvailable: true,
    isArchived: false,
    category: { isPublished: true },
    optionGroups: [
      {
        id: "side",
        name: "Choose a side",
        selectionType: "SINGLE",
        minSelections: 1,
        maxSelections: 1,
        isActive: true,
        options: [
          {
            id: "fries",
            name: "Herb fries",
            priceAdjustmentCents: 0,
            isAvailable: true,
          },
          {
            id: "salad",
            name: "Garden salad",
            priceAdjustmentCents: 100,
            isAvailable: true,
          },
        ],
      },
      {
        id: "extras",
        name: "Add extras",
        selectionType: "MULTIPLE",
        minSelections: 0,
        maxSelections: 2,
        isActive: true,
        options: [
          {
            id: "cheddar",
            name: "Cheddar",
            priceAdjustmentCents: 150,
            isAvailable: true,
          },
          {
            id: "onion",
            name: "Crisp onion",
            priceAdjustmentCents: 100,
            isAvailable: true,
          },
          {
            id: "avocado",
            name: "Avocado",
            priceAdjustmentCents: 200,
            isAvailable: true,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function checkoutInput(overrides: Partial<CheckoutInput> = {}): CheckoutInput {
  return {
    submissionToken: "123e4567-e89b-42d3-a456-426614174000",
    customerName: "Morgan Example",
    customerEmail: "morgan@example.test",
    customerPhone: "+1 202-555-0188",
    fulfilmentType: "PICKUP",
    paymentMethod: "PAY_ON_PICKUP",
    cart: [{ menuItemId: "burger", optionIds: ["fries", "cheddar"], quantity: 2 }],
    ...overrides,
  };
}

function expectCheckoutError(work: () => unknown, code: string) {
  try {
    work();
    throw new Error("Expected checkout to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(CheckoutError);
    expect((error as CheckoutError).code).toBe(code);
  }
}

describe("checkout input validation", () => {
  it("accepts and normalizes valid pickup checkout", () => {
    const parsed = checkoutInputSchema.parse({
      ...checkoutInput(),
      customerEmail: "  MORGAN@EXAMPLE.TEST ",
      deliveryAddressLine1: null,
      deliveryAddressLine2: null,
      deliveryCity: null,
      deliveryRegion: null,
      deliveryPostalCode: null,
      deliveryCountry: null,
    });

    expect(parsed.customerEmail).toBe("morgan@example.test");
    expect(parsed.fulfilmentType).toBe("PICKUP");
  });

  it("accepts valid delivery checkout", () => {
    const parsed = checkoutInputSchema.safeParse({
      ...checkoutInput(),
      fulfilmentType: "DELIVERY",
      paymentMethod: "PAY_ON_DELIVERY",
      deliveryAddressLine1: "12 Fiction Avenue",
      deliveryCity: "Example Harbor",
      deliveryPostalCode: "10001",
      deliveryCountry: "us",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.deliveryCountry).toBe("US");
    }
  });

  it("rejects incompatible payment methods", () => {
    const parsed = checkoutInputSchema.safeParse({
      ...checkoutInput(),
      fulfilmentType: "DELIVERY",
      paymentMethod: "PAY_ON_PICKUP",
      deliveryAddressLine1: "12 Fiction Avenue",
      deliveryCity: "Example Harbor",
      deliveryPostalCode: "10001",
      deliveryCountry: "US",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.paymentMethod).toBeDefined();
  });

  it("rejects a missing delivery address", () => {
    const parsed = checkoutInputSchema.safeParse({
      ...checkoutInput(),
      fulfilmentType: "DELIVERY",
      paymentMethod: "PAY_ON_DELIVERY",
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.deliveryAddressLine1).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.deliveryCity).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.deliveryPostalCode).toBeDefined();
    expect(parsed.error?.flatten().fieldErrors.deliveryCountry).toBeDefined();
  });

  it("rejects an empty cart", () => {
    const parsed = checkoutInputSchema.safeParse({ ...checkoutInput(), cart: [] });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.cart).toBeDefined();
  });
});

describe("authoritative order preparation", () => {
  it("recalculates a pickup order from current catalog values", () => {
    const prepared = prepareAuthoritativeOrder(checkoutInput(), settings, [catalogItem()]);

    expect(prepared.subtotalCents).toBe(3_200);
    expect(prepared.deliveryFeeCents).toBe(0);
    expect(prepared.totalCents).toBe(3_200);
    expect(prepared.paymentStatus).toBe("UNPAID");
    expect(prepared.items[0]).toMatchObject({
      itemNameSnapshot: "Copper Burger",
      unitPriceCentsSnapshot: 1_450,
      optionsTotalCentsSnapshot: 150,
      configuredUnitPriceCents: 1_600,
      quantity: 2,
      lineTotalCents: 3_200,
    });
  });

  it("calculates the database delivery fee and simulated payment status", () => {
    const prepared = prepareAuthoritativeOrder(
      checkoutInput({
        fulfilmentType: "DELIVERY",
        paymentMethod: "DEMO_CARD",
        deliveryAddressLine1: "12 Fiction Avenue",
        deliveryCity: "Example Harbor",
        deliveryPostalCode: "10001",
        deliveryCountry: "US",
      }),
      settings,
      [catalogItem()],
    );

    expect(prepared.deliveryFeeCents).toBe(350);
    expect(prepared.totalCents).toBe(3_550);
    expect(prepared.paymentStatus).toBe("SIMULATED");
  });

  it.each([
    ["unavailable", { isAvailable: false }],
    ["unpublished", { isPublished: false }],
    ["archived", { isArchived: true }],
    ["hidden category", { category: { isPublished: false } }],
  ])("rejects an %s item", (_label, overrides) => {
    expectCheckoutError(
      () =>
        prepareAuthoritativeOrder(checkoutInput(), settings, [catalogItem(overrides)]),
      "ITEM_UNAVAILABLE",
    );
  });

  it("rejects an option that does not belong to the item", () => {
    expectCheckoutError(
      () =>
        prepareAuthoritativeOrder(
          checkoutInput({
            cart: [{ menuItemId: "burger", optionIds: ["fries", "other-item-option"], quantity: 1 }],
          }),
          settings,
          [catalogItem()],
        ),
      "INVALID_CONFIGURATION",
    );
  });

  it("revalidates required and maximum option bounds", () => {
    expectCheckoutError(
      () =>
        prepareAuthoritativeOrder(
          checkoutInput({ cart: [{ menuItemId: "burger", optionIds: [], quantity: 1 }] }),
          settings,
          [catalogItem()],
        ),
      "INVALID_CONFIGURATION",
    );
    expectCheckoutError(
      () =>
        prepareAuthoritativeOrder(
          checkoutInput({
            cart: [
              {
                menuItemId: "burger",
                optionIds: ["fries", "cheddar", "onion", "avocado"],
                quantity: 1,
              },
            ],
          }),
          settings,
          [catalogItem()],
        ),
      "INVALID_CONFIGURATION",
    );
  });

  it("revalidates multi-select minimums and option availability", () => {
    const minimumTwo = catalogItem();
    minimumTwo.optionGroups[1]!.minSelections = 2;
    expectCheckoutError(
      () => prepareAuthoritativeOrder(checkoutInput(), settings, [minimumTwo]),
      "INVALID_CONFIGURATION",
    );

    const unavailableChoice = catalogItem();
    unavailableChoice.optionGroups[1]!.options[0]!.isAvailable = false;
    expectCheckoutError(
      () => prepareAuthoritativeOrder(checkoutInput(), settings, [unavailableChoice]),
      "INVALID_CONFIGURATION",
    );
  });

  it("ignores manipulated client prices and totals", () => {
    const parsed = checkoutInputSchema.parse({
      ...checkoutInput(),
      subtotalCents: 1,
      totalCents: 1,
      cart: [
        {
          menuItemId: "burger",
          optionIds: ["fries", "cheddar"],
          quantity: 2,
          priceCents: 1,
          lineTotalCents: 1,
        },
      ],
    });
    const prepared = prepareAuthoritativeOrder(parsed, settings, [catalogItem()]);

    expect(prepared.subtotalCents).toBe(3_200);
    expect(prepared.totalCents).toBe(3_200);
  });

  it("enforces the current delivery minimum", () => {
    expectCheckoutError(
      () =>
        prepareAuthoritativeOrder(
          checkoutInput({
            fulfilmentType: "DELIVERY",
            paymentMethod: "PAY_ON_DELIVERY",
            deliveryAddressLine1: "12 Fiction Avenue",
            deliveryCity: "Example Harbor",
            deliveryPostalCode: "10001",
            deliveryCountry: "US",
            cart: [{ menuItemId: "burger", optionIds: ["fries"], quantity: 1 }],
          }),
          settings,
          [catalogItem()],
        ),
      "DELIVERY_MINIMUM",
    );
  });

  it("creates immutable snapshots and the initial pending event", () => {
    const item = catalogItem();
    const prepared = prepareAuthoritativeOrder(checkoutInput(), settings, [item]);
    item.name = "Renamed later";
    item.priceCents = 9_999;
    item.optionGroups[1]!.options[0]!.name = "Renamed option later";

    expect(prepared.items[0]?.itemNameSnapshot).toBe("Copper Burger");
    expect(prepared.items[0]?.unitPriceCentsSnapshot).toBe(1_450);
    expect(prepared.items[0]?.selectedOptions[1]?.optionNameSnapshot).toBe("Cheddar");
    expect(prepared.status).toBe("PENDING");
    expect(prepared.initialStatusEvent).toEqual({
      fromStatus: null,
      toStatus: "PENDING",
    });
  });
});

describe("transactional order service and public codes", () => {
  it("runs reads, repricing, snapshots, and creation in one transaction", async () => {
    let transactionCalls = 0;
    let created: PreparedOrder | undefined;
    const repository: OrderCreationRepository = {
      async transaction(work) {
        transactionCalls += 1;
        return work({
          async findOrderByCheckoutToken() {
            return null;
          },
          async getSettings() {
            return settings;
          },
          async getCatalogItems() {
            return [catalogItem()];
          },
          async createOrder(prepared, publicCode) {
            created = prepared;
            return { publicCode };
          },
        });
      },
    };

    const result = await createAuthoritativeOrder(
      checkoutInput(),
      repository,
      () => "CS-ABC2345678",
    );

    expect(transactionCalls).toBe(1);
    expect(result.publicCode).toBe("CS-ABC2345678");
    expect(created?.status).toBe("PENDING");
    expect(created?.items[0]?.lineTotalCents).toBe(3_200);
  });

  it("does not call persistence when authoritative validation fails", async () => {
    let createCalls = 0;
    const repository: OrderCreationRepository = {
      async transaction(work) {
        return work({
          async findOrderByCheckoutToken() {
            return null;
          },
          async getSettings() {
            return settings;
          },
          async getCatalogItems() {
            return [catalogItem({ isAvailable: false })];
          },
          async createOrder(_prepared, publicCode) {
            createCalls += 1;
            return { publicCode };
          },
        });
      },
    };

    await expect(createAuthoritativeOrder(checkoutInput(), repository)).rejects.toMatchObject({
      code: "ITEM_UNAVAILABLE",
    });
    expect(createCalls).toBe(0);
  });

  it("resolves a concurrent duplicate submission by checkout token", async () => {
    let attempts = 0;
    const repository: OrderCreationRepository = {
      async transaction(work) {
        return work({
          async findOrderByCheckoutToken() {
            return attempts > 0 ? { publicCode: "CS-BBBBBB3333" } : null;
          },
          async getSettings() {
            return settings;
          },
          async getCatalogItems() {
            return [catalogItem()];
          },
          async createOrder(_prepared, publicCode) {
            attempts += 1;
            if (attempts === 1) {
              throw { code: "P2002" };
            }
            return { publicCode };
          },
        });
      },
    };
    const codes = ["CS-AAAAAA2222", "CS-BBBBBB3333"];

    const result = await createAuthoritativeOrder(
      checkoutInput(),
      repository,
      () => codes.shift()!,
    );

    expect(attempts).toBe(1);
    expect(result.publicCode).toBe("CS-BBBBBB3333");
  });

  it("retries a public-code uniqueness collision with a fresh code", async () => {
    let attempts = 0;
    const repository: OrderCreationRepository = {
      async transaction(work) {
        return work({
          async findOrderByCheckoutToken() {
            return null;
          },
          async getSettings() {
            return settings;
          },
          async getCatalogItems() {
            return [catalogItem()];
          },
          async createOrder(_prepared, publicCode) {
            attempts += 1;
            if (attempts === 1) {
              throw { code: "P2002" };
            }
            return { publicCode };
          },
        });
      },
    };
    const codes = ["CS-AAAAAA2222", "CS-CCCCCC4444"];

    const result = await createAuthoritativeOrder(
      checkoutInput(),
      repository,
      () => codes.shift()!,
    );

    expect(attempts).toBe(2);
    expect(result.publicCode).toBe("CS-CCCCCC4444");
  });

  it("generates a non-sequential public code in the database format", () => {
    const code = generatePublicOrderCode(new Uint8Array(10));

    expect(code).toBe("CS-2222222222");
    expect(PUBLIC_ORDER_CODE_PATTERN.test(code)).toBe(true);
  });
});
