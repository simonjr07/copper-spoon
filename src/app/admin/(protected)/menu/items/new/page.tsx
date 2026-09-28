import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { MenuItemForm } from "@/features/menu-management/admin-forms";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminCategories } from "@/server/menu/admin-catalog";

export default async function NewItemPage() { const user = await requirePermission("menu:write"); const categories = await getAdminCategories(); return <main className="admin-container max-w-3xl"><AdminHeader user={user} /><section className="py-8" id="workspace-content" tabIndex={-1}><Link className="text-sm font-semibold text-copper hover:underline" href="/admin/menu">← Menu management</Link><p className="eyebrow mt-5">Catalog item</p><h1 className="mb-7 mt-2 text-4xl font-semibold tracking-[-0.04em]">New menu item</h1>{categories.length ? <MenuItemForm categories={categories} /> : <div className="surface-card p-6"><h2 className="text-xl font-semibold">Create a category first</h2><p className="mt-2 text-sm leading-6 text-muted">Every menu item needs a category before it can be saved.</p><Link className="button-primary mt-5" href="/admin/menu/categories/new">Create category</Link></div>}</section></main>; }

