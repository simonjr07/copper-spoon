import Link from "next/link";

import { PublicHeader } from "@/components/public-header";

export default function OrderNotFound() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Order unavailable
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            We could not find that order.
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-muted">
            Check the public order code and try again. For privacy, no additional order details are shown.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
              href="/track-order"
            >
              Try another code
            </Link>
            <Link
              className="rounded-full border border-[#3e2920]/15 px-6 py-3 text-sm font-semibold text-ink transition hover:border-copper hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
              href="/menu"
            >
              Browse the menu
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
