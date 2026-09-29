import { describe, expect, it, vi } from "vitest";

import {
  bootstrapProductionDemoCatalog,
  productionDemoCatalogSummary,
} from "@/server/menu/demo-catalog-bootstrap";

describe("production demo catalog bootstrap", () => {
  it("uses create-only upserts and is safe to invoke twice", async () => {
    const categoryUpsert = vi.fn(async (args) => ({
      id: `category-${args.where.slug}`,
    }));
    const menuItemUpsert = vi.fn(async (args) => ({
      id: `item-${args.where.slug}`,
    }));
    const optionGroupUpsert = vi.fn(async (args) => ({
      id: `group-${args.where.menuItemId_name.menuItemId}-${args.where.menuItemId_name.name}`,
    }));
    const optionUpsert = vi.fn(async (args) => ({
      id: `option-${args.where.optionGroupId_name.optionGroupId}-${args.where.optionGroupId_name.name}`,
    }));
    const database = {
      category: { upsert: categoryUpsert },
      menuItem: { upsert: menuItemUpsert },
      menuItemOptionGroup: { upsert: optionGroupUpsert },
      menuItemOption: { upsert: optionUpsert },
    };

    await bootstrapProductionDemoCatalog(database as never);
    const secondResult = await bootstrapProductionDemoCatalog(database as never);

    expect(secondResult).toEqual({
      categoryCount: 5,
      menuItemCount: 7,
      optionGroupCount: 3,
      optionCount: 6,
    });
    expect(secondResult).toEqual(productionDemoCatalogSummary);
    expect(categoryUpsert).toHaveBeenCalledTimes(10);
    expect(menuItemUpsert).toHaveBeenCalledTimes(14);
    expect(optionGroupUpsert).toHaveBeenCalledTimes(6);
    expect(optionUpsert).toHaveBeenCalledTimes(12);

    for (const upsert of [
      categoryUpsert,
      menuItemUpsert,
      optionGroupUpsert,
      optionUpsert,
    ]) {
      for (const [args] of upsert.mock.calls) {
        expect(args.update).toEqual({});
      }
    }
  });
});
