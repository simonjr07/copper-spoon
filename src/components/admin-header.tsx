import Link from "next/link";

import { AdminNavigation } from "@/components/admin-navigation";
import { logoutAction } from "@/features/auth/actions";

export function AdminHeader({
  user,
}: {
  user: { name: string; role: "ADMIN" | "STAFF" };
}) {
  return (
    <header className="border-b border-line pb-5">
      <a className="skip-link" href="#workspace-content">Skip to workspace content</a>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-3 rounded-lg"
          href="/admin"
        >
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-copper font-semibold text-white">C</span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-copper">Copper Spoon</span>
            <span className="block text-sm font-medium text-ink">Restaurant workspace</span>
          </span>
        </Link>
          <span className="shrink-0 rounded-full bg-[#ead8c8] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#71381f] sm:hidden">{user.role}</span>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="min-w-0 text-sm text-muted">
            <span className="block truncate font-semibold text-ink">{user.name}</span>
            <span className="hidden text-xs uppercase tracking-[0.1em] sm:block">{user.role}</span>
          </p>
          <form action={logoutAction}>
            <button className="button-secondary whitespace-nowrap" type="submit">Sign out</button>
          </form>
        </div>
      </div>
      <div className="mt-4"><AdminNavigation role={user.role} /></div>
    </header>
  );
}
