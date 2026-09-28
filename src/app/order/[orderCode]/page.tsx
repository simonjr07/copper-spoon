import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/public-header";
import { PUBLIC_ORDER_CODE_PATTERN } from "@/features/checkout/order-service";
import { formatMoney } from "@/lib/money";
import { getPublicOrder } from "@/server/orders/order-repository";

export const dynamic = "force-dynamic";

type ConfirmationPageProps = {
  params: Promise<{ orderCode: string }>;
};

export async function generateMetadata({
  params,
}: ConfirmationPageProps): Promise<Metadata> {
  const { orderCode } = await params;

  return {
    title: PUBLIC_ORDER_CODE_PATTERN.test(orderCode)
      ? `Order ${orderCode} | Copper Spoon`
      : "Order confirmation | Copper Spoon",
    description: "Copper Spoon fictional order confirmation.",
  };
}

export default async function OrderConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { orderCode } = await params;

  if (!PUBLIC_ORDER_CODE_PATTERN.test(orderCode)) {
    notFound();
  }

  const order = await getPublicOrder(orderCode);

  if (!order) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16 lg:px-12">
        <section className="overflow-hidden rounded-[1.75rem] border border-[#3e2920]/10 bg-[#fffaf2] shadow-[0_28px_80px_-55px_rgba(45,27,20,0.75)]">
          <div className="bg-[#35241d] px-6 py-9 text-white sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e6ad87]">
              Demo order received
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Thanks — the kitchen has your order.
            </h1>
            <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Order code</p>
                <p className="mt-1 font-mono text-xl font-semibold text-[#f4ceb5]">
                  {order.publicCode}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Status</p>
                <p className="mt-1 text-xl font-semibold">{humanize(order.status)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-white/55">Fulfilment</p>
                <p className="mt-1 text-xl font-semibold">
                  {humanize(order.fulfilmentType)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <section aria-labelledby="order-summary-heading">
              <h2 className="text-2xl font-semibold text-ink" id="order-summary-heading">
                Order summary
              </h2>
              <ul className="mt-6 divide-y divide-[#3e2920]/10">
                {order.items.map((item, index) => {
                  const configuredUnitPrice =
                    item.unitPriceCentsSnapshot + item.optionsTotalCentsSnapshot;

                  return (
                    <li className="py-5 first:pt-0" key={`${item.itemNameSnapshot}-${index}`}>
                      <div className="flex items-start justify-between gap-5">
                        <div>
                          <p className="font-semibold text-ink">
                            {item.quantity} × {item.itemNameSnapshot}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {formatMoney(configuredUnitPrice, order.currency)} each
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold text-copper">
                          {formatMoney(item.lineTotalCents, order.currency)}
                        </p>
                      </div>
                      {item.selectedOptions.length > 0 ? (
                        <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
                          {item.selectedOptions.map((option, optionIndex) => (
                            <li key={`${option.optionNameSnapshot}-${optionIndex}`}>
                              <span className="font-medium text-ink">
                                {option.optionGroupNameSnapshot}:
                              </span>{" "}
                              {option.optionNameSnapshot}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>

            <aside>
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
                <p className="text-sm font-semibold text-ink">What happens next</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {order.fulfilmentType === "PICKUP"
                    ? "Keep the order code handy. This fictional kitchen would confirm when collection is ready."
                    : "Keep the order code handy. This fictional kitchen would confirm preparation and delivery progress."}
                </p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Payment: {humanize(order.paymentMethod)} · {humanize(order.paymentStatus)}
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
        </div>
      </main>
    </>
  );
}

function humanize(value: string) {
  return value
    .toLocaleLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toLocaleUpperCase()}${part.slice(1)}`)
    .join(" ");
}
