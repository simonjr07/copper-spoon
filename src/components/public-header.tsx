import Link from "next/link";

import { CartLink } from "@/features/cart/cart-link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#3e2920]/10 bg-[#fffaf2]/92 backdrop-blur-md">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="page-container flex min-h-[4.5rem] items-center justify-between gap-3 py-3">
        <Link
          className="group inline-flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
          href="/"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-[#8d3f26] text-lg text-white shadow-sm transition group-hover:-rotate-6"
          >
            C
          </span>
          <span>
            <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-copper">
              Copper Spoon
            </span>
            <span className="block text-sm font-medium text-ink">
              Demo Kitchen
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-ink transition hover:text-copper"
            href="/track-order"
          >
            Track
          </Link>
          <Link
            className="hidden rounded-full border border-[#3e2920]/15 bg-white/60 px-4 py-2 text-sm font-semibold text-ink transition hover:border-copper hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper sm:inline-flex"
            href="/menu"
          >
            Browse menu
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
