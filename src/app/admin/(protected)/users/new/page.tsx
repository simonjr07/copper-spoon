import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { StaffProfileForm } from "@/features/staff-management/staff-forms";
import { requirePermission } from "@/server/auth/authorization";

export default async function NewStaffUserPage() { const actor = await requirePermission("staff:manage"); return <main className="admin-container max-w-3xl"><AdminHeader user={actor} /><section className="py-8" id="workspace-content" tabIndex={-1}><Link className="text-sm font-semibold text-copper hover:underline" href="/admin/users">← Staff accounts</Link><p className="eyebrow mt-5">Account access</p><h1 className="mb-7 mt-2 text-4xl font-semibold tracking-[-0.04em]">Create staff account</h1><StaffProfileForm /></section></main>; }

