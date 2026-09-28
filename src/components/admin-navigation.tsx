"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminRole = "ADMIN" | "STAFF";

export function getAdminNavigation(role: AdminRole) {
  return [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/orders", label: "Orders", exact: false },
    { href: "/admin/menu", label: "Menu", exact: false },
    ...(role === "ADMIN"
      ? [{ href: "/admin/users", label: "Staff", exact: false }]
      : []),
  ];
}

export function AdminNavigation({ role }: { role: AdminRole }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Restaurant workspace" className="-mx-2 overflow-x-auto px-2">
      <div className="flex min-w-max gap-1">
        {getAdminNavigation(role).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-xl px-3.5 text-sm font-semibold transition ${
                active
                  ? "bg-ink text-white shadow-sm"
                  : "text-muted hover:bg-surface hover:text-copper"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
