import { logoutAction } from "@/features/auth/actions";
import { roleHasPermission } from "@/server/auth/permissions";
import { requireActiveUserForPage } from "@/server/auth/authorization";

export default async function AdminDashboardPage() {
  const user = await requireActiveUserForPage();
  const canManageStaff = roleHasPermission(user.role, "staff:manage");

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-copper">
            Copper Spoon
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-ink">
            Restaurant workspace
          </h1>
          <p className="mt-2 text-muted">
            Signed in as {user.name} · {user.role}
          </p>
        </div>
        <form action={logoutAction}>
          <button
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition hover:border-copper hover:text-copper"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WorkspaceCard
          description="Review incoming orders and move them through preparation."
          label="Orders"
          status="Planned"
        />
        <WorkspaceCard
          description="View the current menu and item availability."
          label="Menu"
          status="Planned"
        />
        {canManageStaff ? (
          <WorkspaceCard
            description="Admin-only staff account management foundation."
            label="Staff"
            status="Admin access"
          />
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
