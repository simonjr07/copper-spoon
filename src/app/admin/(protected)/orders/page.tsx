import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import {
  getOrderStatusLabel,
  orderQueueFilterSchema,
  orderStatuses,
} from "@/features/orders/order-management";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/server/auth/authorization";
import {
  ADMIN_ORDER_PAGE_SIZE,
  listAdminOrders,
} from "@/server/orders/admin-order-repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePermission("orders:read");
  const raw = await searchParams;
  const filters = orderQueueFilterSchema.parse({
    view: single(raw.view),
    fulfilment: single(raw.fulfilment),
    q: single(raw.q),
    page: single(raw.page),
  });
  const result = await listAdminOrders(filters);
  const pageCount = Math.max(1, Math.ceil(result.total / ADMIN_ORDER_PAGE_SIZE));

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
      <AdminHeader user={user} />
      <section className="py-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Operations</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-ink">Order queue</h1>
          </div>
          <p className="text-sm text-muted">{result.total} matching orders</p>
        </div>

        <form className="mt-7 grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-[1fr_auto_auto_auto]" method="get">
          <label className="grid gap-1 text-sm font-medium text-ink">
            Search
            <input className="rounded-xl border border-line bg-white px-3 py-2.5" defaultValue={filters.q} name="q" placeholder="Code, customer, email or phone" />
          </label>
          <label className="grid gap-1 text-sm font-medium text-ink">
            Status
            <select className="rounded-xl border border-line bg-white px-3 py-2.5" defaultValue={filters.view} name="view">
              <option value="OPEN">Open queue</option>
              <option value="ALL">All statuses</option>
              {orderStatuses.map((status) => <option key={status} value={status}>{getOrderStatusLabel(status)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-medium text-ink">
            Fulfilment
            <select className="rounded-xl border border-line bg-white px-3 py-2.5" defaultValue={filters.fulfilment} name="fulfilment">
              <option value="ALL">All</option>
              <option value="PICKUP">Pickup</option>
              <option value="DELIVERY">Delivery</option>
            </select>
          </label>
          <button className="self-end rounded-xl bg-copper px-5 py-2.5 font-semibold text-white" type="submit">Apply</button>
        </form>

        {result.orders.length ? (
          <div className="mt-6 grid gap-3">
            {result.orders.map((order) => (
              <Link className="grid gap-3 rounded-2xl border border-line bg-surface p-5 transition hover:border-copper md:grid-cols-[1.1fr_1fr_1fr_auto] md:items-center" href={`/admin/orders/${order.id}`} key={order.id}>
                <div><p className="font-mono text-sm font-semibold text-copper">{order.publicCode}</p><p className="mt-1 font-semibold text-ink">{order.customerName}</p></div>
                <div><p className="font-semibold text-ink">{getOrderStatusLabel(order.status)}</p><p className="text-sm text-muted">{order.fulfilmentType === "PICKUP" ? "Pickup" : "Delivery"}</p></div>
                <div><p className="font-semibold text-ink">{formatMoney(order.totalCents, order.currency)}</p><p className="text-sm text-muted">{itemCount(order.items)} {itemCount(order.items) === 1 ? "item" : "items"}</p></div>
                <time className="text-sm text-muted" dateTime={order.placedAt.toISOString()}>{formatAdminTime(order.placedAt)}</time>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-line p-10 text-center"><h2 className="text-xl font-semibold">No matching orders</h2><p className="mt-2 text-muted">Adjust the queue filters or search terms.</p></div>
        )}

        {pageCount > 1 ? <Pagination filters={filters} pageCount={pageCount} /> : null}
      </section>
    </main>
  );
}

function Pagination({ filters, pageCount }: { filters: ReturnType<typeof orderQueueFilterSchema.parse>; pageCount: number }) {
  const href = (page: number) => `/admin/orders?${new URLSearchParams({ view: filters.view, fulfilment: filters.fulfilment, q: filters.q, page: String(page) })}`;
  return <nav aria-label="Order pages" className="mt-8 flex items-center justify-between text-sm"><span>Page {filters.page} of {pageCount}</span><div className="flex gap-2">{filters.page > 1 ? <Link className="rounded-lg border border-line bg-surface px-3 py-2" href={href(filters.page - 1)}>Previous</Link> : null}{filters.page < pageCount ? <Link className="rounded-lg border border-line bg-surface px-3 py-2" href={href(filters.page + 1)}>Next</Link> : null}</div></nav>;
}

function single(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function formatAdminTime(date: Date) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function itemCount(items: Array<{ quantity: number }>) { return items.reduce((total, item) => total + item.quantity, 0); }
