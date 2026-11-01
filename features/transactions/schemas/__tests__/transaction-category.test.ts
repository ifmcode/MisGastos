import { describe, expect, it } from "@jest/globals";

import { Category } from "@/features/categories/types/category.types";

import { TransactionInput } from "../transaction-validation.types";
import { validateTransactionInput } from "../transaction.schema";

const categories: Category[] = [
  {
    id: "user-1__food",
    legacyId: "food",
    name: "Comida",
    icon: "fast-food-outline",
    color: "#EF6C00",
    type: "expense",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
  },
  {
    id: "user-1__salary",
    legacyId: "salary",
    name: "Salario",
    icon: "cash-outline",
    color: "#2E7D32",
    type: "income",
    ownerId: "user-1",
    createdAt: "2026-10-30T10:00:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
  },
];

const baseInput: TransactionInput = {
  type: "expense",
  amount: "10,50",
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "user-1__food",
  concept: "Cena",
  notes: "",
  date: "30/10/2026",
};

function getIssues(input: TransactionInput) {
  const result = validateTransactionInput(input, categories);

  if (result.ok) throw new Error("Expected config validation to fail");

  return result.error;
}

describe("transaction category validation", () => {
  it("accepts document ids and legacy ids", () => {
    expect(validateTransactionInput(baseInput, categories).ok).toBe(true);
    expect(
      validateTransactionInput(
        { ...baseInput, categoryId: "food" },
        categories,
      ).ok,
    ).toBe(true);
  });

  it("rejects missing and unknown categories", () => {
    expect(
      getIssues({ ...baseInput, categoryId: "   " }).map(
        (issue) => issue.code,
      ),
    ).toEqual(["INVALID_CATEGORY"]);
    expect(
      getIssues({ ...baseInput, categoryId: "missing" }).map(
        (issue) => issue.code,
      ),
    ).toEqual(["INVALID_CATEGORY"]);
  });

  it("rejects categories that do not match the movement type", () => {
    expect(
      getIssues({ ...baseInput, categoryId: "user-1__salary" }).map(
        (issue) => issue.code,
      ),
    ).toEqual(["CATEGORY_TYPE_MISMATCH"]);
  });

  it("leaves category existence to the service when metadata is omitted", () => {
    expect(
      validateTransactionInput({ ...baseInput, categoryId: "anything" }).ok,
    ).toBe(true);
  });
});
