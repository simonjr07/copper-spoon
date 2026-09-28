import Link from "next/link";

import { PublicHeader } from "@/components/public-header";

export default function MenuItemNotFound() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto grid min-h-[70vh] w-full max-w-3xl place-items-center px-5 py-16 text-center sm:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">
            Not on today&apos;s menu
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">
            We couldn&apos;t find that dish.
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-muted">
            It may be unpublished, archived, or the address may be incorrect. Browse the current menu for available and sold-out dishes.
          </p>
          <Link
            className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
            href="/menu"
          >
            Return to the menu
          </Link>
        </div>
      </main>
    </>
  );
}
