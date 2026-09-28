import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin-header";
import { StaffPasswordResetForm, StaffProfileForm, StaffStatusForm } from "@/features/staff-management/staff-forms";
import { requirePermission } from "@/server/auth/authorization";
import { getManagedUser } from "@/server/staff/staff-repository";

export default async function EditStaffUserPage({ params }: { params: Promise<{ id: string }> }) { const actor = await requirePermission("staff:manage"); const { id } = await params; const user = await getManagedUser(id); if (!user) notFound(); const isSelf = actor.id === user.id; return <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:px-8"><AdminHeader user={actor} /><section className="py-8"><Link className="text-sm font-semibold text-copper" href="/admin/users">← Staff accounts</Link><h1 className="mt-3 text-4xl font-semibold">Edit {user.name}</h1><p className="mb-7 mt-2 text-muted">{user.role} · {user.status} · Created {formatDate(user.createdAt)}{user.lastLoginAt ? ` · Last login ${formatDate(user.lastLoginAt)}` : " · Never signed in"}</p><div className="space-y-5"><StaffProfileForm isSelf={isSelf} user={user} /><StaffStatusForm id={user.id} isSelf={isSelf} status={user.status} /><StaffPasswordResetForm id={user.id} isSelf={isSelf} /></div></section></main>; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date); }

