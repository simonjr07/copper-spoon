import { describe, expect, it } from "vitest";

import { getAdminNavigation } from "@/components/admin-navigation";

describe("admin navigation", () => {
  it("shows all operational sections to admins", () => {
    expect(getAdminNavigation("ADMIN").map((item) => item.label)).toEqual([
      "Dashboard",
      "Orders",
      "Menu",
      "Staff",
    ]);
  });

  it("keeps staff management out of staff navigation", () => {
    expect(getAdminNavigation("STAFF").map((item) => item.label)).toEqual([
      "Dashboard",
      "Orders",
      "Menu",
    ]);
  });
});
