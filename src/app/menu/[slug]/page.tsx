import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuVisual } from "@/components/menu-visual";
import { PublicHeader } from "@/components/public-header";
import { ItemConfigurator } from "@/features/cart/item-configurator";
import { AvailabilityBadge } from "@/features/menu/menu-browser";
import { formatMoney } from "@/lib/money";
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
      <main className="page-container py-8 sm:py-12 lg:py-16" id="main-content" tabIndex={-1}>
        <Link
          className="inline-flex rounded-md text-sm font-semibold text-muted underline decoration-copper/40 underline-offset-4 transition hover:text-copper focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-copper"
          href="/menu"
        >
          ← Back to the menu
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(22rem,0.96fr)] lg:gap-16">
          <MenuVisual
            className="aspect-[4/3] w-full rounded-[2rem] shadow-[0_30px_80px_-45px_rgba(45,27,20,0.8)] lg:sticky lg:top-24"
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

            <ItemConfigurator item={item} />
          </article>
        </div>
      </main>
    </>
  );
}
