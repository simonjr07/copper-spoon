import type { Metadata } from "next";

import { PublicHeader } from "@/components/public-header";
import { MenuBrowser } from "@/features/menu/menu-browser";
import { getPublicMenu } from "@/server/menu/public-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Menu | Copper Spoon",
  description:
    "Browse the fictional Copper Spoon menu, including seasonal mains, sides, drinks, and desserts.",
};

export default async function MenuPage() {
  const menu = await getPublicMenu();
  const itemCount = menu.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );

  return (
    <>
      <PublicHeader />
      <main>
        <section className="overflow-hidden bg-[#35241d] text-white">
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_18rem] lg:px-12 lg:py-24">
            <div className="relative z-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e6ad87]">
                The public menu
              </p>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
                Familiar food, thoughtfully finished.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#e6d9ce] sm:text-lg">
                A fictional seasonal menu from {menu.restaurantName}, built around warm flavors, crisp produce, and easy choices.
              </p>
            </div>
            <div className="relative hidden items-end justify-end lg:flex" aria-hidden="true">
              <div className="relative size-64 rounded-full border border-white/15 bg-[#b85d38] shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
                <span className="absolute inset-8 rounded-full border border-white/25" />
                <span className="absolute inset-[4.5rem] rounded-full bg-[#f2c27f]" />
                <span className="absolute left-2 top-5 h-52 w-10 -rotate-12 rounded-full border border-white/15" />
              </div>
            </div>
            <span
              aria-hidden="true"
              className="absolute -bottom-28 -left-20 size-72 rounded-full border border-white/8"
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          {menu.categories.length === 0 ? (
            <CatalogEmptyState
              description="Published categories will appear here as soon as the kitchen releases them."
              title="The menu is being prepared"
            />
          ) : itemCount === 0 ? (
            <CatalogEmptyState
              description="The categories are ready, but no dishes are currently published. Please check back soon."
              title="No dishes are published yet"
            />
          ) : (
            <MenuBrowser menu={menu} />
          )}
        </div>
      </main>
      <footer className="mt-auto border-t border-[#3e2920]/10 px-5 py-8 text-center text-sm text-muted">
        Copper Spoon is a fictional restaurant experience. No real orders are placed yet.
      </footer>
    </>
  );
}

function CatalogEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-dashed border-[#3e2920]/25 bg-white/35 px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">
        Please check back
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-lg leading-7 text-muted">{description}</p>
    </section>
  );
}
