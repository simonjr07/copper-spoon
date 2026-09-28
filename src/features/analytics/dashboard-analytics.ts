export const dashboardStatuses = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

export type DashboardStatus = (typeof dashboardStatuses)[number];

export type DashboardAggregateInput = {
  timezone: string;
  currency: string;
  statusRows: Array<{ status: DashboardStatus; count: number }>;
  ordersToday: number;
  fulfilmentRows: Array<{ fulfilmentType: "PICKUP" | "DELIVERY"; count: number }>;
  recentOrders: Array<{
    detailHref: string;
    publicCode: string;
    status: DashboardStatus;
    fulfilmentType: "PICKUP" | "DELIVERY";
    placedAt: Date;
    totalCents: number;
    currency: string;
  }>;
  activityRows: Array<{ day: string; count: number }>;
  popularRows: Array<{ itemName: string; quantity: number; orderCount: number }>;
  dayKeys: string[];
};

export function createDashboardAnalytics(input: DashboardAggregateInput) {
  const statusCounts = Object.fromEntries(
    dashboardStatuses.map((status) => [status, 0]),
  ) as Record<DashboardStatus, number>;
  for (const row of input.statusRows) statusCounts[row.status] = row.count;

  const fulfilment = { PICKUP: 0, DELIVERY: 0 };
  for (const row of input.fulfilmentRows) fulfilment[row.fulfilmentType] = row.count;

  const activityByDay = new Map(input.activityRows.map((row) => [row.day, row.count]));

  return {
    timezone: input.timezone,
    currency: input.currency,
    totalOrders: Object.values(statusCounts).reduce((total, count) => total + count, 0),
    ordersToday: input.ordersToday,
    statusCounts,
    fulfilment,
    recentOrders: input.recentOrders
      .toSorted((left, right) => right.placedAt.getTime() - left.placedAt.getTime())
      .slice(0, 6)
      .map((order) => ({
        detailHref: order.detailHref,
        publicCode: order.publicCode,
        status: order.status,
        fulfilmentType: order.fulfilmentType,
        placedAt: order.placedAt,
        totalCents: order.totalCents,
        currency: order.currency,
      })),
    activity: input.dayKeys.map((day) => ({ day, count: activityByDay.get(day) ?? 0 })),
    popularItems: input.popularRows.slice(0, 5).map((row) => ({
      itemName: row.itemName,
      quantity: row.quantity,
      orderCount: row.orderCount,
    })),
  };
}

export type DashboardAnalytics = ReturnType<typeof createDashboardAnalytics>;

export function getSevenDayWindow(now: Date, timezone: string) {
  const safeTimezone = normalizeTimezone(timezone);
  const today = getZonedDateParts(now, safeTimezone);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day - (6 - index)));
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  });
  const tomorrow = new Date(Date.UTC(today.year, today.month - 1, today.day + 1));
  return {
    timezone: safeTimezone,
    dayKeys: days.map(toDateKey),
    startUtc: zonedMidnightToUtc(days[0]!, safeTimezone),
    todayStartUtc: zonedMidnightToUtc(today, safeTimezone),
    endUtc: zonedMidnightToUtc(
      { year: tomorrow.getUTCFullYear(), month: tomorrow.getUTCMonth() + 1, day: tomorrow.getUTCDate() },
      safeTimezone,
    ),
  };
}

export function formatDashboardDay(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year!, month! - 1, date)));
}

export function formatDashboardTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: normalizeTimezone(timezone) }).format(date);
}

export function groupDailyActivity(dates: Date[], timezone: string) {
  const safeTimezone = normalizeTimezone(timezone);
  const counts = new Map<string, number>();
  for (const date of dates) {
    const key = toDateKey(getZonedDateParts(date, safeTimezone));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([day, count]) => ({ day, count })).toSorted((left, right) => left.day.localeCompare(right.day));
}

export function aggregatePopularSnapshotItems(items: Array<{ orderId: string; itemNameSnapshot: string; quantity: number }>) {
  const aggregates = new Map<string, { quantity: number; orderIds: Set<string> }>();
  for (const item of items) {
    const aggregate = aggregates.get(item.itemNameSnapshot) ?? { quantity: 0, orderIds: new Set<string>() };
    aggregate.quantity += item.quantity;
    aggregate.orderIds.add(item.orderId);
    aggregates.set(item.itemNameSnapshot, aggregate);
  }
  return [...aggregates.entries()]
    .map(([itemName, aggregate]) => ({ itemName, quantity: aggregate.quantity, orderCount: aggregate.orderIds.size }))
    .toSorted((left, right) => right.quantity - left.quantity || left.itemName.localeCompare(right.itemName));
}

function normalizeTimezone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date(0));
    return timezone;
  } catch {
    return "UTC";
  }
}

function getZonedDateParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function getTimezoneOffsetMs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const representedUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return representedUtc - Math.floor(date.getTime() / 1000) * 1000;
}

function zonedMidnightToUtc(parts: { year: number; month: number; day: number }, timezone: string) {
  const desiredUtc = Date.UTC(parts.year, parts.month - 1, parts.day);
  let candidate = new Date(desiredUtc);
  candidate = new Date(desiredUtc - getTimezoneOffsetMs(candidate, timezone));
  candidate = new Date(desiredUtc - getTimezoneOffsetMs(candidate, timezone));
  return candidate;
}

function toDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
