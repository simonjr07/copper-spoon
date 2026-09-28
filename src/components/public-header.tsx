import Link from "next/link";

import { CartLink } from "@/features/cart/cart-link";

export function PublicHeader() {
  return (
    <header className="border-b border-[#3e2920]/10 bg-[#fffaf2]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
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

        <nav aria-label="Primary navigation" className="flex items-center gap-2">
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
