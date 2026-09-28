import type { ReactNode } from "react";

import { requireActiveUserForPage } from "@/server/auth/authorization";

export default async function AdminWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireActiveUserForPage();

  return children;
}
