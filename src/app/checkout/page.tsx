import { randomUUID } from "node:crypto";

import type { Metadata } from "next";

import { PublicHeader } from "@/components/public-header";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { privateRouteRobots } from "@/lib/seo";
import { getCheckoutSettings } from "@/server/orders/order-repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | Copper Spoon",
  description: "Confirm a fictional Copper Spoon pickup or delivery order.",
  robots: privateRouteRobots,
};

export default async function CheckoutPage() {
  const settings = await getCheckoutSettings();

  return (
    <>
      <PublicHeader />
      {settings && (settings.pickupEnabled || settings.deliveryEnabled) ? (
        <CheckoutForm settings={settings} submissionToken={randomUUID()} />
      ) : (
        <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8" id="main-content" tabIndex={-1}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
              Ordering paused
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
              Checkout is temporarily unavailable.
            </h1>
            <p className="mt-5 leading-7 text-muted">
              Your browser cart is still here. Please return later to place the order.
            </p>
          </div>
        </main>
      )}
    </>
  );
}
