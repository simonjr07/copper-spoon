import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { MenuItemForm } from "@/features/menu-management/admin-forms";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminCategories } from "@/server/menu/admin-catalog";

export default async function NewItemPage() { const user = await requirePermission("menu:write"); const categories = await getAdminCategories(); return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-8"><AdminHeader user={user} /><section className="py-8"><Link className="text-sm font-semibold text-copper" href="/admin/menu">← Menu</Link><h1 className="mb-7 mt-3 text-4xl font-semibold">New menu item</h1>{categories.length ? <MenuItemForm categories={categories} /> : <p className="rounded-2xl border border-line bg-surface p-6">Create a category before adding menu items. <Link className="font-semibold text-copper" href="/admin/menu/categories/new">Create category</Link></p>}</section></main>; }

