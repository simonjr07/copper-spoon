import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import { requirePermission } from "@/server/auth/authorization";
import { roleHasPermission } from "@/server/auth/permissions";
import { getAdminCategories } from "@/server/menu/admin-catalog";

export default async function CategoriesPage() {
  const user = await requirePermission("menu:read");
  const categories = await getAdminCategories();
  const canWrite = roleHasPermission(user.role, "categories:write");

  return (
    <main className="admin-container max-w-5xl">
      <AdminHeader user={user} />
      <section className="py-8" id="workspace-content" tabIndex={-1}>
        <Link className="text-sm font-semibold text-copper hover:underline" href="/admin/menu">← Menu management</Link>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">Catalog structure</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Categories</h1></div>
          {canWrite ? <Link className="button-primary w-fit" href="/admin/menu/categories/new">New category</Link> : null}
        </div>
        {categories.length ? <div className="mt-7 grid gap-3">{categories.map((category) => <article className="surface-card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={category.id}><div className="min-w-0"><h2 className="font-semibold">{category.name}</h2><p className="mt-1 truncate text-sm text-muted">/{category.slug} · {category._count.menuItems} items</p></div><span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.06em] ${category.isPublished ? "bg-green-50 text-green-800" : "bg-stone-100 text-stone-700"}`}>{category.isPublished ? "Published" : "Unpublished"}</span>{canWrite ? <Link className="text-sm font-semibold text-copper hover:underline" href={`/admin/menu/categories/${category.id}/edit`}>Edit</Link> : null}</article>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-line p-10 text-center"><h2 className="text-xl font-semibold">No categories yet</h2><p className="mt-2 text-muted">Create a category to organize the menu.</p></div>}
      </section>
    </main>
  );
}
