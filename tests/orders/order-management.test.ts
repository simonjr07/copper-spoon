import { describe, expect, it } from "vitest";

import {
  authorizeOrderTransition,
  canCancelOrder,
  getNormalNextStatus,
  type ManagedOrderStatus,
} from "@/features/orders/order-management";
import {
  updateManagedOrderStatus,
  type OrderManagementRepository,
  type OrderManagementTransaction,
} from "@/features/orders/order-service";

describe("order transition policy", () => {
  it.each([
    ["PENDING", "CONFIRMED"],
    ["CONFIRMED", "PREPARING"],
    ["PREPARING", "READY"],
    ["READY", "COMPLETED"],
  ] as const)("allows %s → %s", (currentStatus, requestedStatus) => {
    expect(
      authorizeOrderTransition({ role: "STAFF", currentStatus, requestedStatus }),
    ).toEqual({ note: null });
    expect(getNormalNextStatus(currentStatus)).toBe(requestedStatus);
  });

  it.each([
    ["PENDING", "PREPARING"],
    ["PREPARING", "CONFIRMED"],
    ["COMPLETED", "PENDING"],
    ["CANCELLED", "CONFIRMED"],
  ] as const)("rejects invalid or terminal transition %s → %s", (currentStatus, requestedStatus) => {
    expect(() => authorizeOrderTransition({ role: "ADMIN", currentStatus, requestedStatus })).toThrowError(
      expect.objectContaining({ code: "INVALID_TRANSITION" }),
    );
  });

  it("allows staff cancellation only while pending or confirmed", () => {
    expect(canCancelOrder("STAFF", "PENDING")).toBe(true);
    expect(canCancelOrder("STAFF", "CONFIRMED")).toBe(true);
    expect(canCancelOrder("STAFF", "PREPARING")).toBe(false);
    expect(canCancelOrder("STAFF", "READY")).toBe(false);
  });

  it("allows admin cancellation through preparing but never at ready or terminal states", () => {
    expect(canCancelOrder("ADMIN", "PREPARING")).toBe(true);
    expect(canCancelOrder("ADMIN", "READY")).toBe(false);
    expect(canCancelOrder("ADMIN", "COMPLETED")).toBe(false);
    expect(canCancelOrder("ADMIN", "CANCELLED")).toBe(false);
  });

  it("requires and trims a cancellation reason", () => {
    expect(() => authorizeOrderTransition({ role: "STAFF", currentStatus: "PENDING", requestedStatus: "CANCELLED", cancellationReason: "   " })).toThrowError(
      expect.objectContaining({ code: "CANCELLATION_REASON_REQUIRED" }),
    );
    expect(authorizeOrderTransition({ role: "STAFF", currentStatus: "PENDING", requestedStatus: "CANCELLED", cancellationReason: "  Customer called  " })).toEqual({ note: "Customer called" });
  });
});

describe("atomic managed order updates", () => {
  it("records the authenticated actor, statuses, timestamp and cancellation note", async () => {
    const fake = makeRepository("CONFIRMED");
    const changedAt = new Date("2026-09-28T20:00:00.000Z");

    await updateManagedOrderStatus(
      { orderId: "order-1", expectedUpdatedAt: fake.updatedAt.toISOString(), requestedStatus: "CANCELLED", cancellationReason: "  Kitchen closure  " },
      { id: "staff-1", role: "STAFF" },
      fake.repository,
      () => changedAt,
    );

    expect(fake.status()).toBe("CANCELLED");
    expect(fake.events).toEqual([{ orderId: "order-1", fromStatus: "CONFIRMED", toStatus: "CANCELLED", changedByUserId: "staff-1", note: "Kitchen closure", changedAt }]);
  });

  it("rejects a stale submission before changing status or history", async () => {
    const fake = makeRepository("PENDING");
    await expect(updateManagedOrderStatus(
      { orderId: "order-1", expectedUpdatedAt: "2026-09-28T18:00:00.000Z", requestedStatus: "CONFIRMED" },
      { id: "staff-1", role: "STAFF" },
      fake.repository,
    )).rejects.toMatchObject({ code: "STALE_ORDER" });
    expect(fake.status()).toBe("PENDING");
    expect(fake.events).toHaveLength(0);
  });

  it("rolls back the status update when audit-event creation fails", async () => {
    const fake = makeRepository("PENDING", true);
    await expect(updateManagedOrderStatus(
      { orderId: "order-1", expectedUpdatedAt: fake.updatedAt.toISOString(), requestedStatus: "CONFIRMED" },
      { id: "staff-1", role: "STAFF" },
      fake.repository,
    )).rejects.toThrow("event write failed");
    expect(fake.status()).toBe("PENDING");
    expect(fake.events).toHaveLength(0);
  });

  it("detects a concurrent write during the conditional update", async () => {
    const fake = makeRepository("PENDING", false, true);
    await expect(updateManagedOrderStatus(
      { orderId: "order-1", expectedUpdatedAt: fake.updatedAt.toISOString(), requestedStatus: "CONFIRMED" },
      { id: "staff-1", role: "STAFF" },
      fake.repository,
    )).rejects.toMatchObject({ code: "STALE_ORDER" });
    expect(fake.events).toHaveLength(0);
  });

  it("maps a database serialization conflict to a safe stale-order error", async () => {
    const repository: OrderManagementRepository = {
      async transaction() {
        throw Object.assign(new Error("transaction conflict"), { code: "P2034" });
      },
    };
    await expect(updateManagedOrderStatus(
      { orderId: "order-1", expectedUpdatedAt: "2026-09-28T19:00:00.000Z", requestedStatus: "CONFIRMED" },
      { id: "staff-1", role: "STAFF" },
      repository,
    )).rejects.toMatchObject({ code: "STALE_ORDER" });
  });
});

function makeRepository(initialStatus: ManagedOrderStatus, failEvent = false, failConditionalUpdate = false) {
  let status = initialStatus;
  const updatedAt = new Date("2026-09-28T19:00:00.000Z");
  const events: Parameters<OrderManagementTransaction["createStatusEvent"]>[0][] = [];
  const repository: OrderManagementRepository = {
    async transaction(work) {
      const snapshot = status;
      try {
        return await work({
          async findCurrentOrder() { return { id: "order-1", status, updatedAt }; },
          async updateIfCurrent(input) {
            if (failConditionalUpdate) return false;
            status = input.toStatus;
            return true;
          },
          async createStatusEvent(input) {
            if (failEvent) throw new Error("event write failed");
            events.push(input);
          },
        });
      } catch (error) {
        status = snapshot;
        events.length = 0;
        throw error;
      }
    },
  };
  return { repository, updatedAt, events, status: () => status };
}
