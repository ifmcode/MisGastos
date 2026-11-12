import { describe, expect, it, jest } from "@jest/globals";

jest.mock("../../repositories/firebase-transaction.repository", () => ({
  FirebaseTransactionRepository: jest.fn(() => ({
    kind: "transaction-repository",
  })),
}));
jest.mock("@/features/categories/repositories/firebase-category.repository", () => ({
  FirebaseCategoryRepository: jest.fn(() => ({
    kind: "category-repository",
  })),
}));

import { getTransactionService } from "../transaction.factory";

describe("getTransactionService", () => {
  it("reuses one TransactionService instance", () => {
    const service = getTransactionService();

    expect(getTransactionService()).toBe(service);
  });
});
