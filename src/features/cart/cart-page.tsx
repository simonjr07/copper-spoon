"use client";

import Link from "next/link";

import { MenuVisual } from "@/components/menu-visual";
import {
  MAX_CART_QUANTITY,
  getCartSubtotal,
  getConfiguredUnitPrice,
  getLineTotal,
} from "@/features/cart/cart";
import { useCart } from "@/features/cart/cart-provider";
import { formatMoney } from "@/lib/money";

export function CartPageContent() {
  const { isHydrated, itemCount, lines, removeLine, setQuantity } = useCart();

  if (!isHydrated) {
    return <CartLoading />;
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-5 py-16 text-center sm:px-8" id="main-content" tabIndex={-1}>
        <div>
          <span
            aria-hidden="true"
            className="mx-auto grid size-16 place-items-center rounded-full bg-[#ead8c8] text-2xl text-copper"
          >
            C
          </span>
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Your cart is empty
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            Find something worth gathering around.
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-muted">
            Browse the menu, choose any available options, and add a dish when it feels right.
          </p>
          <Link
            className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
            href="/menu"
          >
            Browse the menu
          </Link>
        </div>
      </section>
    );
  }

  const currency = lines[0]?.currency ?? "USD";
  const subtotal = getCartSubtotal({ lines });

  return (
    <main className="page-container py-10 sm:py-14" id="main-content" tabIndex={-1}>
      <div className="flex flex-col gap-4 border-b border-[#3e2920]/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper">
            Your order
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
            Cart
          </h1>
          <p className="mt-3 text-muted" aria-live="polite">
            {itemCount} {itemCount === 1 ? "item" : "items"} across {lines.length}{" "}
            {lines.length === 1 ? "configuration" : "configurations"}
          </p>
        </div>
        <Link
          className="w-fit rounded-md text-sm font-semibold text-ink underline decoration-copper/40 underline-offset-4 transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
          href="/menu"
        >
          ← Continue browsing
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-label="Cart items" className="space-y-4">
          {lines.map((line) => {
            const unitPrice = getConfiguredUnitPrice(line);

            return (
              <article
                className="grid gap-5 rounded-[1.4rem] border border-[#3e2920]/10 bg-[#fffaf2] p-4 shadow-[0_18px_50px_-40px_rgba(45,27,20,0.65)] sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5"
                key={line.id}
              >
                <Link
                  aria-label={`View ${line.name}`}
                  className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
                  href={`/menu/${line.slug}`}
                >
                  <MenuVisual
                    className="aspect-[4/3] w-full rounded-2xl sm:aspect-square"
                    imageUrl={line.imageUrl}
                    name={line.name}
                    sizes="(max-width: 640px) calc(100vw - 4.5rem), 144px"
                    slug={line.slug}
                  />
                </Link>

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-ink">
                        <Link
                          className="rounded-sm transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
                          href={`/menu/${line.slug}`}
                        >
                          {line.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-sm text-muted">
                        {formatMoney(unitPrice, line.currency)} each
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-copper">
                      {formatMoney(getLineTotal(line), line.currency)}
                    </p>
                  </div>

                  {line.selectedOptions.length > 0 ? (
                    <ul className="mt-4 space-y-1 text-sm leading-6 text-muted" aria-label="Selected options">
                      {line.selectedOptions.map((option) => (
                        <li key={`${option.optionGroupId}:${option.optionId}`}>
                          <span className="font-medium text-ink">{option.optionGroupName}:</span>{" "}
                          {option.optionName}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-muted">No additional options</p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#3e2920]/8 pt-4">
                    <div className="inline-flex items-center rounded-full border border-[#3e2920]/15 bg-white p-1">
                      <button
                        aria-label={`Decrease quantity of ${line.name}`}
                        className="grid size-9 place-items-center rounded-full text-lg text-ink transition hover:bg-[#f5e8db] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper disabled:cursor-not-allowed disabled:opacity-35"
                        disabled={line.quantity <= 1}
                        onClick={() => setQuantity(line.id, line.quantity - 1)}
                        type="button"
                      >
                        −
                      </button>
                      <output
                        aria-label={`${line.name} quantity ${line.quantity}`}
                        aria-live="polite"
                        className="min-w-9 text-center text-sm font-semibold text-ink"
                      >
                        {line.quantity}
                      </output>
                      <button
                        aria-label={`Increase quantity of ${line.name}`}
                        className="grid size-9 place-items-center rounded-full text-lg text-ink transition hover:bg-[#f5e8db] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper disabled:cursor-not-allowed disabled:opacity-35"
                        disabled={line.quantity >= MAX_CART_QUANTITY}
                        onClick={() => setQuantity(line.id, line.quantity + 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>

                    <button
                      aria-label={`Remove ${line.name} from cart`}
                      className="rounded-md text-sm font-semibold text-[#9b3e30] underline decoration-[#9b3e30]/35 underline-offset-4 transition hover:text-[#71291f] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
                      onClick={() => removeLine(line.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="rounded-[1.4rem] bg-[#35241d] p-6 text-white shadow-[0_28px_70px_-45px_rgba(45,27,20,0.85)] lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e6ad87]">
            Order summary
          </p>
          <div className="mt-6 flex items-baseline justify-between gap-4 border-b border-white/12 pb-5">
            <span className="text-sm text-white/75">Subtotal</span>
            <span className="text-2xl font-semibold">
              {formatMoney(subtotal, currency)}
            </span>
          </div>
          <p className="mt-5 text-sm leading-6 text-white/65">
            This cart is a convenience estimate. Current items, choices, availability, and prices will be revalidated by the server at checkout.
          </p>
          <Link
            className="mt-6 flex w-full justify-center rounded-full bg-[#f5e8db] px-5 py-3.5 text-sm font-semibold text-ink transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            href="/checkout"
          >
            Proceed to checkout
          </Link>
          <Link
            className="mt-4 flex justify-center rounded-md text-sm font-semibold text-[#f4ceb5] underline decoration-[#f4ceb5]/30 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-white"
            href="/menu"
          >
            Add another dish
          </Link>
        </aside>
      </div>
    </main>
  );
}

function CartLoading() {
  return (
    <main aria-busy="true" className="mx-auto min-h-[70vh] w-full max-w-7xl animate-pulse px-5 py-10 sm:px-8 lg:px-12" id="main-content" tabIndex={-1}>
      <div className="h-4 w-20 rounded-full bg-line" />
      <div className="mt-5 h-12 w-48 rounded-xl bg-line/70" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <div className="h-56 rounded-[1.4rem] bg-line/55" />
          <div className="h-56 rounded-[1.4rem] bg-line/55" />
        </div>
        <div className="h-72 rounded-[1.4rem] bg-line/70" />
      </div>
      <p className="sr-only">Loading your cart</p>
    </main>
  );
}
