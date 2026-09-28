"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MenuVisual } from "@/components/menu-visual";
import {
  filterPublicMenu,
  type PublicMenu,
} from "@/features/menu/catalog";
import { formatMoney } from "@/lib/money";

export function MenuBrowser({ menu }: { menu: PublicMenu }) {
  const [query, setQuery] = useState("");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const filteredCategories = useMemo(
    () => filterPublicMenu(menu, query, categorySlug),
    [categorySlug, menu, query],
  );
  const resultCount = filteredCategories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  return (
    <>
      <section
        aria-label="Menu filters"
        className="sticky top-[4.5rem] z-20 -mx-5 border-y border-[#3e2920]/10 bg-[#f7f1e8]/95 px-5 py-4 shadow-[0_12px_30px_-28px_rgba(45,27,20,0.75)] backdrop-blur sm:-mx-8 sm:px-8 lg:mx-0 lg:rounded-2xl lg:border lg:px-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 overflow-x-auto pb-1">
            <div className="flex w-max gap-2" role="group" aria-label="Filter by category">
              <FilterButton
                active={categorySlug === null}
                label="All dishes"
                onClick={() => setCategorySlug(null)}
              />
              {menu.categories.map((category) => (
                <FilterButton
                  active={categorySlug === category.slug}
                  key={category.id}
                  label={category.name}
                  onClick={() => setCategorySlug(category.slug)}
                />
              ))}
            </div>
          </div>

          <div className="relative shrink-0 lg:w-80">
            <label className="sr-only" htmlFor="menu-search">
              Search the menu
            </label>
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            >
              ⌕
            </span>
            <input
              className="min-h-11 w-full rounded-full border border-[#3e2920]/15 bg-white py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-muted/75 focus:border-copper focus:ring-2 focus:ring-copper/20"
              id="menu-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes and ingredients"
              type="search"
              value={query}
            />
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {resultCount} {resultCount === 1 ? "item" : "items"} shown
        </p>
      </section>

      {filteredCategories.length > 0 ? (
        <div className="mt-12 space-y-16">
          {filteredCategories.map((category) => (
            <section aria-labelledby={`category-${category.slug}`} key={category.id}>
              <div className="mb-6 flex flex-col gap-2 border-b border-[#3e2920]/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  className="text-3xl font-semibold tracking-[-0.035em] text-ink sm:text-4xl"
                  id={`category-${category.slug}`}
                >
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="max-w-xl text-sm leading-6 text-muted sm:text-right">
                    {category.description}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {category.items.map((item) => (
                  <article
                    className="group overflow-hidden rounded-[1.4rem] border border-[#3e2920]/10 bg-[#fffaf2] shadow-[0_20px_60px_-42px_rgba(45,27,20,0.7)] transition hover:-translate-y-1 hover:shadow-[0_25px_65px_-38px_rgba(45,27,20,0.65)]"
                    key={item.id}
                  >
                    <MenuVisual
                      className="aspect-[16/10] w-full"
                      imageUrl={item.imageUrl}
                      name={item.name}
                      slug={item.slug}
                    />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-xl font-semibold tracking-[-0.025em] text-ink">
                          <Link
                            className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-copper"
                            href={`/menu/${item.slug}`}
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="shrink-0 font-semibold text-copper">
                          {formatMoney(item.priceCents, menu.currency)}
                        </p>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
                        {item.description}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#3e2920]/8 pt-4">
                        <AvailabilityBadge available={item.isAvailable} />
                        <Link
                          className="rounded-md text-sm font-semibold text-ink underline decoration-copper/40 underline-offset-4 transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
                          href={`/menu/${item.slug}`}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="mt-12 rounded-[1.5rem] border border-dashed border-[#3e2920]/25 bg-white/35 px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">
            Nothing matched
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-ink">
            Try another search or category
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-7 text-muted">
            Clear the search field or browse all dishes to see the complete published menu.
          </p>
          <button
            className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
            onClick={() => {
              setQuery("");
              setCategorySlug(null);
            }}
            type="button"
          >
            Reset filters
          </button>
        </section>
      )}
    </>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${
        active
          ? "border-ink bg-ink text-white"
          : "border-[#3e2920]/15 bg-white/60 text-ink hover:border-copper hover:text-copper"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${
        available ? "text-[#526946]" : "text-[#9b3e30]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${available ? "bg-[#6f8a5e]" : "bg-[#b34a3b]"}`}
      />
      {available ? "Available" : "Sold out"}
    </span>
  );
}
