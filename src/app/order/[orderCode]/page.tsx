import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PublicHeader } from "@/components/public-header";
import {
  formatCustomerOrderTime,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getStatusPresentation,
  normalizePublicOrderCode,
  readCustomerOrder,
} from "@/features/order-status/order-status";
import { formatMoney } from "@/lib/money";
import { privateRouteRobots } from "@/lib/seo";
import { publicOrderRepository } from "@/server/orders/public-order-repository";
import { logOperationalError } from "@/server/observability/log";
import { checkRequestRateLimit } from "@/server/security/rate-limit";

export const dynamic = "force-dynamic";

type OrderStatusPageProps = {
  params: Promise<{ orderCode: string }>;
};

export async function generateMetadata({
  params,
}: OrderStatusPageProps): Promise<Metadata> {
  const { orderCode } = await params;
  const normalizedCode = normalizePublicOrderCode(orderCode);

  return {
    title: normalizedCode
      ? `Order ${normalizedCode} | Copper Spoon`
      : "Order status | Copper Spoon",
    description: "View the latest customer-safe status for a fictional Copper Spoon order.",
    robots: privateRouteRobots,
  };
}

export default async function OrderStatusPage({ params }: OrderStatusPageProps) {
  const { orderCode } = await params;
  const normalizedCode = normalizePublicOrderCode(orderCode);

  if (!normalizedCode) {
    notFound();
  }

  if (normalizedCode !== orderCode) {
    redirect(`/order/${normalizedCode}`);
  }

  let lookupAllowed = false;
  try {
    const rateLimit = await checkRequestRateLimit("ORDER_LOOKUP");
    lookupAllowed = rateLimit.allowed;
  } catch (error) {
    logOperationalError("order_lookup.rate_limit_unavailable", error);
    lookupAllowed = false;
  }

  if (!lookupAllowed) {
    return <OrderLookupUnavailable />;
  }

  const order = await readCustomerOrder(normalizedCode, publicOrderRepository);

  if (!order) {
    notFound();
  }

  const currentStatus = getStatusPresentation(order.status, order.fulfilmentType);
  const currentTimelineIndex = order.timeline.findLastIndex(
    (event) => event.status === order.status,
  );
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12" id="main-content" tabIndex={-1}>
        <section
          className={`overflow-hidden rounded-[1.75rem] shadow-[0_28px_80px_-55px_rgba(45,27,20,0.75)] ${
            isCancelled
              ? "border border-[#9b3e30]/25 bg-[#fff8f5]"
              : "border border-[#3e2920]/10 bg-[#fffaf2]"
          }`}
        >
          <div
            className={`px-6 py-9 text-white sm:px-10 sm:py-12 ${
              isCancelled ? "bg-[#712f27]" : "bg-[#35241d]"
            }`}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f4ceb5]">
                  Current order status
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {currentStatus.label}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
                  {currentStatus.message}
                </p>
              </div>
              <form action={`/order/${order.publicCode}`} method="get">
                <button
                  className="w-fit rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  type="submit"
                >
                  Refresh status
                </button>
              </form>
            </div>

            <dl className="mt-8 grid gap-5 border-t border-white/12 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/50">Order code</dt>
                <dd className="mt-1 break-words font-mono text-lg font-semibold tracking-[0.04em] text-[#f4ceb5]">
                  {order.publicCode}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/50">Placed</dt>
                <dd className="mt-1 text-sm font-semibold leading-6">
                  {formatCustomerOrderTime(order.placedAt, order.restaurantTimezone)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/50">Fulfilment</dt>
                <dd className="mt-1 text-lg font-semibold">
                  {order.fulfilmentType === "PICKUP" ? "Pickup" : "Delivery"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/50">Payment</dt>
                <dd className="mt-1 text-sm font-semibold leading-6">
                  {getPaymentMethodLabel(order.paymentMethod)} ·{" "}
                  {getPaymentStatusLabel(order.paymentStatus)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <section aria-labelledby="order-summary-heading">
                <h2 className="text-2xl font-semibold text-ink" id="order-summary-heading">
                  Order summary
                </h2>
                <ul className="mt-6 divide-y divide-[#3e2920]/10">
                  {order.items.map((item, index) => (
                    <li className="py-5 first:pt-0" key={`${item.itemName}-${index}`}>
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="font-semibold text-ink">
                            {item.quantity} × {item.itemName}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {formatMoney(item.configuredUnitPriceCents, order.currency)} each
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold text-copper">
                          {formatMoney(item.lineTotalCents, order.currency)}
                        </p>
                      </div>
                      {item.selectedOptions.length > 0 ? (
                        <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
                          {item.selectedOptions.map((option, optionIndex) => (
                            <li key={`${option.optionName}-${optionIndex}`}>
                              <span className="font-medium text-ink">{option.groupName}:</span>{" "}
                              {option.optionName}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-10 border-t border-[#3e2920]/10 pt-8" aria-labelledby="status-history-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper">
                  Recorded updates
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink" id="status-history-heading">
                  Status history
                </h2>
                {order.timeline.length > 0 ? (
                  <ol className="mt-6 space-y-0">
                    {order.timeline.map((event, index) => {
                      const presentation = getStatusPresentation(
                        event.status,
                        order.fulfilmentType,
                      );
                      const isCurrent = index === currentTimelineIndex;

                      return (
                        <li
                          aria-current={isCurrent ? "step" : undefined}
                          className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-4 pb-7 last:pb-0"
                          key={`${event.status}-${event.occurredAt.toISOString()}-${index}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`relative z-10 mt-1 size-5 rounded-full border-4 border-[#fffaf2] ${
                              event.status === "CANCELLED"
                                ? "bg-[#9b3e30]"
                                : isCurrent
                                  ? "bg-copper"
                                  : "bg-[#bda99a]"
                            }`}
                          />
                          {index < order.timeline.length - 1 ? (
                            <span
                              aria-hidden="true"
                              className="absolute bottom-0 left-[0.57rem] top-5 w-px bg-[#3e2920]/15"
                            />
                          ) : null}
                          <div>
                            <p className="font-semibold text-ink">{presentation.label}</p>
                            <p className="mt-1 text-sm leading-6 text-muted">
                              {presentation.message}
                            </p>
                            <time
                              className="mt-2 block text-xs font-medium uppercase tracking-[0.08em] text-muted"
                              dateTime={event.occurredAt.toISOString()}
                            >
                              {formatCustomerOrderTime(
                                event.occurredAt,
                                order.restaurantTimezone,
                              )}
                            </time>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-muted">
                    No status events have been recorded for this order.
                  </p>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <dl className="space-y-3 rounded-2xl bg-[#f5e8db] p-5 text-sm">
                <div className="flex justify-between gap-4 text-muted">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(order.subtotalCents, order.currency)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-muted">
                  <dt>Delivery fee</dt>
                  <dd>{formatMoney(order.deliveryFeeCents, order.currency)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[#3e2920]/10 pt-3 text-base font-semibold text-ink">
                  <dt>Total</dt>
                  <dd>{formatMoney(order.totalCents, order.currency)}</dd>
                </div>
              </dl>
              <div className="mt-5 rounded-2xl border border-[#3e2920]/10 p-5">
                <p className="text-sm font-semibold text-ink">Status updates</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  This demo does not send notifications, expose kitchen telemetry, or provide live driver tracking. Refresh this page for the latest recorded status.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
            href="/menu"
          >
            Browse the menu
          </Link>
          <Link
            className="rounded-full border border-[#3e2920]/15 bg-white/60 px-6 py-3 text-sm font-semibold text-ink transition hover:border-copper hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
            href="/track-order"
          >
            Track another order
          </Link>
        </div>
      </main>
    </>
  );
}

function OrderLookupUnavailable() {
  return (
    <>
      <PublicHeader />
      <main
        className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8"
        id="main-content"
        tabIndex={-1}
      >
        <section className="surface-card w-full p-7 sm:p-10">
          <p className="eyebrow">Order lookup paused</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Please try again in a few minutes.
          </h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-muted">
            We temporarily limited order lookups from this connection. No order
            details were exposed.
          </p>
          <Link className="button-secondary mt-7 inline-flex" href="/track-order">
            Return to order tracking
          </Link>
        </section>
      </main>
    </>
  );
}
