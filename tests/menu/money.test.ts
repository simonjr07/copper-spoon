import { describe, expect, it } from "vitest";

import { formatMoney, formatPriceAdjustment } from "@/lib/money";

describe("integer-cent money formatting", () => {
  it("formats cents without floating-point arithmetic at call sites", () => {
    expect(formatMoney(1299, "USD")).toBe("$12.99");
    expect(formatMoney(0, "USD")).toBe("$0.00");
  });

  it("formats option adjustments and rejects fractional cents", () => {
    expect(formatPriceAdjustment(0, "USD")).toBe("Included");
    expect(formatPriceAdjustment(125, "USD")).toBe("+$1.25");
    expect(() => formatMoney(12.5, "USD")).toThrow(
      "Money must be represented as integer cents",
    );
  });
});
