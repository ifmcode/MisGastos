import { describe, expect, it } from "@jest/globals";

import { mapCategoryDocument } from "../category.mapper";

const baseData: Record<string, unknown> = {
  name: "  Restaurantes  ",
  icon: "fast-food-outline",
  color: "#ef6c00",
  type: "expense",
  legacyId: "  food  ",
  ownerId: "owner-from-document",
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T11:00:00.000Z",
};

describe("mapCategoryDocument", () => {
  it("maps and normalizes a valid document", () => {
    expect(
      mapCategoryDocument("category-1", baseData, "fallback-owner"),
    ).toEqual({
      id: "category-1",
      name: "Restaurantes",
      icon: "fast-food-outline",
      color: "#EF6C00",
      type: "expense",
      legacyId: "food",
      ownerId: "owner-from-document",
      createdAt: "2026-10-30T10:00:00.000Z",
      updatedAt: "2026-10-30T11:00:00.000Z",
    });
  });

  it("falls back for unknown icons and invalid colors", () => {
    const category = mapCategoryDocument(
      "category-1",
      { ...baseData, icon: "unknown", color: "orange" },
      "user-1",
    );

    expect(category?.icon).toBe("receipt-outline");
    expect(category?.color).toBe("#0A7EA4");
  });

  it("omits an empty legacy id and falls back to the provided owner", () => {
    const category = mapCategoryDocument(
      "category-1",
      { ...baseData, legacyId: "   ", ownerId: "  " },
      "fallback-owner",
    );

    expect(category?.ownerId).toBe("fallback-owner");
    expect(category && "legacyId" in category).toBe(false);
  });

  it("rejects documents without a name or with an invalid type", () => {
    expect(
      mapCategoryDocument("category-1", { ...baseData, name: "  " }, "user-1"),
    ).toBeNull();
    expect(
      mapCategoryDocument(
        "category-1",
        { ...baseData, type: "transfer" },
        "user-1",
      ),
    ).toBeNull();
  });

  it("supports Date and Firestore Timestamp-like values", () => {
    const category = mapCategoryDocument(
      "category-1",
      {
        ...baseData,
        createdAt: new Date("2026-10-30T09:00:00.000Z"),
        updatedAt: { toDate: () => new Date("2026-10-30T12:00:00.000Z") },
      },
      "user-1",
    );

    expect(category?.createdAt).toBe("2026-10-30T09:00:00.000Z");
    expect(category?.updatedAt).toBe("2026-10-30T12:00:00.000Z");
  });

  it("falls back to the epoch for invalid timestamps", () => {
    const category = mapCategoryDocument(
      "category-1",
      { ...baseData, createdAt: "invalid", updatedAt: 123 },
      "user-1",
    );

    expect(category?.createdAt).toBe(new Date(0).toISOString());
    expect(category?.updatedAt).toBe(new Date(0).toISOString());
  });

  it("maps a valid sortOrder and ignores invalid values", () => {
    expect(
      mapCategoryDocument("category-1", { ...baseData, sortOrder: 3 }, "u")
        ?.sortOrder,
    ).toBe(3);
    expect(
      mapCategoryDocument("category-1", { ...baseData, sortOrder: 2.7 }, "u")
        ?.sortOrder,
    ).toBe(2);

    for (const sortOrder of [-1, "3", Number.NaN, null]) {
      expect(
        mapCategoryDocument("category-1", { ...baseData, sortOrder }, "u"),
      ).not.toHaveProperty("sortOrder");
    }
  });
});
