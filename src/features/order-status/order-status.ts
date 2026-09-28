import { PUBLIC_ORDER_CODE_PATTERN } from "@/features/checkout/order-service";

export type CustomerOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type CustomerFulfilmentType = "PICKUP" | "DELIVERY";

export type CustomerOrderRecord = {
  publicCode: string;
  status: CustomerOrderStatus;
  fulfilmentType: CustomerFulfilmentType;
  paymentMethod: "PAY_ON_PICKUP" | "PAY_ON_DELIVERY" | "DEMO_CARD";
  paymentStatus: "UNPAID" | "SIMULATED" | "SETTLED";
  currency: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  placedAt: Date;
  items: Array<{
    itemNameSnapshot: string;
    unitPriceCentsSnapshot: number;
    optionsTotalCentsSnapshot: number;
    quantity: number;
    lineTotalCents: number;
    selectedOptions: Array<{
      optionGroupNameSnapshot: string;
      optionNameSnapshot: string;
      priceAdjustmentCentsSnapshot: number;
    }>;
  }>;
  statusEvents: Array<{
    toStatus: CustomerOrderStatus;
    createdAt: Date;
  }>;
};

export type CustomerOrder = ReturnType<typeof toCustomerOrder>;

export type CustomerOrderReader = {
  findByPublicCode(publicCode: string): Promise<CustomerOrder | null>;
};

export function normalizePublicOrderCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return PUBLIC_ORDER_CODE_PATTERN.test(normalized) ? normalized : null;
}

export function toCustomerOrder(record: CustomerOrderRecord, restaurantTimezone: string) {
  return {
    publicCode: record.publicCode,
    status: record.status,
    fulfilmentType: record.fulfilmentType,
    paymentMethod: record.paymentMethod,
    paymentStatus: record.paymentStatus,
    currency: record.currency,
    subtotalCents: record.subtotalCents,
    deliveryFeeCents: record.deliveryFeeCents,
    totalCents: record.totalCents,
    placedAt: record.placedAt,
    restaurantTimezone,
    items: record.items.map((item) => ({
      itemName: item.itemNameSnapshot,
      configuredUnitPriceCents:
        item.unitPriceCentsSnapshot + item.optionsTotalCentsSnapshot,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      selectedOptions: item.selectedOptions.map((option) => ({
        groupName: option.optionGroupNameSnapshot,
        optionName: option.optionNameSnapshot,
        priceAdjustmentCents: option.priceAdjustmentCentsSnapshot,
      })),
    })),
    timeline: record.statusEvents
      .toSorted((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((event) => ({
        status: event.toStatus,
        occurredAt: event.createdAt,
      })),
  };
}

export async function readCustomerOrder(
  publicCode: string,
  repository: CustomerOrderReader,
) {
  return repository.findByPublicCode(publicCode);
}

export function getStatusPresentation(
  status: CustomerOrderStatus,
  fulfilmentType: CustomerFulfilmentType,
) {
  switch (status) {
    case "PENDING":
      return {
        label: "Order received",
        message: "We received your order and it is waiting for restaurant confirmation.",
      };
    case "CONFIRMED":
      return {
        label: "Confirmed",
        message: "The restaurant has confirmed your order.",
      };
    case "PREPARING":
      return {
        label: "Being prepared",
        message: "The kitchen is preparing your order.",
      };
    case "READY":
      return fulfilmentType === "PICKUP"
        ? {
            label: "Ready for pickup",
            message: "Your order is ready for pickup. Keep your order code handy.",
          }
        : {
            label: "Prepared",
            message:
              "Your order is prepared and ready for the next delivery step. Live driver tracking and an exact ETA are not available.",
          };
    case "COMPLETED":
      return {
        label: "Completed",
        message: "This order has been completed.",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        message:
          "This order was cancelled. Contact the restaurant directly if you need clarification.",
      };
  }
}

export function getPaymentMethodLabel(
  paymentMethod: CustomerOrder["paymentMethod"],
) {
  switch (paymentMethod) {
    case "PAY_ON_PICKUP":
      return "Pay on pickup";
    case "PAY_ON_DELIVERY":
      return "Pay on delivery";
    case "DEMO_CARD":
      return "Demo card";
  }
}

export function getPaymentStatusLabel(
  paymentStatus: CustomerOrder["paymentStatus"],
) {
  switch (paymentStatus) {
    case "UNPAID":
      return "Unpaid";
    case "SIMULATED":
      return "Simulated";
    case "SETTLED":
      return "Settled";
  }
}

export function formatCustomerOrderTime(date: Date, restaurantTimezone: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: restaurantTimezone,
    timeZoneName: "short",
  };

  try {
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }

    return new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: "UTC",
    }).format(date);
  }
}
