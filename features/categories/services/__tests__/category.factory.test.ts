import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-category.repository", () => ({
  FirebaseCategoryRepository: jest.fn(() => ({ kind: "category-repository" })),
}));

import { getCategoryService } from "../category.factory";

describe("getCategoryService", () => {
  it("reuses one CategoryService instance", () => {
    const service = getCategoryService();

    expect(getCategoryService()).toBe(service);
  });
});
