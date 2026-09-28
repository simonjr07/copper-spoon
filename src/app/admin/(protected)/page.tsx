import Link from "next/link";

import { AdminHeader } from "@/components/admin-header";
import { roleHasPermission } from "@/server/auth/permissions";
import { requireActiveUserForPage } from "@/server/auth/authorization";

export default async function AdminDashboardPage() {
  const user = await requireActiveUserForPage();
  const canManageStaff = roleHasPermission(user.role, "staff:manage");

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      <AdminHeader user={user} />
      <header className="pt-8">
        <div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink">
            Restaurant workspace
          </h1>
        </div>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/orders">
          <WorkspaceCard
            description="Review incoming orders and move them through preparation."
            label="Orders"
            status="Active"
          />
        </Link>
        <Link href="/admin/menu">
          <WorkspaceCard
            description="View the catalog and manage publication and availability."
            label="Menu"
            status="Active"
          />
        </Link>
        {canManageStaff ? (
          <Link href="/admin/users">
            <WorkspaceCard
              description="Create, edit, disable, and reactivate staff accounts."
              label="Staff"
              status="Admin access"
            />
          </Link>
        ) : null}
      </section>
    </main>
  );
}

function WorkspaceCard({
  label,
  description,
  status,
}: {
  label: string;
  description: string;
  status: string;
}) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-6">
      <p className="text-sm font-medium text-copper">{status}</p>
      <h2 className="mt-6 text-xl font-semibold text-ink">{label}</h2>
      <p className="mt-2 leading-7 text-muted">{description}</p>
    </article>
  );
}
