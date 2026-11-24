import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  transactionDelete,
  transactionGet,
  transactionUpdate,
  transactionDocument,
  setupTransactionRepositoryMocks,
  snapshot,
  walletDocument,
  walletRef,
} from "./transaction-repository.test-helpers";
import { deleteTransactionOperation } from "../transaction-delete.operation";

beforeEach(setupTransactionRepositoryMocks);

describe("deleteTransactionOperation", () => {
  it("reverts an expense from the wallet and soft-deletes the movement", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({ revision: 4 }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );

    const result = await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionUpdate).toHaveBeenCalledWith(
      walletRef,
      expect.objectContaining({
        balance: 100,
        updatedAt: expect.any(String),
        revision: 1,
      }),
    );
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "transaction-1" },
      expect.objectContaining({
        deletedAt: expect.any(String),
        updatedAt: expect.any(String),
        revision: 5,
      }),
    );
    expect(transactionDelete).not.toHaveBeenCalled();
    expect(result.transaction).toMatchObject({
      id: "transaction-1",
      type: "expense",
      amount: 25.5,
      ownerId: "user-1",
      revision: 5,
    });
    expect(result.transaction.deletedAt).toEqual(expect.any(String));
    expect(result.wallets).toEqual([]);
  });

  it("reverts an income from the wallet", async () => {
    transactionGet
      .mockResolvedValueOnce(
        snapshot(
          "transaction-1",
          transactionDocument({ type: "income", amount: 10 }),
        ),
      )
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 110 })),
      );

    await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionUpdate).toHaveBeenCalledWith(
      walletRef,
      expect.objectContaining({ balance: 100 }),
    );
  });

  it("is idempotent for an already soft-deleted movement", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transaction-1",
        transactionDocument({ deletedAt: "2026-11-20T10:00:00.000Z" }),
      ),
    );

    const result = await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).not.toHaveBeenCalled();
    expect(transactionDelete).not.toHaveBeenCalled();
    expect(result.transaction.deletedAt).toBe("2026-11-20T10:00:00.000Z");
    expect(result.transaction.revision).toBe(0);
  });

  it("soft-deletes an orphaned movement without touching a wallet", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transaction-1",
        transactionDocument({ walletId: "-1", walletName: "[Eliminada] Vieja" }),
      ),
    );

    await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionDelete).not.toHaveBeenCalled();
    expect(transactionUpdate).toHaveBeenCalledTimes(1);
    expect(transactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "transaction-1" },
      expect.objectContaining({
        deletedAt: expect.any(String),
        revision: 1,
      }),
    );
  });

  it.each([
    ["sharedExpenseId", "expense-1"],
    ["groupExpenseId", "group-expense-1"],
    ["settlementId", "settlement-1"],
    ["groupSettlementId", "group-settlement-1"],
  ])("rejects a movement linked by %s", async (key, value) => {
    const link =
      key === "settlementId" || key === "groupSettlementId"
        ? { type: "income", [key]: value }
        : { [key]: value };

    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transaction-1",
        transactionDocument(link as Record<string, unknown>),
      ),
    );

    await expect(
      deleteTransactionOperation("user-1", "transaction-1"),
    ).rejects.toMatchObject({ code: "TRANSACTION_INVALID" });
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
