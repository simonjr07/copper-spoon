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
  return <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-8 lg:px-12"><AdminHeader user={user} /><section className="py-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Catalog operations</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Menu management</h1><p className="mt-2 text-muted">{canWrite ? "Manage what guests can browse and order." : "Read-only catalog access."}</p></div>{canWrite ? <div className="flex gap-2"><Link className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold" href="/admin/menu/categories">Categories</Link><Link className="rounded-xl bg-copper px-4 py-2.5 text-sm font-semibold text-white" href="/admin/menu/items/new">New item</Link></div> : null}</div>
    {categories.length ? <div className="mt-8 space-y-8">{categories.map((category) => <section key={category.id}><div className="mb-3 flex items-center justify-between"><div><h2 className="text-2xl font-semibold">{category.name}</h2><p className="text-sm text-muted">{category._count.menuItems} items · order {category.sortOrder}</p></div><Badge tone={category.isPublished ? "green" : "gray"}>{category.isPublished ? "Published" : "Hidden"}</Badge></div>{category.menuItems.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{category.menuItems.map((item) => <article className="overflow-hidden rounded-2xl border border-line bg-surface" key={item.id}><MenuVisual className="aspect-[16/8]" imageUrl={item.imageUrl} name={item.name} slug={item.slug} /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-sm text-muted">{formatMoney(item.priceCents, item.currency)} · order {item.sortOrder}</p></div>{canWrite ? <Link className="text-sm font-semibold text-copper hover:underline" href={`/admin/menu/items/${item.id}/edit`}>Edit</Link> : null}</div><div className="mt-4 flex flex-wrap gap-2"><Badge tone={item.isPublished ? "green" : "gray"}>{item.isPublished ? "Published" : "Draft"}</Badge><Badge tone={item.isAvailable ? "green" : "amber"}>{item.isAvailable ? "Available" : "Sold out"}</Badge>{item.isArchived ? <Badge tone="red">Archived</Badge> : null}</div></div></article>)}</div> : <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">No items in this category.</p>}</section>)}</div> : <p className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center text-muted">No categories have been created.</p>}
  </section></main>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "gray" }) { const colors = { green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-900", red: "bg-red-100 text-red-800", gray: "bg-stone-200 text-stone-700" }; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>; }

