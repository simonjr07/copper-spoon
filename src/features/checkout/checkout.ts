import { z } from "zod";

export const MAX_CHECKOUT_LINES = 50;
export const MAX_CHECKOUT_QUANTITY = 99;

const identifierSchema = z.string().min(1).max(200);
const optionalText = (maximum: number) =>
  z.preprocess(
    (value) =>
      value == null || (typeof value === "string" && value.trim() === "")
        ? undefined
        : value,
    z.string().trim().max(maximum).optional(),
  );

export const checkoutCartLineSchema = z
  .object({
    menuItemId: identifierSchema,
    optionIds: z
      .array(identifierSchema)
      .max(50)
      .refine((ids) => new Set(ids).size === ids.length, "Duplicate options are not allowed."),
    quantity: z.number().int().min(1).max(MAX_CHECKOUT_QUANTITY),
  })
  .strip();

export const checkoutInputSchema = z
  .object({
    submissionToken: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.uuidv4("Refresh checkout and try again.").max(64)),
    customerName: z.string().trim().min(2, "Enter your name.").max(120),
    customerEmail: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid email address.").max(254)),
    customerPhone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number.")
      .max(40)
      .regex(/^[+()\-\s.0-9]+$/, "Enter a valid phone number."),
    fulfilmentType: z.enum(["PICKUP", "DELIVERY"]),
    paymentMethod: z.enum(["PAY_ON_PICKUP", "PAY_ON_DELIVERY", "DEMO_CARD"]),
    deliveryAddressLine1: optionalText(200),
    deliveryAddressLine2: optionalText(200),
    deliveryCity: optionalText(120),
    deliveryRegion: optionalText(120),
    deliveryPostalCode: optionalText(32),
    deliveryCountry: z.preprocess(
      (value) =>
        value == null || (typeof value === "string" && value.trim() === "")
          ? undefined
          : typeof value === "string"
            ? value.trim().toUpperCase()
            : value,
      z.string().length(2, "Use a two-letter country code.").optional(),
    ),
    cart: z.array(checkoutCartLineSchema).min(1, "Your cart is empty.").max(MAX_CHECKOUT_LINES),
  })
  .superRefine((input, context) => {
    if (input.fulfilmentType === "DELIVERY") {
      const requiredAddressFields = [
        ["deliveryAddressLine1", input.deliveryAddressLine1, "Enter a delivery address."],
        ["deliveryCity", input.deliveryCity, "Enter a city."],
        ["deliveryPostalCode", input.deliveryPostalCode, "Enter a postal code."],
        ["deliveryCountry", input.deliveryCountry, "Enter a two-letter country code."],
      ] as const;

      for (const [field, value, message] of requiredAddressFields) {
        if (!value) {
          context.addIssue({ code: "custom", path: [field], message });
        }
      }
    }

    if (
      (input.paymentMethod === "PAY_ON_PICKUP" && input.fulfilmentType !== "PICKUP") ||
      (input.paymentMethod === "PAY_ON_DELIVERY" && input.fulfilmentType !== "DELIVERY")
    ) {
      context.addIssue({
        code: "custom",
        path: ["paymentMethod"],
        message: "Choose a payment method compatible with fulfilment.",
      });
    }

    const configurations = input.cart.map(
      (line) => `${line.menuItemId}:${line.optionIds.toSorted().join(",")}`,
    );
    if (new Set(configurations).size !== configurations.length) {
      context.addIssue({
        code: "custom",
        path: ["cart"],
        message: "Duplicate cart configurations are not allowed.",
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type CheckoutCartLineInput = CheckoutInput["cart"][number];

export type CheckoutSettings = {
  currency: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  payOnPickupEnabled: boolean;
  payOnDeliveryEnabled: boolean;
  demoCardEnabled: boolean;
  deliveryFeeCents: number;
  minimumDeliveryOrderCents: number | null;
};

export type CheckoutCatalogOption = {
  id: string;
  name: string;
  priceAdjustmentCents: number;
  isAvailable: boolean;
};

export type CheckoutCatalogOptionGroup = {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
  isActive: boolean;
  options: CheckoutCatalogOption[];
};

export type CheckoutCatalogItem = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  isPublished: boolean;
  isAvailable: boolean;
  isArchived: boolean;
  category: { isPublished: boolean };
  optionGroups: CheckoutCatalogOptionGroup[];
};

export type PreparedOrderItem = {
  menuItemId: string;
  itemNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  optionsTotalCentsSnapshot: number;
  configuredUnitPriceCents: number;
  lineTotalCents: number;
  selectedOptions: Array<{
    menuItemOptionId: string;
    optionGroupNameSnapshot: string;
    optionNameSnapshot: string;
    priceAdjustmentCentsSnapshot: number;
  }>;
};

export type PreparedOrder = {
  checkoutToken: string;
  status: "PENDING";
  initialStatusEvent: { fromStatus: null; toStatus: "PENDING" };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfilmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "PAY_ON_PICKUP" | "PAY_ON_DELIVERY" | "DEMO_CARD";
  paymentStatus: "UNPAID" | "SIMULATED";
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryRegion: string | null;
  deliveryPostalCode: string | null;
  deliveryCountry: string | null;
  currency: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  items: PreparedOrderItem[];
};

export type CheckoutErrorCode =
  | "ORDERING_UNAVAILABLE"
  | "ITEM_UNAVAILABLE"
  | "INVALID_CONFIGURATION"
  | "PAYMENT_UNAVAILABLE"
  | "DELIVERY_MINIMUM";

export class CheckoutError extends Error {
  constructor(
    public readonly code: CheckoutErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export function prepareAuthoritativeOrder(
  input: CheckoutInput,
  settings: CheckoutSettings,
  catalogItems: CheckoutCatalogItem[],
): PreparedOrder {
  validateSettings(input, settings);

  const itemsById = new Map(catalogItems.map((item) => [item.id, item]));
  const preparedItems = input.cart.map((line) => {
    const item = itemsById.get(line.menuItemId);

    if (
      !item ||
      !item.isPublished ||
      item.isArchived ||
      !item.isAvailable ||
      !item.category.isPublished ||
      item.currency !== settings.currency
    ) {
      throw new CheckoutError(
        "ITEM_UNAVAILABLE",
        "One or more dishes are no longer available. Review your cart and try again.",
      );
    }

    return prepareItem(line, item);
  });

  const subtotalCents = preparedItems.reduce(
    (total, item) => total + item.lineTotalCents,
    0,
  );
  assertSafeCents(subtotalCents);

  if (
    input.fulfilmentType === "DELIVERY" &&
    settings.minimumDeliveryOrderCents !== null &&
    subtotalCents < settings.minimumDeliveryOrderCents
  ) {
    throw new CheckoutError(
      "DELIVERY_MINIMUM",
      "Your cart does not meet the minimum amount for delivery.",
    );
  }

  const deliveryFeeCents =
    input.fulfilmentType === "DELIVERY" ? settings.deliveryFeeCents : 0;
  const totalCents = subtotalCents + deliveryFeeCents;
  assertSafeCents(deliveryFeeCents);
  assertSafeCents(totalCents);

  const isDelivery = input.fulfilmentType === "DELIVERY";

  return {
    checkoutToken: input.submissionToken,
    status: "PENDING",
    initialStatusEvent: { fromStatus: null, toStatus: "PENDING" },
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    fulfilmentType: input.fulfilmentType,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentMethod === "DEMO_CARD" ? "SIMULATED" : "UNPAID",
    deliveryAddressLine1: isDelivery ? (input.deliveryAddressLine1 ?? null) : null,
    deliveryAddressLine2: isDelivery ? (input.deliveryAddressLine2 ?? null) : null,
    deliveryCity: isDelivery ? (input.deliveryCity ?? null) : null,
    deliveryRegion: isDelivery ? (input.deliveryRegion ?? null) : null,
    deliveryPostalCode: isDelivery ? (input.deliveryPostalCode ?? null) : null,
    deliveryCountry: isDelivery ? (input.deliveryCountry ?? null) : null,
    currency: settings.currency,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    items: preparedItems,
  };
}

function prepareItem(
  line: CheckoutCartLineInput,
  item: CheckoutCatalogItem,
): PreparedOrderItem {
  const selectedIds = new Set(line.optionIds);
  const selectedOptions: PreparedOrderItem["selectedOptions"] = [];

  for (const group of item.optionGroups) {
    const groupSelections = group.options.filter((option) => selectedIds.has(option.id));

    if (!group.isActive && groupSelections.length > 0) {
      throw invalidConfiguration();
    }

    if (!group.isActive) {
      continue;
    }

    if (
      groupSelections.some((option) => !option.isAvailable) ||
      (group.selectionType === "SINGLE" && groupSelections.length > 1) ||
      groupSelections.length < group.minSelections ||
      groupSelections.length > group.maxSelections
    ) {
      throw invalidConfiguration();
    }

    for (const option of groupSelections) {
      selectedOptions.push({
        menuItemOptionId: option.id,
        optionGroupNameSnapshot: group.name,
        optionNameSnapshot: option.name,
        priceAdjustmentCentsSnapshot: option.priceAdjustmentCents,
      });
      selectedIds.delete(option.id);
    }
  }

  if (selectedIds.size > 0) {
    throw invalidConfiguration();
  }

  const optionsTotalCentsSnapshot = selectedOptions.reduce(
    (total, option) => total + option.priceAdjustmentCentsSnapshot,
    0,
  );
  const configuredUnitPriceCents = item.priceCents + optionsTotalCentsSnapshot;
  const lineTotalCents = configuredUnitPriceCents * line.quantity;
  assertSafeCents(item.priceCents);
  assertSafeCents(optionsTotalCentsSnapshot);
  assertSafeCents(configuredUnitPriceCents);
  assertSafeCents(lineTotalCents);

  return {
    menuItemId: item.id,
    itemNameSnapshot: item.name,
    unitPriceCentsSnapshot: item.priceCents,
    quantity: line.quantity,
    optionsTotalCentsSnapshot,
    configuredUnitPriceCents,
    lineTotalCents,
    selectedOptions,
  };
}

function validateSettings(input: CheckoutInput, settings: CheckoutSettings) {
  if (
    (input.fulfilmentType === "PICKUP" && !settings.pickupEnabled) ||
    (input.fulfilmentType === "DELIVERY" && !settings.deliveryEnabled)
  ) {
    throw new CheckoutError(
      "ORDERING_UNAVAILABLE",
      "That fulfilment method is currently unavailable.",
    );
  }

  if (
    (input.paymentMethod === "PAY_ON_PICKUP" && input.fulfilmentType !== "PICKUP") ||
    (input.paymentMethod === "PAY_ON_DELIVERY" && input.fulfilmentType !== "DELIVERY")
  ) {
    throw new CheckoutError(
      "PAYMENT_UNAVAILABLE",
      "That payment method is not compatible with fulfilment.",
    );
  }

  const paymentEnabled =
    (input.paymentMethod === "PAY_ON_PICKUP" && settings.payOnPickupEnabled) ||
    (input.paymentMethod === "PAY_ON_DELIVERY" && settings.payOnDeliveryEnabled) ||
    (input.paymentMethod === "DEMO_CARD" && settings.demoCardEnabled);

  if (!paymentEnabled) {
    throw new CheckoutError(
      "PAYMENT_UNAVAILABLE",
      "That payment method is currently unavailable.",
    );
  }
}

function invalidConfiguration() {
  return new CheckoutError(
    "INVALID_CONFIGURATION",
    "One or more selected choices are no longer valid. Review your cart and try again.",
  );
}

function assertSafeCents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new CheckoutError(
      "INVALID_CONFIGURATION",
      "The current cart could not be priced safely.",
    );
  }
}
