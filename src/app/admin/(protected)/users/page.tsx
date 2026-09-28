import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { requirePermission } from "@/server/auth/authorization";
import { listManagedUsers } from "@/server/staff/staff-repository";

export default async function StaffUsersPage() { const actor = await requirePermission("staff:manage"); const users = await listManagedUsers(); return <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-8 lg:px-12"><AdminHeader user={actor} /><section className="py-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-copper">Admin only</p><h1 className="mt-2 text-4xl font-semibold">Staff accounts</h1></div><Link className="rounded-xl bg-copper px-4 py-2.5 font-semibold text-white" href="/admin/users/new">New account</Link></div><div className="mt-7 grid gap-3">{users.map((user) => <article className="grid gap-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-[1fr_auto_auto] sm:items-center" key={user.id}><div><h2 className="font-semibold">{user.name}{user.id === actor.id ? " (you)" : ""}</h2><p className="text-sm text-muted">{user.email}</p></div><div className="text-sm"><p className="font-semibold">{user.role} · {user.status}</p><p className="text-muted">Created {formatDate(user.createdAt)}</p></div><Link className="font-semibold text-copper" href={`/admin/users/${user.id}/edit`}>Edit</Link></article>)}</div></section></main>; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date); }

