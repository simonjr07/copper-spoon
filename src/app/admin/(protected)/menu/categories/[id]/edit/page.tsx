import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { CategoryForm } from "@/features/menu-management/admin-forms";
import { requirePermission } from "@/server/auth/authorization";
import { getAdminCategory } from "@/server/menu/admin-catalog";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) { const user = await requirePermission("categories:write"); const { id } = await params; const category = await getAdminCategory(id); if (!category) notFound(); return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-8"><AdminHeader user={user} /><section className="py-8"><Link className="text-sm font-semibold text-copper" href="/admin/menu/categories">← Categories</Link><h1 className="mt-3 text-4xl font-semibold">Edit {category.name}</h1><p className="mb-7 mt-2 text-muted">{category._count.menuItems} linked items. Unpublish instead of deleting this category.</p><CategoryForm category={category} /></section></main>; }

