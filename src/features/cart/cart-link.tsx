"use client";

import Link from "next/link";

import { useCart } from "@/features/cart/cart-provider";

export function CartLink() {
  const { itemCount } = useCart();
  const label = `Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  return (
    <Link
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
      href="/cart"
    >
      <span aria-hidden="true">Cart</span>
      <span
        aria-hidden="true"
        className="grid min-w-5 place-items-center rounded-full bg-white/15 px-1.5 text-xs leading-5"
      >
        {itemCount}
      </span>
    </Link>
  );
}
