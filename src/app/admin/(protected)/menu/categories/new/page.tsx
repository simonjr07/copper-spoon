import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { CategoryForm } from "@/features/menu-management/admin-forms";
import { requirePermission } from "@/server/auth/authorization";

export default async function NewCategoryPage() { const user = await requirePermission("categories:write"); return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-8"><AdminHeader user={user} /><section className="py-8"><Link className="text-sm font-semibold text-copper" href="/admin/menu/categories">← Categories</Link><h1 className="mb-7 mt-3 text-4xl font-semibold">New category</h1><CategoryForm /></section></main>; }

