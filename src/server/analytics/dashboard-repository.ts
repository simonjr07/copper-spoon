import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
  createDashboardAnalytics,
  getSevenDayWindow,
  type DashboardStatus,
} from "@/features/analytics/dashboard-analytics";
import { prisma } from "@/server/db/prisma";

type ActivityRow = { day: string; count: number };
type PopularRow = { itemName: string; quantity: number; orderCount: number };

export async function getDashboardAnalytics(now = new Date()) {
  const settings = await prisma.restaurantSettings.findUnique({
    where: { id: "restaurant-settings" },
    select: { timezone: true, currency: true },
  });
  const window = getSevenDayWindow(now, settings?.timezone ?? "UTC");

  const [statusRows, ordersToday, fulfilmentRows, recentOrders, activityRows, popularRows] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count({ where: { placedAt: { gte: window.todayStartUtc, lt: window.endUtc } } }),
    prisma.order.groupBy({ by: ["fulfilmentType"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 6,
      select: { id: true, publicCode: true, status: true, fulfilmentType: true, placedAt: true, totalCents: true, currency: true },
    }),
    prisma.$queryRaw<ActivityRow[]>(Prisma.sql`
      SELECT to_char("placedAt" AT TIME ZONE ${window.timezone}, 'YYYY-MM-DD') AS day,
             COUNT(*)::int AS count
      FROM "Order"
      WHERE "placedAt" >= ${window.startUtc} AND "placedAt" < ${window.endUtc}
      GROUP BY day
      ORDER BY day ASC
    `),
    prisma.$queryRaw<PopularRow[]>(Prisma.sql`
      SELECT item."itemNameSnapshot" AS "itemName",
             SUM(item.quantity)::int AS quantity,
             COUNT(DISTINCT item."orderId")::int AS "orderCount"
      FROM "OrderItem" item
      INNER JOIN "Order" order_record ON order_record.id = item."orderId"
      WHERE order_record.status <> 'CANCELLED'::"OrderStatus"
      GROUP BY item."itemNameSnapshot"
      ORDER BY quantity DESC, "itemName" ASC
      LIMIT 5
    `),
  ]);

  return createDashboardAnalytics({
    timezone: window.timezone,
    currency: settings?.currency ?? "USD",
    statusRows: statusRows.map((row) => ({ status: row.status as DashboardStatus, count: row._count._all })),
    ordersToday,
    fulfilmentRows: fulfilmentRows.map((row) => ({ fulfilmentType: row.fulfilmentType, count: row._count._all })),
    recentOrders: recentOrders.map(({ id, ...order }) => ({ ...order, detailHref: `/admin/orders/${id}` })),
    activityRows,
    popularRows,
    dayKeys: window.dayKeys,
  });
}
