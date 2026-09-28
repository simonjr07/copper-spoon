import { describe, expect, it } from "vitest";

import {
  formatCustomerOrderTime,
  getStatusPresentation,
  normalizePublicOrderCode,
  readCustomerOrder,
  toCustomerOrder,
  type CustomerOrder,
  type CustomerOrderReader,
  type CustomerOrderRecord,
} from "@/features/order-status/order-status";

const placedAt = new Date("2026-09-28T18:00:00.000Z");

function orderRecord(
  overrides: Partial<CustomerOrderRecord> = {},
): CustomerOrderRecord {
  return {
    publicCode: "CS-ABC2345678",
    status: "PENDING",
    fulfilmentType: "PICKUP",
    paymentMethod: "PAY_ON_PICKUP",
    paymentStatus: "UNPAID",
    currency: "USD",
    subtotalCents: 3_200,
    deliveryFeeCents: 0,
    totalCents: 3_200,
    placedAt,
    items: [
      {
        itemNameSnapshot: "Copper Burger",
        unitPriceCentsSnapshot: 1_450,
        optionsTotalCentsSnapshot: 150,
        quantity: 2,
        lineTotalCents: 3_200,
        selectedOptions: [
          {
            optionGroupNameSnapshot: "Add extras",
            optionNameSnapshot: "Cheddar",
            priceAdjustmentCentsSnapshot: 150,
          },
        ],
      },
    ],
    statusEvents: [
      { toStatus: "PENDING", createdAt: placedAt },
    ],
    ...overrides,
  };
}

describe("customer-safe order status", () => {
  it("normalizes valid codes and rejects invalid input", () => {
    expect(normalizePublicOrderCode("  cs-abc2345678 ")).toBe("CS-ABC2345678");
    expect(normalizePublicOrderCode("123")).toBeNull();
    expect(normalizePublicOrderCode("CS-ABC_123")).toBeNull();
  });

  it("returns a purpose-built customer DTO without internal or contact fields", () => {
    const record = {
      ...orderRecord(),
      statusEvents: [
        {
          toStatus: "PENDING" as const,
          createdAt: placedAt,
          note: "Internal cancellation explanation",
          changedByUserId: "internal-staff-id",
        },
      ],
      id: "internal-order-id",
      customerEmail: "private@example.test",
      customerPhone: "+1 202-555-0199",
      internalNote: "Never expose this",
      changedByUserId: "internal-staff-id",
    };
    const order = toCustomerOrder(record, "America/New_York");

    expect(order.publicCode).toBe("CS-ABC2345678");
    expect(order).not.toHaveProperty("id");
    expect(order).not.toHaveProperty("customerEmail");
    expect(order).not.toHaveProperty("customerPhone");
    expect(order).not.toHaveProperty("internalNote");
    expect(JSON.stringify(order)).not.toContain("internal-staff-id");
    expect(JSON.stringify(order)).not.toContain("Internal cancellation explanation");
  });

  it("preserves immutable snapshot names and prices", () => {
    const record = orderRecord();
    const order = toCustomerOrder(record, "UTC");
    record.items[0]!.itemNameSnapshot = "Catalog name changed later";
    record.items[0]!.unitPriceCentsSnapshot = 9_999;

    expect(order.items[0]).toMatchObject({
      itemName: "Copper Burger",
      configuredUnitPriceCents: 1_600,
      lineTotalCents: 3_200,
    });
    expect(order.items[0]?.selectedOptions[0]).toEqual({
      groupName: "Add extras",
      optionName: "Cheddar",
      priceAdjustmentCents: 150,
    });
  });

  it("orders only recorded status history chronologically", () => {
    const order = toCustomerOrder(
      orderRecord({
        status: "PREPARING",
        statusEvents: [
          { toStatus: "PREPARING", createdAt: new Date("2026-09-28T18:20:00Z") },
          { toStatus: "PENDING", createdAt: new Date("2026-09-28T18:00:00Z") },
          { toStatus: "CONFIRMED", createdAt: new Date("2026-09-28T18:10:00Z") },
        ],
      }),
      "UTC",
    );

    expect(order.timeline.map((event) => event.status)).toEqual([
      "PENDING",
      "CONFIRMED",
      "PREPARING",
    ]);
    expect(order.timeline).toHaveLength(3);
  });

  it("presents cancelled orders clearly", () => {
    expect(getStatusPresentation("CANCELLED", "PICKUP")).toEqual({
      label: "Cancelled",
      message:
        "This order was cancelled. Contact the restaurant directly if you need clarification.",
    });
  });

  it("uses honest fulfilment-aware READY messaging", () => {
    const pickup = getStatusPresentation("READY", "PICKUP");
    const delivery = getStatusPresentation("READY", "DELIVERY");

    expect(pickup.label).toBe("Ready for pickup");
    expect(pickup.message).toContain("ready for pickup");
    expect(delivery.label).toBe("Prepared");
    expect(delivery.message).toContain("next delivery step");
    expect(delivery.message).toContain("Live driver tracking");
  });

  it("formats placed and event times in the restaurant timezone with UTC fallback", () => {
    expect(formatCustomerOrderTime(placedAt, "America/New_York")).toContain("Sep");
    expect(formatCustomerOrderTime(placedAt, "Not/A_Timezone")).toContain("UTC");
  });
});

describe("fresh public order reads", () => {
  it("returns null for an unknown public code", async () => {
    const repository: CustomerOrderReader = {
      async findByPublicCode() {
        return null;
      },
    };

    await expect(readCustomerOrder("CS-NOTFOUND2", repository)).resolves.toBeNull();
  });

  it("calls the repository for each read instead of retaining stale state", async () => {
    let currentStatus: CustomerOrder["status"] = "PENDING";
    let reads = 0;
    const repository: CustomerOrderReader = {
      async findByPublicCode() {
        reads += 1;
        return toCustomerOrder(orderRecord({ status: currentStatus }), "UTC");
      },
    };

    const first = await readCustomerOrder("CS-ABC2345678", repository);
    currentStatus = "CONFIRMED";
    const second = await readCustomerOrder("CS-ABC2345678", repository);

    expect(first?.status).toBe("PENDING");
    expect(second?.status).toBe("CONFIRMED");
    expect(reads).toBe(2);
  });
});
