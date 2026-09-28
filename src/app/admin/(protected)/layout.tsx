import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requireActiveUserForPage } from "@/server/auth/authorization";

export const metadata: Metadata = {
  title: { default: "Restaurant workspace | Copper Spoon", template: "%s | Copper Spoon" },
  robots: { index: false, follow: false },
};

export default async function AdminWorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireActiveUserForPage();

  return children;
}
