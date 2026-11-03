import { beforeEach, describe, expect, it } from "@jest/globals";

import { getTodayIsoDate } from "@/shared/utils/date";
import {
  rememberLastUsedDate,
  resetLastUsedDate,
} from "@/shared/utils/last-used-date-store";

import { Transaction } from "../../types/transaction.types";
import { buildTransactionFormValues } from "../transaction-form-defaults";

function buildTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 10,
    currency: "EUR",
    walletId: "wallet-1",
    categoryId: "category-1",
    concept: "Cena",
    date: "2026-10-20",
    ownerId: "user-1",
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("buildTransactionFormValues", () => {
  beforeEach(() => {
    resetLastUsedDate();
  });

  it("preselects the last used date for a new movement", () => {
    rememberLastUsedDate("2020-01-15");

    expect(buildTransactionFormValues([], null, []).date).toBe("2020-01-15");
  });

  it("keeps the date of the edited movement", () => {
    rememberLastUsedDate("2020-01-15");

    const values = buildTransactionFormValues(
      [],
      buildTransaction({ date: "2019-12-31" }),
      [],
    );

    expect(values.date).toBe("2019-12-31");
  });

  it("falls back to today when there is no session date", () => {
    expect(buildTransactionFormValues([], null, []).date).toBe(
      getTodayIsoDate(),
    );
  });
});
