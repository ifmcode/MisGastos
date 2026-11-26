import { describe, expect, it } from "@jest/globals";

import { SyncMutationError } from "@/shared/services/sync/sync.errors";

import {
  readTransactionDto,
  readTransferDto,
} from "../sync-mutation-snapshots";

const transactionSnapshot = {
  id: "tx-1",
  type: "expense",
  amount: 25.5,
  currency: "EUR",
  walletId: "wallet-1",
  categoryId: "cat-1",
  concept: "Supermercado",
  notes: "Compra semanal",
  date: "2026-11-26",
  deletedAt: null,
};

const transferSnapshot = {
  id: "transfer-1",
  fromWalletId: "wallet-1",
  toWalletId: "wallet-2",
  amount: 10,
  currency: "EUR",
  date: "2026-11-26",
  notes: "Ahorro",
};

describe("readTransactionDto", () => {
  it("rebuilds the movement payload from the local snapshot", () => {
    expect(readTransactionDto(transactionSnapshot)).toEqual({
      id: "tx-1",
      type: "expense",
      amount: 25.5,
      currency: "EUR",
      walletId: "wallet-1",
      categoryId: "cat-1",
      concept: "Supermercado",
      notes: "Compra semanal",
      date: "2026-11-26",
    });
  });

  it("keeps the soft-delete stamp when present", () => {
    expect(
      readTransactionDto({
        ...transactionSnapshot,
        deletedAt: "2026-11-26T10:00:00.000Z",
      }),
    ).toMatchObject({ deletedAt: "2026-11-26T10:00:00.000Z" });
  });

  it.each([
    [{ ...transactionSnapshot, type: "transfer" }],
    [{ ...transactionSnapshot, amount: 0 }],
    [{ ...transactionSnapshot, amount: "25" }],
    [{ ...transactionSnapshot, currency: "XXX" }],
    [{ ...transactionSnapshot, walletId: "" }],
    [{ ...transactionSnapshot, concept: "  " }],
  ])("rejects a malformed snapshot %p", (snapshot) => {
    expect(() => readTransactionDto(snapshot)).toThrow(SyncMutationError);
  });
});

describe("readTransferDto", () => {
  it("rebuilds the transfer payload", () => {
    expect(readTransferDto(transferSnapshot)).toEqual({
      id: "transfer-1",
      fromWalletId: "wallet-1",
      toWalletId: "wallet-2",
      amount: 10,
      currency: "EUR",
      date: "2026-11-26",
      notes: "Ahorro",
    });
  });

  it("drops an empty notes value", () => {
    expect(
      readTransferDto({ ...transferSnapshot, notes: "" }),
    ).not.toHaveProperty("notes");
  });

  it("rejects a missing wallet id", () => {
    expect(() =>
      readTransferDto({ ...transferSnapshot, toWalletId: undefined }),
    ).toThrow(SyncMutationError);
  });
});
