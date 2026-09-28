import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminHeader } from "@/components/admin-header";
import {
  canCancelOrder,
  getNormalNextStatus,
  getOrderStatusLabel,
} from "@/features/orders/order-management";
import { OrderStatusActionForm } from "@/features/orders/order-status-action-form";
import { formatMoney, formatPriceAdjustment } from "@/lib/money";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminOrder } from "@/server/orders/admin-order-repository";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("orders:read");
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const nextStatus = getNormalNextStatus(order.status);
  const cancellable = canCancelOrder(user.role, order.status);

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-12">
      <AdminHeader user={user} />
      <div className="py-8">
        <Link className="text-sm font-semibold text-copper hover:underline" href="/admin/orders">← Back to order queue</Link>
        <div className="mt-5 flex flex-col gap-4 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-copper">{order.publicCode}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] text-ink">{order.customerName}</h1>
            <p className="mt-2 text-muted">Placed {formatAdminTime(order.placedAt)} · {order.fulfilmentType === "PICKUP" ? "Pickup" : "Delivery"}</p>
          </div>
          <div className="rounded-full border border-line bg-surface px-4 py-2 font-semibold text-ink">{getOrderStatusLabel(order.status)}</div>
        </div>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.75fr)]">
          <div className="space-y-7">
            <Section title="Order items">
              <div className="divide-y divide-line">
                {order.items.map((item) => (
                  <article className="py-5 first:pt-0 last:pb-0" key={item.id}>
                    <div className="flex justify-between gap-4"><div><h3 className="font-semibold text-ink">{item.quantity} × {item.itemNameSnapshot}</h3><p className="mt-1 text-sm text-muted">{formatMoney(item.unitPriceCentsSnapshot, order.currency)} each before options</p></div><p className="font-semibold">{formatMoney(item.lineTotalCents, order.currency)}</p></div>
                    {item.selectedOptions.length ? <ul className="mt-3 space-y-1 text-sm text-muted">{item.selectedOptions.map((option) => <li key={option.id}>{option.optionGroupNameSnapshot}: {option.optionNameSnapshot} ({formatPriceAdjustment(option.priceAdjustmentCentsSnapshot, order.currency)})</li>)}</ul> : null}
                    {item.customerNote ? <p className="mt-3 rounded-xl bg-background p-3 text-sm"><strong>Item note:</strong> {item.customerNote}</p> : null}
                  </article>
                ))}
              </div>
            </Section>

            <Section title="Status history">
              <ol className="space-y-4">
                {order.statusEvents.map((event) => (
                  <li className="border-l-2 border-copper pl-4" key={event.id}>
                    <p className="font-semibold">{event.fromStatus ? `${getOrderStatusLabel(event.fromStatus)} → ` : ""}{getOrderStatusLabel(event.toStatus)}</p>
                    <p className="mt-1 text-sm text-muted">{formatAdminTime(event.createdAt)} · {event.changedBy ? `${event.changedBy.name} (${event.changedBy.role})` : "System"}</p>
                    {event.note ? <p className="mt-2 rounded-xl bg-background p-3 text-sm"><strong>Internal note:</strong> {event.note}</p> : null}
                  </li>
                ))}
              </ol>
            </Section>
          </div>

          <aside className="space-y-5">
            <Section title="Process order">
              <div className="space-y-4">
                {nextStatus ? <OrderStatusActionForm expectedUpdatedAt={order.updatedAt.toISOString()} orderId={order.id} requestedStatus={nextStatus} /> : <p className="rounded-xl bg-background p-3 text-sm text-muted">This order is in a terminal state. No further status changes are allowed.</p>}
                {cancellable ? <OrderStatusActionForm cancellation expectedUpdatedAt={order.updatedAt.toISOString()} orderId={order.id} requestedStatus="CANCELLED" /> : null}
              </div>
            </Section>

            <Section title="Customer & fulfilment">
              <dl className="space-y-3 text-sm">
                <Detail label="Name" value={order.customerName} />
                <Detail label="Email" value={order.customerEmail} />
                <Detail label="Phone" value={order.customerPhone} />
                <Detail label="Type" value={order.fulfilmentType === "PICKUP" ? "Pickup" : "Delivery"} />
                {order.fulfilmentType === "DELIVERY" ? <Detail label="Address" value={[order.deliveryAddressLine1, order.deliveryAddressLine2, order.deliveryCity, order.deliveryRegion, order.deliveryPostalCode, order.deliveryCountry].filter(Boolean).join(", ")} /> : null}
              </dl>
              {order.customerNote ? <p className="mt-4 rounded-xl bg-background p-3 text-sm"><strong>Customer note:</strong> {order.customerNote}</p> : null}
            </Section>

            <Section title="Payment & totals">
              <dl className="space-y-3 text-sm">
                <Detail label="Payment" value={humanize(order.paymentMethod)} />
                <Detail label="Payment status" value={humanize(order.paymentStatus)} />
                <Detail label="Subtotal" value={formatMoney(order.subtotalCents, order.currency)} />
                <Detail label="Delivery fee" value={formatMoney(order.deliveryFeeCents, order.currency)} />
                <Detail label="Total" value={formatMoney(order.totalCents, order.currency)} strong />
              </dl>
            </Section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="mb-5 text-xl font-semibold text-ink">{title}</h2>{children}</section>; }
function Detail({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="grid grid-cols-[7rem_1fr] gap-3"><dt className="text-muted">{label}</dt><dd className={strong ? "font-bold text-ink" : "font-medium text-ink"}>{value}</dd></div>; }
function formatAdminTime(date: Date) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function humanize(value: string) { return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }

