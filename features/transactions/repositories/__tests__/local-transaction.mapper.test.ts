import { describe, expect, it } from "@jest/globals";

import type { LocalRow } from "@/shared/lib/local-db/local-db.types";

import {
  fromTransactionLocalRow,
  toTransactionLocalRow,
} from "../local-transaction.mapper";
import { buildTransaction } from "./local-transaction.fixtures";

describe("local transaction mapper", () => {
  it("round-trips a movement through its storage row", () => {
    const transaction = buildTransaction();

    expect(
      fromTransactionLocalRow(toTransactionLocalRow(transaction)),
    ).toEqual(transaction);
  });

  it("persists the shared-expense links and the soft-delete stamp", () => {
    const row = toTransactionLocalRow(buildTransaction());

    expect(row.sharedExpenseId).toBe("shared-1");
    expect(row.groupExpenseId).toBe("group-1");
    expect(row.settlementId).toBeNull();
    expect(row.deletedAt).toBeNull();
  });

  it("stores optional fields as null", () => {
    const row = toTransactionLocalRow(
      buildTransaction({
        walletName: undefined,
        notes: undefined,
        sharedExpenseId: undefined,
        groupExpenseId: undefined,
      }),
    );

    expect(row.walletName).toBeNull();
    expect(row.notes).toBeNull();
    expect(row.sharedExpenseId).toBeNull();
    expect(row.groupExpenseId).toBeNull();
  });

  it("falls back to the epoch for malformed audit dates", () => {
    const row = toTransactionLocalRow(
      buildTransaction({ createdAt: "not-a-date", updatedAt: "not-a-date" }),
    );

    expect(row.createdAt).toBe(new Date(0).toISOString());
    expect(row.updatedAt).toBe(new Date(0).toISOString());
  });

  it("drops a row the transaction document mapper rejects", () => {
    const row = toTransactionLocalRow(buildTransaction());

    expect(fromTransactionLocalRow({ ...row, amount: 0 })).toBeNull();
    expect(fromTransactionLocalRow({ ...row, type: "gift" })).toBeNull();
  });

  it("drops a row without an addressable id", () => {
    const row: LocalRow = {
      ...toTransactionLocalRow(buildTransaction()),
      id: null,
    };

    expect(fromTransactionLocalRow(row)).toBeNull();
  });
});
