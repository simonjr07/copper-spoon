import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { StaffProfileForm } from "@/features/staff-management/staff-forms";
import { requirePermission } from "@/server/auth/authorization";

export default async function NewStaffUserPage() { const actor = await requirePermission("staff:manage"); return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-8"><AdminHeader user={actor} /><section className="py-8"><Link className="text-sm font-semibold text-copper" href="/admin/users">← Staff accounts</Link><h1 className="mb-7 mt-3 text-4xl font-semibold">Create staff account</h1><StaffProfileForm /></section></main>; }

