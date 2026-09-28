import Link from "next/link";

import { logoutAction } from "@/features/auth/actions";

export function AdminHeader({
  user,
}: {
  user: { name: string; role: "ADMIN" | "STAFF" };
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          className="text-sm font-semibold uppercase tracking-[0.24em] text-copper"
          href="/admin"
        >
          Copper Spoon
        </Link>
        <nav aria-label="Restaurant workspace" className="mt-3 flex gap-4 text-sm">
          <Link className="font-medium text-ink hover:text-copper" href="/admin">
            Dashboard
          </Link>
          <Link className="font-medium text-ink hover:text-copper" href="/admin/orders">
            Orders
          </Link>
          <Link className="font-medium text-ink hover:text-copper" href="/admin/menu">
            Menu
          </Link>
        </nav>
        <p className="mt-3 text-sm text-muted">
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
  );
}
