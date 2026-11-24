import { describe, expect, it } from "@jest/globals";

import { transactionDocument } from "./transaction-repository.test-helpers";
import { buildDeletedTransactionResult } from "../transaction-delete.result";

describe("buildDeletedTransactionResult", () => {
  it("maps a valid stored movement", () => {
    const result = buildDeletedTransactionResult(
      "transaction-1",
      "user-1",
      transactionDocument(),
      "2026-11-24T10:00:00.000Z",
      3,
      "2026-11-24T10:00:00.000Z",
    );

    expect(result).toMatchObject({
      id: "transaction-1",
      type: "expense",
      amount: 25.5,
      walletId: "wallet-1",
      ownerId: "user-1",
      revision: 3,
      deletedAt: "2026-11-24T10:00:00.000Z",
    });
  });

  it("falls back for a legacy document that cannot be mapped", () => {
    const result = buildDeletedTransactionResult(
      "transaction-1",
      "user-1",
      { type: "income", currency: "USD", walletId: "wallet-1" },
      "2026-11-24T10:00:00.000Z",
      2,
      "2026-11-24T10:00:00.000Z",
    );

    expect(result).toMatchObject({
      id: "transaction-1",
      type: "income",
      amount: 0,
      currency: "USD",
      walletId: "wallet-1",
      categoryId: "",
      ownerId: "user-1",
      revision: 2,
      deletedAt: "2026-11-24T10:00:00.000Z",
    });
  });

  it("defaults an invalid stored currency and wallet in the fallback", () => {
    const result = buildDeletedTransactionResult(
      "transaction-1",
      "user-1",
      { currency: "BTC" },
      "2026-11-24T10:00:00.000Z",
      1,
      "2026-11-24T10:00:00.000Z",
    );

    expect(result).toMatchObject({
      type: "expense",
      currency: "EUR",
      walletId: "",
    });
  });
});
