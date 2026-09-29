import { describe, expect, it } from "vitest";

import { privateRouteRobots } from "@/lib/seo";

describe("private route indexing policy", () => {
  it("prevents indexing and link following", () => {
    expect(privateRouteRobots).toEqual({ index: false, follow: false });
  });
});
