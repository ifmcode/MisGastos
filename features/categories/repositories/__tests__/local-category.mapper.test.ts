import { describe, expect, it } from "@jest/globals";

import type { LocalRow } from "@/shared/lib/local-db/local-db.types";

import {
  fromCategoryLocalRow,
  toCategoryLocalRow,
} from "../local-category.mapper";
import { buildCategory } from "./local-category.fixtures";

describe("local category mapper", () => {
  it("round-trips a category through its storage row", () => {
    const category = buildCategory();

    expect(fromCategoryLocalRow(toCategoryLocalRow(category))).toEqual(
      category,
    );
  });

  it("keeps the optional order and legacy id", () => {
    const row = toCategoryLocalRow(buildCategory());

    expect(row.sortOrder).toBe(2);
    expect(row.legacyId).toBe("legacy-1");
    expect(row.syncStatus).toBe("synced");
  });

  it("reads a legacy category's missing order back as undefined", () => {
    const row = toCategoryLocalRow(
      buildCategory({ sortOrder: undefined, legacyId: undefined }),
    );

    expect(row.sortOrder).toBeNull();
    expect(row.legacyId).toBeNull();

    const category = fromCategoryLocalRow(row);
    expect(category?.sortOrder).toBeUndefined();
    expect(category?.legacyId).toBeUndefined();
  });

  it("falls back to the epoch for malformed audit dates", () => {
    const row = toCategoryLocalRow(
      buildCategory({ createdAt: "not-a-date", updatedAt: "not-a-date" }),
    );

    expect(row.createdAt).toBe(new Date(0).toISOString());
    expect(row.updatedAt).toBe(new Date(0).toISOString());
  });

  it("drops a row the category document mapper rejects", () => {
    const row = toCategoryLocalRow(buildCategory());

    expect(fromCategoryLocalRow({ ...row, type: "other" })).toBeNull();
    expect(fromCategoryLocalRow({ ...row, name: "   " })).toBeNull();
  });

  it("drops a row without an addressable id", () => {
    const row: LocalRow = { ...toCategoryLocalRow(buildCategory()), id: null };

    expect(fromCategoryLocalRow(row)).toBeNull();
  });
});
