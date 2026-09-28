import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import { requirePermission } from "@/server/auth/authorization";
import { listManagedUsers } from "@/server/staff/staff-repository";

export default async function StaffUsersPage() {
  const actor = await requirePermission("staff:manage");
  const users = await listManagedUsers();

  return (
    <main className="admin-container max-w-6xl">
      <AdminHeader user={actor} />
      <section className="py-8" id="workspace-content" tabIndex={-1}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">Admin only</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">Staff accounts</h1><p className="mt-3 text-muted">Manage access without exposing credentials.</p></div>
          <Link className="button-primary w-fit" href="/admin/users/new">New account</Link>
        </div>
        {users.length ? <div className="mt-7 grid gap-3">{users.map((user) => <article className="surface-card grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center" key={user.id}><div className="min-w-0"><h2 className="font-semibold">{user.name}{user.id === actor.id ? <span className="ml-2 text-xs font-medium text-muted">You</span> : null}</h2><p className="mt-1 truncate text-sm text-muted">{user.email}</p></div><div><div className="flex flex-wrap gap-2"><AccountBadge tone={user.role === "ADMIN" ? "copper" : "neutral"}>{user.role === "ADMIN" ? "Admin" : "Staff"}</AccountBadge><AccountBadge tone={user.status === "ACTIVE" ? "green" : "red"}>{user.status === "ACTIVE" ? "Active" : "Disabled"}</AccountBadge></div><p className="mt-2 text-xs text-muted">Created {formatDate(user.createdAt)}</p></div><Link className="text-sm font-semibold text-copper hover:underline" href={`/admin/users/${user.id}/edit`}>Edit account</Link></article>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-line p-10 text-center"><h2 className="text-xl font-semibold">No staff accounts found</h2><p className="mt-2 text-muted">Create an account when another operator needs access.</p></div>}
      </section>
    </main>
  );
}

function AccountBadge({ children, tone }: { children: React.ReactNode; tone: "copper" | "neutral" | "green" | "red" }) {
  const tones = { copper: "bg-[#ead8c8] text-[#71381f]", neutral: "bg-stone-100 text-stone-700", green: "bg-green-50 text-green-800", red: "bg-red-50 text-red-800" };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.06em] ${tones[tone]}`}>{children}</span>;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
