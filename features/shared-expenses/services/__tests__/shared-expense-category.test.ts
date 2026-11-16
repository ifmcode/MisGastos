import { describe, expect, it } from "@jest/globals";

import type { Category } from "@/features/categories/types/category.types";

import {
  SHARED_EXPENSE_CATEGORY,
  ensureSharedExpenseCategory,
  getSharedExpenseCategoryId,
} from "../shared-expense-category";
import { FakeSharedExpenseCategoryRepository } from "./shared-expenses-service.fakes";

function buildCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: getSharedExpenseCategoryId("user-a"),
    ownerId: "user-a",
    name: SHARED_EXPENSE_CATEGORY.name,
    icon: SHARED_EXPENSE_CATEGORY.icon,
    color: SHARED_EXPENSE_CATEGORY.color,
    type: "expense",
    createdAt: "2026-11-16T10:00:00.000Z",
    updatedAt: "2026-11-16T10:00:00.000Z",
    ...overrides,
  };
}

describe("getSharedExpenseCategoryId", () => {
  it("builds the deterministic id used across devices", () => {
    expect(getSharedExpenseCategoryId("user-a")).toBe("user-a__shared-expense");
  });
});

describe("ensureSharedExpenseCategory", () => {
  it("creates the category once when it is missing", async () => {
    const repository = new FakeSharedExpenseCategoryRepository();

    const categoryId = await ensureSharedExpenseCategory(repository, "user-a");

    expect(categoryId).toBe("user-a__shared-expense");
    expect(repository.ensureCalls).toEqual([
      {
        ownerId: "user-a",
        categoryId: "user-a__shared-expense",
        dto: {
          name: "Gastos compartidos",
          icon: "people-outline",
          color: "#0A7EA4",
          type: "expense",
        },
      },
    ]);
    expect(repository.categories.size).toBe(1);
  });

  it("reuses the stored category on the second call", async () => {
    const repository = new FakeSharedExpenseCategoryRepository();

    await ensureSharedExpenseCategory(repository, "user-a");
    await ensureSharedExpenseCategory(repository, "user-a");

    expect(repository.ensureCalls).toHaveLength(1);
  });

  it("never rewrites an existing or renamed category", async () => {
    const repository = new FakeSharedExpenseCategoryRepository();
    repository.seed(buildCategory({ name: "Viajes" }));

    const categoryId = await ensureSharedExpenseCategory(repository, "user-a");

    expect(categoryId).toBe("user-a__shared-expense");
    expect(repository.ensureCalls).toEqual([]);
    expect(repository.categories.get("user-a__shared-expense")?.name).toBe(
      "Viajes",
    );
  });
});
