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
  it("reverts an expense from the wallet and removes the movement", async () => {
    transactionGet
      .mockResolvedValueOnce(snapshot("transaction-1", transactionDocument()))
      .mockResolvedValueOnce(
        snapshot("wallet-1", walletDocument({ balance: 74.5 })),
      );

    const result = await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionUpdate).toHaveBeenCalledWith(
      walletRef,
      expect.objectContaining({ balance: 100, updatedAt: expect.any(String) }),
    );
    expect(transactionDelete).toHaveBeenCalled();
    expect(result.transaction).toMatchObject({
      id: "transaction-1",
      type: "expense",
      amount: 0,
      ownerId: "user-1",
    });
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

  it("only removes the history entry for an orphaned movement", async () => {
    transactionGet.mockResolvedValueOnce(
      snapshot(
        "transaction-1",
        transactionDocument({ walletId: "-1", walletName: "[Eliminada] Vieja" }),
      ),
    );

    await deleteTransactionOperation("user-1", "transaction-1");

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionDelete).toHaveBeenCalled();
    expect(transactionUpdate).not.toHaveBeenCalled();
  });
});
