import { describe, expect, it } from "@jest/globals";

import { Category } from "../../types/category.types";
import {
  compareCategories,
  getNextSortOrder,
  moveCategory,
  renumberCategories,
} from "../category-order";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "category-1",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    ...overrides,
  };
}

describe("compareCategories", () => {
  it("sorts by explicit sortOrder ascending", () => {
    const categories = [
      buildCategory({ id: "third", sortOrder: 2 }),
      buildCategory({ id: "first", sortOrder: 0 }),
      buildCategory({ id: "second", sortOrder: 1 }),
    ];

    expect(
      categories.sort(compareCategories).map((category) => category.id),
    ).toEqual(["first", "second", "third"]);
  });

  it("keeps the legacy createdAt/name order when no sortOrder exists", () => {
    const categories = [
      buildCategory({
        id: "newer",
        name: "Alquiler",
        createdAt: "2026-10-30T11:00:00.000Z",
      }),
      buildCategory({
        id: "older-b",
        name: "Bares",
        createdAt: "2026-10-30T09:00:00.000Z",
      }),
      buildCategory({
        id: "older-a",
        name: "Cafés",
        createdAt: "2026-10-30T09:00:00.000Z",
      }),
    ];

    expect(
      categories.sort(compareCategories).map((category) => category.id),
    ).toEqual(["older-b", "older-a", "newer"]);
  });

  it("places explicit positions before legacy categories", () => {
    const legacy = buildCategory({ id: "legacy" });
    const explicit = buildCategory({ id: "explicit", sortOrder: 5 });

    expect([legacy, explicit].sort(compareCategories)[0]?.id).toBe("explicit");
    expect([explicit, legacy].sort(compareCategories)[0]?.id).toBe("explicit");
  });

  it("falls back to legacy order when two positions are equal", () => {
    const first = buildCategory({
      id: "first",
      sortOrder: 0,
      createdAt: "2026-10-30T09:00:00.000Z",
    });
    const second = buildCategory({
      id: "second",
      sortOrder: 0,
      createdAt: "2026-10-30T10:00:00.000Z",
    });

    expect([second, first].sort(compareCategories)[0]?.id).toBe("first");
  });
});

describe("getNextSortOrder", () => {
  it("starts at zero for an empty collection", () => {
    expect(getNextSortOrder([])).toBe(0);
  });

  it("appends after the highest explicit position", () => {
    const categories = [
      buildCategory({ id: "a", sortOrder: 0 }),
      buildCategory({ id: "b", sortOrder: 7 }),
    ];

    expect(getNextSortOrder(categories)).toBe(8);
  });

  it("appends after legacy categories using their position", () => {
    const categories = [buildCategory({ id: "a" }), buildCategory({ id: "b" })];

    expect(getNextSortOrder(categories)).toBe(2);
  });
});

describe("renumberCategories", () => {
  it("assigns array positions and reports only changed documents", () => {
    const categories = [
      buildCategory({ id: "a", sortOrder: 1 }),
      buildCategory({ id: "b" }),
      buildCategory({ id: "c", sortOrder: 2 }),
    ];

    const result = renumberCategories(categories);

    expect(result.categories.map((category) => category.sortOrder)).toEqual([
      0, 1, 2,
    ]);
    expect(result.changed).toEqual([
      { id: "a", sortOrder: 0 },
      { id: "b", sortOrder: 1 },
    ]);
    expect(categories[0]?.sortOrder).toBe(1);
  });
});

describe("moveCategory", () => {
  const categories = [
    buildCategory({ id: "a", sortOrder: 0 }),
    buildCategory({ id: "b", sortOrder: 1 }),
    buildCategory({ id: "c", sortOrder: 2 }),
  ];

  it("swaps with the previous and next neighbour", () => {
    const up = moveCategory(categories, "b", "up", ["a", "b", "c"]);
    const down = moveCategory(categories, "b", "down", ["a", "b", "c"]);

    expect(up?.categories.map((category) => category.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
    expect(down?.categories.map((category) => category.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("returns null at the edges", () => {
    expect(moveCategory(categories, "a", "up", ["a", "b", "c"])).toBeNull();
    expect(moveCategory(categories, "c", "down", ["a", "b", "c"])).toBeNull();
  });

  it("moves past the next category of the filtered type only", () => {
    const filtered = [
      buildCategory({ id: "expense-a", sortOrder: 0 }),
      buildCategory({ id: "income-a", sortOrder: 1, type: "income" }),
      buildCategory({ id: "expense-b", sortOrder: 2 }),
    ];

    const result = moveCategory(filtered, "expense-a", "down", [
      "expense-a",
      "expense-b",
    ]);

    expect(result?.categories.map((category) => category.id)).toEqual([
      "expense-b",
      "income-a",
      "expense-a",
    ]);
  });

  it("ignores unknown categories", () => {
    expect(
      moveCategory(categories, "missing", "up", ["a", "b", "c"]),
    ).toBeNull();
  });
});
