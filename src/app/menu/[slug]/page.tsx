import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuVisual } from "@/components/menu-visual";
import { PublicHeader } from "@/components/public-header";
import { AvailabilityBadge } from "@/features/menu/menu-browser";
import { formatMoney, formatPriceAdjustment } from "@/lib/money";
import { getPublicMenuItem } from "@/server/menu/public-catalog";

export const dynamic = "force-dynamic";

type MenuItemPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MenuItemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublicMenuItem(slug);

  if (!item) {
    notFound();
  }

  return {
    title: `${item.name} | Copper Spoon`,
    description: item.description,
  };
}

export default async function MenuItemPage({ params }: MenuItemPageProps) {
  const { slug } = await params;
  const item = await getPublicMenuItem(slug);

  if (!item) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <Link
          className="inline-flex rounded-md text-sm font-semibold text-muted underline decoration-copper/40 underline-offset-4 transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
          href="/menu"
        >
          ← Back to the menu
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(22rem,0.96fr)] lg:gap-16">
          <MenuVisual
            className="aspect-[4/3] w-full rounded-[2rem] shadow-[0_30px_80px_-45px_rgba(45,27,20,0.8)] lg:sticky lg:top-8"
            imageUrl={item.imageUrl}
            name={item.name}
            sizes="(max-width: 1024px) calc(100vw - 2.5rem), 52vw"
            slug={item.slug}
          />

          <article className="py-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="rounded-full bg-[#ead8c8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#71381f] transition hover:bg-[#dfc1aa] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-copper"
                href="/menu"
              >
                {item.category.name}
              </Link>
              <AvailabilityBadge available={item.isAvailable} />
            </div>

            <h1 className="mt-6 text-5xl font-semibold leading-[1] tracking-[-0.055em] text-ink sm:text-6xl">
              {item.name}
            </h1>
            <p className="mt-5 text-2xl font-semibold text-copper">
              {formatMoney(item.priceCents, item.currency)}
            </p>
            <p className="mt-6 text-lg leading-8 text-muted">{item.description}</p>

            {!item.isAvailable ? (
              <aside className="mt-8 rounded-2xl border border-[#b34a3b]/25 bg-[#fff0ec] p-5" aria-label="Sold out notice">
                <p className="font-semibold text-[#803126]">Currently sold out</p>
                <p className="mt-1 text-sm leading-6 text-[#76564f]">
                  This published dish remains visible for menu planning, but it is not available to order.
                </p>
              </aside>
            ) : null}

            {item.optionGroups.length > 0 ? (
              <section className="mt-10 border-t border-[#3e2920]/10 pt-8" aria-labelledby="choices-heading">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper">
                  Served your way
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-ink" id="choices-heading">
                  Available choices
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Choices are informational for now. Selection and cart controls arrive in the next step.
                </p>

                <div className="mt-6 space-y-5">
                  {item.optionGroups.map((group) => (
                    <section className="rounded-2xl border border-[#3e2920]/10 bg-[#fffaf2] p-5" key={group.id}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-ink">{group.name}</h3>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                          {getSelectionLabel(group)}
                        </p>
                      </div>
                      <ul className="mt-4 divide-y divide-[#3e2920]/8">
                        {group.options.map((option) => (
                          <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0" key={option.id}>
                            <span className="flex items-center gap-3 text-sm text-ink">
                              <span aria-hidden="true" className="size-2 rounded-full bg-[#c7835d]" />
                              {option.name}
                            </span>
                            <span className="text-sm font-semibold text-muted">
                              {formatPriceAdjustment(option.priceAdjustmentCents, item.currency)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </section>
            ) : (
              <p className="mt-10 border-t border-[#3e2920]/10 pt-8 text-sm text-muted">
                This dish has no additional choices.
              </p>
            )}

            <div className="mt-10 rounded-2xl bg-[#35241d] p-5 text-white">
              <p className="font-semibold">
                {item.isAvailable ? "Ready for a future order" : "Unavailable today"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[#e6d9ce]">
                Cart and checkout are intentionally not enabled in this menu-browsing release.
              </p>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}

function getSelectionLabel(group: {
  selectionType: "SINGLE" | "MULTIPLE";
  minSelections: number;
  maxSelections: number;
}) {
  if (group.minSelections === 0) {
    return group.maxSelections === 1
      ? "Optional · choose up to 1"
      : `Optional · choose up to ${group.maxSelections}`;
  }

  if (group.selectionType === "SINGLE") {
    return "Choose 1";
  }

  return `Choose ${group.minSelections}–${group.maxSelections}`;
}
