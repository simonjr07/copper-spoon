import type { Metadata } from "next";
import Image from "next/image";

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
      <main id="main-content" tabIndex={-1}>
        <section className="overflow-hidden bg-[#35241d] text-white">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-5 py-10 sm:px-8 sm:py-12 md:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)] md:gap-10 lg:px-12 lg:py-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e6ad87]">
                The public menu
              </p>
              <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Familiar food, thoughtfully finished.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#e6d9ce] sm:text-lg sm:leading-8">
                A fictional seasonal menu from {menu.restaurantName}, built around warm flavors, crisp produce, and easy choices.
              </p>
              <a
                className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#d77a50] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_-20px_rgba(0,0,0,0.75)] transition hover:bg-[#e18b63] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3c4a8]"
                href="#menu-catalog"
              >
                Browse menu
              </a>
            </div>
            <div className="relative aspect-[4/3] min-w-0 overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#5a3c2d] shadow-[0_28px_65px_-32px_rgba(0,0,0,0.85)]">
              <Image
                alt="Copper Spoon burger with herb fries and sauce on a warm ceramic plate"
                className="object-cover"
                fill
                preload
                sizes="(max-width: 767px) calc(100vw - 2.5rem), (max-width: 1279px) 42vw, 32rem"
                src="/images/menu/copper-spoon-burger.webp"
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
              />
            </div>
          </div>
        </section>

        <div
          className="mx-auto w-full max-w-7xl scroll-mt-28 px-5 py-10 sm:px-8 sm:py-14 lg:px-12"
          id="menu-catalog"
        >
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
        Copper Spoon is a fictional restaurant experience. Orders and payments are demonstrations only.
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
