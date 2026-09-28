import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import { MenuVisual } from "@/components/menu-visual";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/server/auth/authorization";
import { roleHasPermission } from "@/server/auth/permissions";
import { getAdminCatalog } from "@/server/menu/admin-catalog";

export default async function AdminMenuPage() {
  const user = await requirePermission("menu:read");
  const categories = await getAdminCatalog();
  const canWrite = roleHasPermission(user.role, "menu:write");

  return (
    <main className="admin-container">
      <AdminHeader user={user} />
      <section className="py-8" id="workspace-content" tabIndex={-1}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Catalog operations</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Menu management</h1>
            <p className="mt-3 text-muted">{canWrite ? "Manage what guests can browse and order." : "Read-only catalog access."}</p>
          </div>
          {canWrite ? <div className="flex flex-wrap gap-2"><Link className="button-secondary" href="/admin/menu/categories">Categories</Link><Link className="button-primary" href="/admin/menu/items/new">New item</Link></div> : null}
        </div>

        {categories.length ? (
          <div className="mt-9 space-y-10">
            {categories.map((category) => (
              <section aria-labelledby={`category-${category.id}`} key={category.id}>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
                  <div><h2 className="text-2xl font-semibold" id={`category-${category.id}`}>{category.name}</h2><p className="mt-1 text-sm text-muted">{category._count.menuItems} items · display order {category.sortOrder}</p></div>
                  <StateBadge tone={category.isPublished ? "green" : "gray"}>{category.isPublished ? "Published" : "Unpublished"}</StateBadge>
                </div>
                {category.menuItems.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {category.menuItems.map((item) => (
                      <article className="surface-card group overflow-hidden" key={item.id}>
                        <MenuVisual className="aspect-[16/9]" imageUrl={item.imageUrl} name={item.name} slug={item.slug} />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0"><h3 className="truncate font-semibold">{item.name}</h3><p className="mt-1 text-sm text-muted">{formatMoney(item.priceCents, item.currency)} · order {item.sortOrder}</p></div>
                            {canWrite ? <Link className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-copper hover:bg-background" href={`/admin/menu/items/${item.id}/edit`}>Edit</Link> : null}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <StateBadge tone={item.isPublished ? "green" : "gray"}>{item.isPublished ? "Published" : "Draft"}</StateBadge>
                            <StateBadge tone={item.isAvailable ? "green" : "amber"}>{item.isAvailable ? "Available" : "Sold out"}</StateBadge>
                            {item.isArchived ? <StateBadge tone="red">Archived</StateBadge> : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <EmptyCatalog message="No items are assigned to this category yet." />}
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center sm:p-12"><p className="eyebrow">Start the catalog</p><h2 className="mt-2 text-2xl font-semibold">No categories yet</h2><p className="mx-auto mt-3 max-w-md text-muted">Create a category before adding menu items.</p>{canWrite ? <Link className="button-primary mt-6" href="/admin/menu/categories/new">Create first category</Link> : null}</div>
        )}
      </section>
    </main>
  );
}

function StateBadge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "gray" }) {
  const colors = { green: "border-green-200 bg-green-50 text-green-800", amber: "border-amber-200 bg-amber-50 text-amber-900", red: "border-red-200 bg-red-50 text-red-800", gray: "border-stone-200 bg-stone-100 text-stone-700" };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.06em] ${colors[tone]}`}>{children}</span>;
}

function EmptyCatalog({ message }: { message: string }) {
  return <p className="rounded-2xl border border-dashed border-line bg-surface/40 p-8 text-center text-sm text-muted">{message}</p>;
}
