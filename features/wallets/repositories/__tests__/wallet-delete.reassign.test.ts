import { beforeEach, describe, expect, it } from "@jest/globals";

// Imported first so the Firestore mocks are registered before the operation.
import {
  mockTransactionDelete,
  mockTransactionUpdate,
  movement,
  setupReassignMocks,
  sourceWallet,
  targetWallet,
} from "./wallet-delete.reassign.test-helpers";
import { reassignWalletMovementsAndDelete } from "../wallet-delete.reassign.operation";

beforeEach(setupReassignMocks);

describe("reassignWalletMovementsAndDelete", () => {
  it("applies the net movement balance to the target and moves the movements", async () => {
    const movements = {
      transactions: [
        movement("transaction", "tx-in", {
          walletId: "wallet-1",
          type: "income",
          amount: 50,
        }),
        movement("transaction", "tx-out", {
          walletId: "wallet-1",
          type: "expense",
          amount: 20,
        }),
      ],
      transfers: [
        movement("transfer", "tr-target", {
          fromWalletId: "wallet-1",
          toWalletId: "wallet-2",
          amount: 30,
        }),
        movement("transfer", "tr-from", {
          fromWalletId: "wallet-1",
          toWalletId: "wallet-3",
          amount: 10,
        }),
        movement("transfer", "tr-to", {
          fromWalletId: "wallet-3",
          toWalletId: "wallet-1",
          amount: 5,
        }),
      ],
    };

    const result = await reassignWalletMovementsAndDelete(
      "user-1",
      sourceWallet,
      targetWallet,
      movements,
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "wallets", id: "wallet-2" },
      { balance: 125, updatedAt: expect.any(String) },
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "tx-in" },
      expect.objectContaining({ walletId: "wallet-2" }),
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transaction", id: "tx-out" },
      expect.objectContaining({
        walletId: "wallet-2",
        walletName: { kind: "delete-field" },
      }),
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-target" },
      expect.objectContaining({
        fromWalletId: "-1",
        fromWalletName: "[Eliminada] Cartera wallet-1",
      }),
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-from" },
      expect.objectContaining({
        fromWalletId: "wallet-2",
        fromWalletName: { kind: "delete-field" },
      }),
    );
    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-to" },
      expect.objectContaining({
        toWalletId: "wallet-2",
        toWalletName: { kind: "delete-field" },
      }),
    );
    expect(mockTransactionDelete).toHaveBeenCalledWith({
      kind: "wallets",
      id: "wallet-1",
    });
    expect(result.balance).toBe(125);
  });

  it("orphans the side whose counterpart is the target wallet", async () => {
    const movements = {
      transactions: [],
      transfers: [
        movement("transfer", "tr-to", {
          fromWalletId: "wallet-2",
          toWalletId: "wallet-1",
          amount: 30,
        }),
      ],
    };

    await reassignWalletMovementsAndDelete(
      "user-1",
      sourceWallet,
      targetWallet,
      movements,
    );

    expect(mockTransactionUpdate).toHaveBeenCalledWith(
      { kind: "transfer", id: "tr-to" },
      expect.objectContaining({
        toWalletId: "-1",
        toWalletName: "[Eliminada] Cartera wallet-1",
      }),
    );
  });
});
