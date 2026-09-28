import { describe, expect, it } from "vitest";

import {
  aggregatePopularSnapshotItems,
  createDashboardAnalytics,
  getSevenDayWindow,
  groupDailyActivity,
  type DashboardAggregateInput,
} from "@/features/analytics/dashboard-analytics";

const recent = (code: string, placedAt: string) => ({
  detailHref: `/admin/orders/${code}`,
  publicCode: code,
  status: "PENDING" as const,
  fulfilmentType: "PICKUP" as const,
  placedAt: new Date(placedAt),
  totalCents: 1200,
  currency: "USD",
});

function input(overrides: Partial<DashboardAggregateInput> = {}): DashboardAggregateInput {
  return {
    timezone: "America/New_York",
    currency: "USD",
    statusRows: [],
    ordersToday: 0,
    fulfilmentRows: [],
    recentOrders: [],
    activityRows: [],
    popularRows: [],
    dayKeys: ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"],
    ...overrides,
  };
}

describe("dashboard analytics DTO", () => {
  it("fills complete status counts and derives total orders", () => {
    const analytics = createDashboardAnalytics(input({ statusRows: [{ status: "PENDING", count: 2 }, { status: "COMPLETED", count: 5 }, { status: "CANCELLED", count: 1 }] }));
    expect(analytics.totalOrders).toBe(8);
    expect(analytics.statusCounts).toEqual({ PENDING: 2, CONFIRMED: 0, PREPARING: 0, READY: 0, COMPLETED: 5, CANCELLED: 1 });
  });

  it("preserves the timezone-aware today count supplied by the bounded query", () => {
    expect(createDashboardAnalytics(input({ ordersToday: 4 })).ordersToday).toBe(4);
  });

  it("sorts recent orders newest-first and limits the DTO to six", () => {
    const recentOrders = Array.from({ length: 8 }, (_, index) => recent(`CS-${index}`, `2026-09-${String(20 + index).padStart(2, "0")}T12:00:00Z`)).reverse();
    const result = createDashboardAnalytics(input({ recentOrders })).recentOrders;
    expect(result).toHaveLength(6);
    expect(result[0]?.publicCode).toBe("CS-7");
    expect(result[5]?.publicCode).toBe("CS-2");
  });

  it("fills missing daily activity with zero and retains all seven days", () => {
    const activity = createDashboardAnalytics(input({ activityRows: [{ day: "2026-09-23", count: 2 }, { day: "2026-09-28", count: 1 }] })).activity;
    expect(activity).toHaveLength(7);
    expect(activity[0]).toEqual({ day: "2026-09-22", count: 0 });
    expect(activity.at(-1)).toEqual({ day: "2026-09-28", count: 1 });
  });

  it("returns pickup/delivery zeroes for an empty dataset", () => {
    const analytics = createDashboardAnalytics(input());
    expect(analytics).toMatchObject({ totalOrders: 0, ordersToday: 0, fulfilment: { PICKUP: 0, DELIVERY: 0 }, recentOrders: [], popularItems: [] });
  });

  it("maps pickup and delivery aggregate counts", () => {
    expect(createDashboardAnalytics(input({ fulfilmentRows: [{ fulfilmentType: "PICKUP", count: 7 }, { fulfilmentType: "DELIVERY", count: 3 }] })).fulfilment).toEqual({ PICKUP: 7, DELIVERY: 3 });
  });

  it("does not copy private or unrestricted source fields into the DTO", () => {
    const unsafe = { ...recent("CS-SAFE1", "2026-09-28T12:00:00Z"), id: "internal-id", customerEmail: "private@example.test", customerPhone: "+1 202-555-0199", customerNote: "private" };
    const serialized = JSON.stringify(createDashboardAnalytics(input({ recentOrders: [unsafe] })));
    expect(serialized).not.toContain("internal-id");
    expect(serialized).not.toContain("private@example.test");
    expect(serialized).not.toContain("customerNote");
  });
});

describe("timezone grouping and historical snapshots", () => {
  it("builds a seven-day window using restaurant-local midnight", () => {
    const window = getSevenDayWindow(new Date("2026-09-28T02:30:00Z"), "America/New_York");
    expect(window.dayKeys.at(-1)).toBe("2026-09-27");
    expect(window.todayStartUtc.toISOString()).toBe("2026-09-27T04:00:00.000Z");
    expect(window.endUtc.toISOString()).toBe("2026-09-28T04:00:00.000Z");
  });

  it("uses the offset at each local midnight across a daylight-saving boundary", () => {
    const window = getSevenDayWindow(new Date("2026-03-08T07:30:00Z"), "America/New_York");
    expect(window.todayStartUtc.toISOString()).toBe("2026-03-08T05:00:00.000Z");
    expect(window.endUtc.toISOString()).toBe("2026-03-09T04:00:00.000Z");
  });

  it("groups UTC instants by restaurant-local calendar day", () => {
    expect(groupDailyActivity([new Date("2026-09-28T01:00:00Z"), new Date("2026-09-28T05:00:00Z")], "America/New_York")).toEqual([{ day: "2026-09-27", count: 1 }, { day: "2026-09-28", count: 1 }]);
  });

  it("aggregates popularity by immutable snapshot name and distinct orders", () => {
    const result = aggregatePopularSnapshotItems([
      { orderId: "order-1", itemNameSnapshot: "Copper Burger", quantity: 2 },
      { orderId: "order-2", itemNameSnapshot: "Copper Burger", quantity: 1 },
      { orderId: "order-2", itemNameSnapshot: "Historic Torte", quantity: 1 },
    ]);
    expect(result).toEqual([
      { itemName: "Copper Burger", quantity: 3, orderCount: 2 },
      { itemName: "Historic Torte", quantity: 1, orderCount: 1 },
    ]);
  });
});
